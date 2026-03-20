"""
Event Resource Request Endpoints
Request event PDF resource - name and email sent to admin (same flow as newsletter access).
"""

import base64
import logging
import re
from html import escape
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.v1.models.event_resource_request import (
    EventResourceRequestCreate,
    EventResourceRequestResponse,
)
from app.api.v1.models.user import UserModel
from app.api.v1.repositories.event_resource_request_repository import EventResourceRequestRepository
from app.api.v1.repositories.event_repository import EventRepository
from app.api.v1.services.email_service import EmailService
from app.api.v1.services.azure_blob_service import get_azure_blob_service, AzureBlobServiceError
from app.core.database import get_database
from app.api.v1.dependencies.services import (
    get_current_user,
    get_optional_current_user,
    get_event_repository,
    get_event_guest_registration_repository,
)
from app.api.v1.repositories.event_guest_registration_repository import EventGuestRegistrationRepository

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
    guest_repo: EventGuestRegistrationRepository = Depends(get_event_guest_registration_repository),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
) -> EventResourceRequestResponse:
    try:
        event_id = request_data.event_id
        user_id = current_user.id if current_user else None

        if current_user:
            requester_type = "authenticated"
            user_email = current_user.user_email.lower().strip()
            user_name = f"{current_user.first_name} {current_user.last_name}".strip() or None
            guest_registration_id = None
            company = getattr(current_user, "company", None)
            designation = getattr(current_user, "job_function", None)
            phone = getattr(current_user, "business_phone", None)
        else:
            requester_type = "guest"
            user_email = request_data.user_email.lower().strip()
            guest_registration = await guest_repo.find_by_event_and_email(event_id, user_email)
            if not guest_registration:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Guest resource requests require an existing event registration",
                )

            first_name = (guest_registration.get("first_name") or "").strip()
            last_name = (guest_registration.get("last_name") or "").strip()
            user_name = " ".join(part for part in [first_name, last_name] if part) or None
            guest_registration_id = guest_registration.get("id")
            company = guest_registration.get("company") or None
            designation = guest_registration.get("designation") or None
            phone = guest_registration.get("phone") or None

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
            requester_type=requester_type,
            user_email=user_email,
            user_name=user_name,
            user_id=user_id,
            guest_registration_id=guest_registration_id,
            company=company,
            designation=designation,
            phone=phone,
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
    event_repository: EventRepository = Depends(get_event_repository),
    current_user: UserModel = Depends(require_admin),
) -> EventResourceRequestResponse:
    if action not in ("approve", "deny"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be approve or deny")

    existing = await repo.get_request_by_id(request_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if existing.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request already {existing.get('status')}",
        )

    if action == "approve":
        event = await event_repository.get_by_id(existing["event_id"])
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated event not found")

        pdf_blob_path = (event.get("pdf_url") or "").strip()
        if not pdf_blob_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This event does not have a PDF resource to send",
            )

        try:
            blob_service = get_azure_blob_service()
            file_content, content_type, _ = await blob_service.download_file(pdf_blob_path)
        except AzureBlobServiceError as e:
            logger.error(f"Failed to download event resource PDF for request {request_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch the event PDF from storage",
            )

        event_title = event.get("title") or existing.get("event_title") or "event-resource"
        safe_filename = re.sub(r"[^A-Za-z0-9 _-]", "_", event_title).strip() or "event-resource"
        attachment_name = f"{safe_filename[:80]}.pdf"
        receiver_email = existing["user_email"]
        receiver_name = existing.get("user_name") or receiver_email
        template_path = Path(__file__).resolve().parents[3] / "templates" / "event_resource_approval.html"
        with open(template_path, "r", encoding="utf-8") as f:
            html_template = f.read()

        html_content = html_template.replace("{{receiver_name}}", escape(receiver_name))
        html_content = html_content.replace("{{event_title}}", escape(event_title))
        html_content = html_content.replace("{{attachment_name}}", escape(attachment_name))
        plain_text_content = (
            f"Hello {receiver_name},\n\n"
            f"Your request for the event resource '{event_title}' has been approved.\n"
            f"Please find the PDF attached to this email: {attachment_name}\n\n"
            "If you need anything else related to this event, just reply to this email.\n\n"
            "Best regards,\nPeerislands Team"
        )

        try:
            service = EmailService()
            await service.send_email(
                to_addresses=[receiver_email],
                subject=f"Approved: {event_title} resource",
                html_content=html_content,
                plain_text_content=plain_text_content,
                attachments=[{
                    "name": attachment_name,
                    "content_type": content_type or "application/pdf",
                    "content_bytes": base64.b64encode(file_content).decode("utf-8"),
                }],
            )
        except Exception as e:
            logger.error(f"Failed to send event resource approval email for request {request_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send approval email with the event resource",
            )

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
