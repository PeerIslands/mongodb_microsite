"""
Event Registration Endpoints - API endpoints for event registration operations.

Endpoints:
- POST /event-registrations - Create a new event registration
- POST /event-registrations/send-confirmation - Send registration confirmation email
- GET /event-registrations - Get all registrations (admin)
- GET /event-registrations/user - Get registrations for authenticated user
- GET /event-registrations/event/{event_id} - Get registrations by event ID
- GET /event-registrations/event/{event_id}/count - Get registration count for an event
- GET /event-registrations/event/{event_id}/export - Export registrations to Excel
- GET /event-registrations/{registration_id} - Get a single registration by ID
- PATCH /event-registrations/{registration_id}/status - Update registration status
- DELETE /event-registrations/{registration_id} - Delete a registration
"""

from typing import List, Optional
from io import BytesIO
from datetime import datetime, date
import logging
from fastapi import APIRouter, Depends, Query, status, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

from app.core.config import settings
from app.api.v1.models.event_registration import (
    CreateEventRegistrationRequest,
    CreateEventRegistrationResponse,
    UpdateRegistrationStatusRequest,
    UpdateEventRegistrationResponse,
    EventRegistrationResponse,
    DeleteEventRegistrationResponse,
    EventRegistrationCountResponse,
    SendRegistrationConfirmationRequest,
    SendRegistrationConfirmationResponse,
)
from app.api.v1.services.event_registration_service import EventRegistrationService
from app.api.v1.services.email_service import EmailService
from app.api.v1.dependencies.services import (
    get_event_registration_service,
    get_event_repository,
    get_user_repository,
    get_current_active_user,
    get_event_guest_registration_repository,
    get_event_domain_repository,
)
from app.api.v1.repositories.event_domain_repository import EventDomainRepository
from app.api.v1.models.event_guest_registration import (
    GuestEventRegistrationCreate,
    GuestEventRegistrationResponse,
    VerifyGuestAccessRequest,
    VerifyGuestAccessResponse,
)
from app.api.v1.repositories.event_guest_registration_repository import EventGuestRegistrationRepository
from app.api.v1.models.user import UserModel
from app.api.v1.exceptions.event_registration_exceptions import (
    EventRegistrationNotFoundError,
    DuplicateRegistrationError,
    UserNotFoundForRegistrationError,
    EventNotFoundForRegistrationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/event-registrations")


# =============================================================================
# PUBLIC (no auth) — guest registration via form
# =============================================================================

@router.post(
    "/public",
    response_model=GuestEventRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guest Event Registration (no login required)",
    description="Register for an event without a user account. Collects name, email, company, designation and phone.",
    responses={
        201: {"description": "Registered successfully"},
        404: {"description": "Event not found"},
        409: {"description": "Already registered with this email"},
    },
)
async def guest_register(
    request: GuestEventRegistrationCreate,
    guest_repo: EventGuestRegistrationRepository = Depends(get_event_guest_registration_repository),
    domain_repo: EventDomainRepository = Depends(get_event_domain_repository),
    event_repository=Depends(get_event_repository),
):
    """Public event registration — no JWT required. Domain whitelist enforced."""
    event = await event_repository.get_by_id(request.event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Domain whitelist check
    email_domain = request.email.split("@")[-1].lower().strip()
    is_allowed = await domain_repo.is_domain_whitelisted(email_domain)
    if not is_allowed:
        # Record unique domain request (only notifies once per domain)
        await domain_repo.record_domain_request(email_domain)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="domain_not_whitelisted",
        )

    existing = await guest_repo.find_by_event_and_email(request.event_id, request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered for the event",
        )

    doc = await guest_repo.create(
        event_id=request.event_id,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        company=request.company,
        designation=request.designation,
        phone=request.phone,
    )

    # Send confirmation email for future events (fire-and-forget — never fail the registration)
    event_date_str = event.get("date", "")
    try:
        from datetime import datetime as _dt, date as _date
        event_date = _dt.strptime(event_date_str, "%Y-%m-%d").date()
        is_future = event_date >= _date.today()
    except (ValueError, TypeError):
        is_future = False

    if is_future:
        try:
            event_data = {
                "title": event.get("title", ""),
                "category": event.get("category", ""),
                "date": event.get("date", ""),
                "time": event.get("time", ""),
                "timezone": event.get("timezone", ""),
                "duration_minutes": event.get("duration_minutes", 60),
                "description": event.get("description", ""),
                "attendee_value": event.get("attendee_value", ""),
                "event_type": event.get("event_type", "online"),
                "location": event.get("location", ""),
                "calendar_download_link": f"{settings.FRONTEND_BASE_URL}/events/{request.event_id}/calendar",
            }
            await EmailService.send_event_registration_confirmation_email(
                receiver_email=request.email,
                event_data=event_data,
            )
            logger.info(f"Guest confirmation email sent to {request.email} for event {request.event_id}")
        except Exception as email_err:
            logger.warning(f"Failed to send guest confirmation email: {email_err}")

    return GuestEventRegistrationResponse(**doc)


@router.post(
    "/public/verify-access",
    response_model=VerifyGuestAccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify guest access to a past event",
    description="Checks whether an email address has a guest registration for the given event. Used by returning users who registered previously but are no longer in the same browser session.",
    responses={
        200: {"description": "Email found — access granted"},
        404: {"description": "No registration found for this email"},
    },
)
async def verify_guest_access(
    request: VerifyGuestAccessRequest,
    guest_repo: EventGuestRegistrationRepository = Depends(get_event_guest_registration_repository),
    event_repository=Depends(get_event_repository),
):
    """Verify a guest registration by email. Returns first_name on success."""
    event = await event_repository.get_by_id(request.event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    doc = await guest_repo.find_by_event_and_email(request.event_id, str(request.email))
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registration found for this email address.",
        )

    return VerifyGuestAccessResponse(
        email=doc["email"],
        first_name=doc.get("first_name", ""),
    )


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "",
    response_model=CreateEventRegistrationResponse,
    summary="Create New Event Registration",
    description="""
    Create a new event registration for the authenticated user.
    
    **Required fields:**
    - `event_id`: Event ID (must exist in the system)
    
    **Authentication:** Required (JWT Bearer token)
    
    **Behavior:**
    - If no registration exists: Creates new registration (201 Created)
    - If registration exists with CANCELLED status: Re-registers by updating status (200 OK)
    - If registration exists with REGISTERED status: Returns conflict (409 Conflict)
    
    **Note:** 
    - User ID is extracted from the JWT token
    - A confirmation email is automatically sent to the user
    """,
    responses={
        200: {"description": "Re-registered successfully (status updated from CANCELLED to REGISTERED)"},
        201: {"description": "Registered successfully and confirmation email sent"},
        401: {"description": "Not authenticated"},
        404: {"description": "Event not found"},
        409: {"description": "User already registered for this event"},
        422: {"description": "Validation error"},
        500: {"description": "Failed to send confirmation email"},
    },
)
async def create_registration(
    request: CreateEventRegistrationRequest,
    current_user: UserModel = Depends(get_current_active_user),
    service: EventRegistrationService = Depends(get_event_registration_service),
    event_repository=Depends(get_event_repository),
):
    """Create a new event registration for the authenticated user and send confirmation email."""
    try:
        # Get user details from JWT token
        user_id = current_user.id
        user_email = current_user.user_email
        
        logger.info(f"Creating registration for user {user_id} ({user_email}) for event {request.event_id}")
        
        # Validate that event exists first
        event = await event_repository.get_by_id(request.event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event not found: {request.event_id}",
            )
        
        # Create or re-register using user_id from token
        result, is_new_registration = await service.create_registration(
            user_id=user_id,
            event_id=request.event_id,
        )
        
        # Skip confirmation email for past events (user is registering to access recording/resources)
        event_date_str = event.get('date', '')
        try:
            event_date = datetime.strptime(event_date_str, "%Y-%m-%d").date()
            is_past_event = event_date < date.today()
        except (ValueError, TypeError):
            is_past_event = False
        
        if not is_past_event:
            # Build calendar download link (frontend route that proxies to backend)
            calendar_download_link = f"{settings.FRONTEND_BASE_URL}/events/{request.event_id}/calendar"
            
            # Prepare event data for email
            event_data = {
                'title': event.get('title', ''),
                'category': event.get('category', ''),
                'date': event.get('date', ''),
                'time': event.get('time', ''),
                'timezone': event.get('timezone', ''),
                'duration_minutes': event.get('duration_minutes', 60),
                'description': event.get('description', ''),
                'attendee_value': event.get('attendee_value', ''),
                'event_type': event.get('event_type', 'online'),
                'location': event.get('location', ''),
                'calendar_download_link': calendar_download_link,
            }
            
            # Send confirmation email (synchronously - fail if email fails)
            logger.info(f"Sending confirmation email to {user_email}")
            email_sent = await EmailService.send_event_registration_confirmation_email(
                receiver_email=user_email,
                event_data=event_data,
            )
            
            if not email_sent:
                # Rollback: Delete the registration if email fails (only for new registrations)
                if is_new_registration:
                    logger.error(f"Email failed, rolling back registration {result.id}")
                    await service.delete_registration(result.id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send confirmation email. Registration cancelled.",
                )
            logger.info(f"Registration {'created' if is_new_registration else 'updated'} and email sent successfully: {result.id}")
        else:
            logger.info(f"Registration {'created' if is_new_registration else 'updated'} for past event (no email sent): {result.id}")
        
        # Determine HTTP status code based on whether it's a new registration or re-registration
        http_status = status.HTTP_201_CREATED if is_new_registration else status.HTTP_200_OK
        
        return JSONResponse(
            status_code=http_status,
            content=result.model_dump(),
        )
        
    except UserNotFoundForRegistrationError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except EventNotFoundForRegistrationError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except DuplicateRegistrationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create registration: {str(e)}",
        )


async def send_confirmation_email_background(receiver_email: str, event_data: dict):
    """
    Background task to send registration confirmation email.
    This runs asynchronously after the response is sent to the user.
    """
    try:
        logger.info(f"Background task: Sending registration confirmation email to {receiver_email}")
        await EmailService.send_event_registration_confirmation_email(receiver_email, event_data)
        logger.info("Background task: Registration confirmation email sent successfully")
    except Exception as e:
        logger.error(f"Background task: Failed to send registration confirmation email: {e}")


@router.post(
    "/send-confirmation",
    response_model=SendRegistrationConfirmationResponse,
    status_code=status.HTTP_200_OK,
    summary="Send Registration Confirmation Email",
    description="""
    Send a registration confirmation email to the user.
    
    **Required fields:**
    - `receiver_email`: Email address to send confirmation to
    - `event_id`: Event ID to fetch details from (must exist in the system)
    
    **Note:** The email is sent in the background for faster response.
    """,
    responses={
        200: {"description": "Confirmation email queued for sending"},
        404: {"description": "Event not found"},
        422: {"description": "Validation error"},
    },
)
async def send_registration_confirmation(
    request: SendRegistrationConfirmationRequest,
    background_tasks: BackgroundTasks,
) -> SendRegistrationConfirmationResponse:
    """Send registration confirmation email."""
    try:
        # Get event repository to fetch event details
        event_repository = get_event_repository()
        
        # Fetch event details from database
        event = await event_repository.get_by_id(request.event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event not found: {request.event_id}",
            )
        
        # Build calendar download link (frontend route that proxies to backend)
        event_id = request.event_id
        calendar_download_link = f"{settings.FRONTEND_BASE_URL}/events/{event_id}/calendar"
        
        # Prepare event data for email
        event_data = {
            'title': event.get('title', ''),
            'category': event.get('category', ''),
            'date': event.get('date', ''),
            'time': event.get('time', ''),
            'timezone': event.get('timezone', ''),
            'duration_minutes': event.get('duration_minutes', 60),
            'description': event.get('description', ''),
            'attendee_value': event.get('attendee_value', ''),
            'event_type': event.get('event_type', 'online'),
            'location': event.get('location', ''),
            'calendar_download_link': calendar_download_link,
        }
        
        # Add email sending to background tasks
        background_tasks.add_task(
            send_confirmation_email_background,
            request.receiver_email,
            event_data
        )
        
        logger.info(f"Registration confirmation email queued for {request.receiver_email}")
        
        return SendRegistrationConfirmationResponse(
            success=True,
            message="Confirmation email has been queued for sending"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to queue confirmation email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send confirmation email: {str(e)}",
        )


@router.get(
    "",
    response_model=List[EventRegistrationResponse],
    summary="Get All Registrations",
    description="""
    Retrieve all event registrations with optional filtering.
    
    **Filters:**
    - `status`: Filter by status (REGISTERED, CANCELLED)
    
    **Returns:** List of registrations sorted by registration date (newest first).
    """,
)
async def get_all_registrations(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED)"
    ),
    service: EventRegistrationService = Depends(get_event_registration_service),
) -> List[EventRegistrationResponse]:
    """Get all registrations with optional filters."""
    return await service.get_all_registrations(status=status)


@router.get(
    "/user",
    response_model=List[EventRegistrationResponse],
    summary="Get My Registrations",
    description="""
    Retrieve all registrations for the authenticated user.
    
    **Authentication:** Required (JWT Bearer token)
    
    **Filters:**
    - `status`: Filter by status (REGISTERED, CANCELLED)
    
    **Returns:** List of registrations sorted by registration date (newest first).
    """,
)
async def get_registrations_by_user(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED)"
    ),
    current_user: UserModel = Depends(get_current_active_user),
    service: EventRegistrationService = Depends(get_event_registration_service),
) -> List[EventRegistrationResponse]:
    """Get all registrations for the authenticated user."""
    return await service.get_registrations_by_user(current_user.id, status=status)


@router.get(
    "/event/{event_id}",
    response_model=List[EventRegistrationResponse],
    summary="Get Registrations by Event ID",
    description="""
    Retrieve all registrations for a specific event.
    
    **Filters:**
    - `status`: Filter by status (REGISTERED, CANCELLED)
    
    **Returns:** List of registrations sorted by registration date (newest first).
    """,
)
async def get_registrations_by_event(
    event_id: str,
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED)"
    ),
    service: EventRegistrationService = Depends(get_event_registration_service),
) -> List[EventRegistrationResponse]:
    """Get all registrations for a specific event."""
    return await service.get_registrations_by_event(event_id, status=status)


@router.get(
    "/event/{event_id}/count",
    response_model=EventRegistrationCountResponse,
    summary="Get Registration Count for Event",
    description="""
    Get the count of registrations for a specific event.
    
    **Filters:**
    - `status`: Filter by status (REGISTERED, CANCELLED)
    
    **Returns:** Event ID and registration count.
    """,
)
async def get_registration_count_by_event(
    event_id: str,
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED)"
    ),
    service: EventRegistrationService = Depends(get_event_registration_service),
) -> EventRegistrationCountResponse:
    """Get registration count for a specific event."""
    return await service.get_registration_count_by_event(event_id, status=status)


@router.get(
    "/event/{event_id}/export",
    summary="Export Event Registrations to Excel",
    description="""
    Export all registrations for a specific event to an Excel file.
    
    The Excel file includes:
    - Event title (for reference)
    - User details: Email, First Name, Last Name, Company, Designation, Phone Number
    - Registration details: Status, Registration Date
    
    **Returns:** Excel file download (.xlsx)
    """,
    responses={
        200: {
            "description": "Excel file download",
            "content": {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}
            },
        },
        404: {"description": "Event not found"},
    },
)
async def export_event_registrations(
    event_id: str,
    service: EventRegistrationService = Depends(get_event_registration_service),
    event_repository=Depends(get_event_repository),
    user_repository=Depends(get_user_repository),
    guest_repo: EventGuestRegistrationRepository = Depends(get_event_guest_registration_repository),
):
    """Export all registrations (accounts + guests) for a specific event to an Excel file."""
    try:
        event = await event_repository.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Event not found: {event_id}")

        event_title = event.get("title", "Unknown Event")

        # Fetch both account and guest registrations
        account_registrations = await service.get_registrations_by_event(event_id)
        guest_registrations = await guest_repo.get_by_event(event_id)

        # Normalise into a single list of dicts for rendering
        all_rows = []

        for reg in account_registrations:
            user = await user_repository.get_user_by_id(reg.user_id)
            if user:
                all_rows.append({
                    "email": user.get("user_email", "N/A"),
                    "first_name": user.get("first_name", "N/A"),
                    "last_name": user.get("last_name", "N/A"),
                    "company": user.get("company", "N/A"),
                    "designation": user.get("job_function", "N/A"),
                    "phone": user.get("business_phone", "N/A"),
                    "status": reg.status,
                    "registered_at": reg.registered_at,
                    "type": "Account",
                })
            else:
                all_rows.append({
                    "email": "User not found",
                    "first_name": "N/A", "last_name": "N/A",
                    "company": "N/A", "designation": "N/A", "phone": "N/A",
                    "status": reg.status,
                    "registered_at": reg.registered_at,
                    "type": "Account",
                })

        for g in guest_registrations:
            all_rows.append({
                "email": g.get("email", ""),
                "first_name": g.get("first_name", ""),
                "last_name": g.get("last_name", ""),
                "company": g.get("company", ""),
                "designation": g.get("designation", ""),
                "phone": g.get("phone", ""),
                "status": g.get("status", "REGISTERED"),
                "registered_at": g.get("registered_at", ""),
                "type": "Guest",
            })

        wb = Workbook()
        ws = wb.active
        ws.title = "Registrations"

        header_font = Font(bold=True, color="FFFFFF", size=12)
        header_fill = PatternFill(start_color="5B6CFF", end_color="5B6CFF", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center")
        thin_border = Border(
            left=Side(style="thin"), right=Side(style="thin"),
            top=Side(style="thin"), bottom=Side(style="thin"),
        )

        ws.merge_cells("A1:I1")
        ws["A1"].value = f"Registrations for: {event_title}"
        ws["A1"].font = Font(bold=True, size=14)
        ws["A1"].alignment = Alignment(horizontal="center", vertical="center")

        ws.merge_cells("A2:I2")
        ws["A2"].value = f"Exported on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ws["A2"].font = Font(italic=True, size=10)
        ws["A2"].alignment = Alignment(horizontal="center", vertical="center")

        headers = ["Email", "First Name", "Last Name", "Company", "Designation",
                   "Phone Number", "Registration Status", "Registration Date", "Type"]

        header_row = 4
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=header_row, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        data_start_row = 5
        for idx, row in enumerate(all_rows):
            current_row = data_start_row + idx
            row_data = [
                row["email"], row["first_name"], row["last_name"],
                row["company"], row["designation"], row["phone"],
                row["status"], row["registered_at"], row["type"],
            ]
            for col, value in enumerate(row_data, 1):
                cell = ws.cell(row=current_row, column=col, value=value)
                cell.border = thin_border
                cell.alignment = Alignment(vertical="center")

        column_widths = {
            "A": 35, "B": 15, "C": 15, "D": 25,
            "E": 20, "F": 18, "G": 18, "H": 22, "I": 10,
        }
        for col_letter, width in column_widths.items():
            ws.column_dimensions[col_letter].width = width

        registered_count = sum(1 for r in all_rows if r["status"] == "REGISTERED")
        guest_count = sum(1 for r in all_rows if r["type"] == "Guest")
        total_row = data_start_row + len(all_rows) + 1
        ws.cell(row=total_row, column=1, value=f"Total Registered: {registered_count}").font = Font(bold=True)
        ws.cell(row=total_row + 1, column=1, value=f"  — of which guests: {guest_count}").font = Font(bold=True)

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in event_title)[:50]
        filename = f"{safe_title}_registrations_{datetime.now().strftime('%Y%m%d')}.xlsx"

        logger.info(f"Exported {len(all_rows)} registrations for event {event_id} ({guest_count} guests)")

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export registrations: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to export: {str(e)}")


@router.get(
    "/{registration_id}",
    response_model=EventRegistrationResponse,
    summary="Get Registration by ID",
    description="Retrieve a single registration by its unique ID.",
    responses={
        200: {"description": "Registration found"},
        404: {"description": "Registration not found"},
    },
)
async def get_registration_by_id(
    registration_id: str,
    service: EventRegistrationService = Depends(get_event_registration_service),
) -> EventRegistrationResponse:
    """Get a single registration by its unique ID."""
    try:
        return await service.get_registration_by_id(registration_id)
    except EventRegistrationNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.patch(
    "/{registration_id}/status",
    response_model=UpdateEventRegistrationResponse,
    summary="Update Registration Status",
    description="""
    Update the status of an existing registration.
    
    **Authentication:** Required (JWT Bearer token)
    
    **Required fields:**
    - `status`: New status (REGISTERED or CANCELLED)
    
    **Validation:**
    - The authenticated user must be the owner of the registration
    
    **Behavior:**
    - When status is changed to CANCELLED, a cancellation email is sent to the user
    """,
    responses={
        200: {"description": "Registration status updated successfully"},
        401: {"description": "Not authenticated"},
        403: {"description": "User is not authorized to update this registration"},
        404: {"description": "Registration not found"},
        422: {"description": "Validation error"},
        500: {"description": "Failed to send cancellation email"},
    },
)
async def update_registration_status(
    registration_id: str,
    request: UpdateRegistrationStatusRequest,
    current_user: UserModel = Depends(get_current_active_user),
    service: EventRegistrationService = Depends(get_event_registration_service),
    event_repository=Depends(get_event_repository),
) -> UpdateEventRegistrationResponse:
    """Update the status of an existing registration."""
    try:
        # Get the registration to validate ownership
        registration = await service.get_registration_by_id(registration_id)
        
        # Validate that the authenticated user owns this registration
        if registration.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this registration",
            )
        
        # Check if status is being changed to CANCELLED
        from app.api.v1.models.event_registration import RegistrationStatus
        is_cancelling = request.status == RegistrationStatus.CANCELLED
        
        # If cancelling, prepare to send cancellation email
        if is_cancelling:
            # Fetch event details for the email
            event = await event_repository.get_by_id(registration.event_id)
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Event not found: {registration.event_id}",
                )
            
            # Prepare event data for cancellation email
            event_data = {
                'title': event.get('title', ''),
                'category': event.get('category', ''),
                'date': event.get('date', ''),
                'time': event.get('time', ''),
                'timezone': event.get('timezone', ''),
            }
            
            # Update the status first
            result = await service.update_registration_status(registration_id, request)
            
            # Send cancellation email synchronously
            user_email = current_user.user_email
            logger.info(f"Sending cancellation email to {user_email} for event {registration.event_id}")
            
            email_sent = await EmailService.send_event_registration_cancellation_email(
                receiver_email=user_email,
                event_data=event_data,
            )
            
            if not email_sent:
                # Rollback: Revert the status back to REGISTERED if email fails
                logger.error(f"Cancellation email failed, rolling back status for registration {registration_id}")
                rollback_request = UpdateRegistrationStatusRequest(status=RegistrationStatus.REGISTERED)
                await service.update_registration_status(registration_id, rollback_request)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send cancellation email. Status update cancelled.",
                )
            
            logger.info(f"Registration {registration_id} cancelled and email sent successfully")
            return result
        
        # For non-cancellation status updates, just update the status
        return await service.update_registration_status(registration_id, request)
        
    except EventRegistrationNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating registration status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update registration status: {str(e)}",
        )


@router.delete(
    "/{registration_id}",
    response_model=DeleteEventRegistrationResponse,
    summary="Delete Registration",
    description="Delete a registration by its unique ID.",
    responses={
        200: {"description": "Registration deleted successfully"},
        404: {"description": "Registration not found"},
    },
)
async def delete_registration(
    registration_id: str,
    service: EventRegistrationService = Depends(get_event_registration_service),
) -> DeleteEventRegistrationResponse:
    """Delete a registration by its unique ID."""
    try:
        return await service.delete_registration(registration_id)
    except EventRegistrationNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
