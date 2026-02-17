"""
Newsletter Access Control API Endpoints
Handles newsletter access requests and permissions
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.models.newsletter_access import (
    NewsletterAccessRequestCreate,
    NewsletterAccessRequestResponse,
    NewsletterAccessAction,
    NewsletterAccessCheckResponse,
    PendingRequestsCountResponse
)
from app.api.v1.models.user import UserModel
from app.api.v1.repositories.newsletter_access_repository import NewsletterAccessRepository
from app.core.database import get_database
from app.api.v1.dependencies.services import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Dependency Injection
# =============================================================================

def get_newsletter_access_repository() -> NewsletterAccessRepository:
    """Dependency to get newsletter access repository instance."""
    db = get_database()
    return NewsletterAccessRepository(db)


def require_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """Dependency to require admin role."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


# =============================================================================
# Public Endpoints (No Auth Required)
# =============================================================================

@router.post(
    "/request",
    response_model=NewsletterAccessRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request Newsletter Access",
    description="Request access to view newsletters (Public endpoint - no auth required)"
)
async def request_newsletter_access(
    request_data: NewsletterAccessRequestCreate,
    repo: NewsletterAccessRepository = Depends(get_newsletter_access_repository),
    current_user: Optional[UserModel] = Depends(get_optional_current_user)
) -> NewsletterAccessRequestResponse:
    """
    Request access to view newsletters.
    
    **Public endpoint - no authentication required**
    
    - Users can request access by providing their email
    - If authenticated, user_id is automatically captured
    - Prevents duplicate pending/approved requests
    - Admin will be notified to approve/deny
    """
    try:
        user_email = request_data.user_email
        user_id = current_user.id if current_user else None
        newsletter_id = request_data.newsletter_id
        
        # Check for existing request
        existing = await repo.check_existing_request(user_email, newsletter_id)
        if existing:
            if existing["status"] == "approved":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You already have access to newsletters"
                )
            elif existing["status"] == "pending":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You already have a pending access request"
                )
        
        # Create new request
        request_id = await repo.create_request(
            user_email=user_email,
            user_id=user_id,
            newsletter_id=newsletter_id
        )
        
        # Fetch created request
        created_request = await repo.get_request_by_id(request_id)
        
        logger.info(f"📬 Newsletter access requested by {user_email}")
        
        return NewsletterAccessRequestResponse(**created_request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating newsletter access request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create access request"
        )


@router.get(
    "/check",
    response_model=NewsletterAccessCheckResponse,
    summary="Check Newsletter Access",
    description="Check if user has access to newsletters (Public endpoint - no auth required)"
)
async def check_newsletter_access(
    user_email: str,
    newsletter_id: Optional[str] = None,
    repo: NewsletterAccessRepository = Depends(get_newsletter_access_repository)
) -> NewsletterAccessCheckResponse:
    """
    Check if a user has access to newsletters.
    
    **Public endpoint - no authentication required**
    
    - Returns access status for the given email
    - Checks for approved access
    - Indicates if there's a pending request
    """
    try:
        # Check if user has approved access
        has_access = await repo.has_access(user_email, newsletter_id)
        
        # Check for pending request
        pending = await repo.check_existing_request(user_email, newsletter_id)
        has_pending = pending is not None and pending["status"] == "pending"
        
        if has_access:
            message = "Access granted"
        elif has_pending:
            message = "Access request pending admin approval"
        else:
            message = "No access - please request access"
        
        return NewsletterAccessCheckResponse(
            has_access=has_access,
            user_email=user_email,
            pending_request=has_pending,
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error checking newsletter access: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check access"
        )


# =============================================================================
# Admin Endpoints (Auth Required)
# =============================================================================

@router.get(
    "/admin/pending",
    response_model=List[NewsletterAccessRequestResponse],
    summary="Get Pending Access Requests",
    description="Get all pending newsletter access requests (Admin only)"
)
async def get_pending_requests(
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(require_admin),
    repo: NewsletterAccessRepository = Depends(get_newsletter_access_repository)
) -> List[NewsletterAccessRequestResponse]:
    """
    Get all pending access requests.
    
    **Admin only**
    
    - Returns list of pending requests
    - Sorted by requested_at (newest first)
    - Supports pagination
    """
    try:
        requests = await repo.get_pending_requests(skip=skip, limit=limit)
        return [NewsletterAccessRequestResponse(**req) for req in requests]
        
    except Exception as e:
        logger.error(f"Error fetching pending requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending requests"
        )


@router.get(
    "/admin/pending/count",
    response_model=PendingRequestsCountResponse,
    summary="Get Pending Requests Count",
    description="Get count of pending access requests for notification badge (Admin only)"
)
async def get_pending_count(
    current_user: UserModel = Depends(require_admin),
    repo: NewsletterAccessRepository = Depends(get_newsletter_access_repository)
) -> PendingRequestsCountResponse:
    """
    Get count of pending access requests.
    
    **Admin only**
    
    - Returns count for notification badge
    - Used to show unread notification count
    """
    try:
        count = await repo.get_pending_count()
        return PendingRequestsCountResponse(count=count)
        
    except Exception as e:
        logger.error(f"Error fetching pending count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending count"
        )


@router.get(
    "/admin/all",
    response_model=List[NewsletterAccessRequestResponse],
    summary="Get All Access Requests",
    description="Get all newsletter access requests with optional status filter (Admin only)"
)
async def get_all_requests(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(require_admin),
    repo: NewsletterAccessRepository = Depends(get_newsletter_access_repository)
) -> List[NewsletterAccessRequestResponse]:
    """
    Get all access requests with optional status filter.
    
    **Admin only**
    
    - Filter by status: pending, approved, denied
    - Sorted by requested_at (newest first)
    - Supports pagination
    """
    try:
        requests = await repo.get_all_requests(status=status_filter, skip=skip, limit=limit)
        return [NewsletterAccessRequestResponse(**req) for req in requests]
        
    except Exception as e:
        logger.error(f"Error fetching all requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch requests"
        )


@router.post(
    "/admin/action",
    response_model=dict,
    summary="Approve or Deny Access Request",
    description="Approve or deny a newsletter access request (Admin only)"
)
async def handle_access_action(
    action_data: NewsletterAccessAction,
    current_user: UserModel = Depends(require_admin),
    repo: NewsletterAccessRepository = Depends(get_newsletter_access_repository)
) -> dict:
    """
    Approve or deny an access request.
    
    **Admin only**
    
    - Action can be "approve" or "deny"
    - Optional admin note can be provided
    - Admin user ID is recorded
    """
    try:
        request_id = action_data.request_id
        action = action_data.action
        admin_note = action_data.admin_note
        
        # Check if request exists
        request = await repo.get_request_by_id(request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access request not found"
            )
        
        if request["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Request already {request['status']}"
            )
        
        # Perform action
        if action == "approve":
            success = await repo.approve_request(
                request_id=request_id,
                admin_user_id=current_user.id,
                admin_note=admin_note
            )
            message = "Access request approved"
            logger.info(f"✅ Access request {request_id} approved by admin {current_user.user_email}")
        else:  # deny
            success = await repo.deny_request(
                request_id=request_id,
                admin_user_id=current_user.id,
                admin_note=admin_note
            )
            message = "Access request denied"
            logger.info(f"❌ Access request {request_id} denied by admin {current_user.user_email}")
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process action"
            )
        
        return {
            "success": True,
            "message": message,
            "request_id": request_id,
            "action": action
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling access action: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process action"
        )


@router.delete(
    "/admin/{request_id}",
    response_model=dict,
    summary="Delete Access Request",
    description="Delete a newsletter access request (Admin only)"
)
async def delete_access_request(
    request_id: str,
    current_user: UserModel = Depends(require_admin),
    repo: NewsletterAccessRepository = Depends(get_newsletter_access_repository)
) -> dict:
    """
    Delete an access request.
    
    **Admin only**
    
    - Permanently removes the request
    - Cannot be undone
    """
    try:
        success = await repo.delete_request(request_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Access request not found"
            )
        
        logger.info(f"🗑️ Access request {request_id} deleted by admin {current_user.user_email}")
        
        return {
            "success": True,
            "message": "Access request deleted",
            "request_id": request_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting access request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete request"
        )
