"""
Event Resource Request Endpoints
Request event PDF resource - name and email sent to admin (same flow as newsletter access).
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.v1.models.event_resource_request import (
    EventResourceRequestCreate,
    EventResourceRequestResponse,
)
from app.api.v1.models.user import UserModel
from app.api.v1.repositories.event_resource_request_repository import EventResourceRequestRepository
from app.api.v1.repositories.event_repository import EventRepository
from app.core.database import get_database
from app.api.v1.dependencies.services import get_current_user, get_optional_current_user, get_event_repository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/event-resource-requests")


def get_event_resource_request_repository() -> EventResourceRequestRepository:
    db = get_database()
    return EventResourceRequestRepository(db)


def require_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


# =============================================================================
# Public: Request resource (no auth required; optional auth for user_id/name)
# =============================================================================

@router.post(
    "/request",
    response_model=EventResourceRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request Event Resource",
    description="Request the event PDF resource. Name and email are sent to admin (same as newsletter access).",
)
async def request_event_resource(
    request_data: EventResourceRequestCreate,
    repo: EventResourceRequestRepository = Depends(get_event_resource_request_repository),
    event_repository: EventRepository = Depends(get_event_repository),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
) -> EventResourceRequestResponse:
    try:
        event_id = request_data.event_id
        user_email = request_data.user_email
        user_name = request_data.user_name
        if current_user and not user_name:
            user_name = f"{current_user.first_name} {current_user.last_name}".strip() or None
        user_id = current_user.id if current_user else None

        # Validate event exists and get title
        event = await event_repository.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        event_title = event.get("title")

        existing = await repo.check_existing_pending(event_id, user_email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a pending request for this resource.",
            )

        request_id = await repo.create_request(
            event_id=event_id,
            user_email=user_email,
            user_name=user_name,
            user_id=user_id,
            event_title=event_title,
        )
        created = await repo.get_request_by_id(request_id)
        logger.info(f"Event resource requested: event_id={event_id} by {user_email}")
        return EventResourceRequestResponse(**created)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating event resource request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create request",
        )


# =============================================================================
# Admin: Pending list, count, all list, approve/deny, delete
# =============================================================================

@router.get(
    "/admin/pending",
    response_model=List[EventResourceRequestResponse],
    summary="Get Pending Event Resource Requests (Admin)",
)
async def get_pending_event_resource_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: EventResourceRequestRepository = Depends(get_event_resource_request_repository),
    current_user: UserModel = Depends(require_admin),
) -> List[EventResourceRequestResponse]:
    requests = await repo.get_pending_requests(skip=skip, limit=limit)
    return [EventResourceRequestResponse(**r) for r in requests]


@router.get(
    "/admin/pending/count",
    summary="Get Pending Event Resource Requests Count (Admin)",
)
async def get_pending_event_resource_requests_count(
    repo: EventResourceRequestRepository = Depends(get_event_resource_request_repository),
    current_user: UserModel = Depends(require_admin),
) -> dict:
    count = await repo.get_pending_count()
    return {"count": count}


@router.get(
    "/admin/requests",
    response_model=List[EventResourceRequestResponse],
    summary="Get All Event Resource Requests (Admin)",
)
async def get_all_event_resource_requests(
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, approved, denied"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: EventResourceRequestRepository = Depends(get_event_resource_request_repository),
    current_user: UserModel = Depends(require_admin),
) -> List[EventResourceRequestResponse]:
    requests = await repo.get_all_requests(status=status_filter, skip=skip, limit=limit)
    return [EventResourceRequestResponse(**r) for r in requests]


@router.patch(
    "/admin/{request_id}",
    response_model=EventResourceRequestResponse,
    summary="Approve or Deny Event Resource Request (Admin)",
)
async def update_event_resource_request_status(
    request_id: str,
    action: str = Query(..., description="approve or deny"),
    admin_note: Optional[str] = Query(None),
    repo: EventResourceRequestRepository = Depends(get_event_resource_request_repository),
    current_user: UserModel = Depends(require_admin),
) -> EventResourceRequestResponse:
    if action not in ("approve", "deny"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be approve or deny")
    updated = await repo.update_status(
        request_id=request_id,
        status="approved" if action == "approve" else "denied",
        resolved_by=current_user.user_email,
        admin_note=admin_note,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return EventResourceRequestResponse(**updated)


@router.delete(
    "/admin/{request_id}",
    summary="Delete Event Resource Request (Admin)",
)
async def delete_event_resource_request(
    request_id: str,
    repo: EventResourceRequestRepository = Depends(get_event_resource_request_repository),
    current_user: UserModel = Depends(require_admin),
) -> dict:
    deleted = await repo.delete_request(request_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    logger.info(f"Event resource request {request_id} deleted by {current_user.user_email}")
    return {"message": "Request deleted"}
