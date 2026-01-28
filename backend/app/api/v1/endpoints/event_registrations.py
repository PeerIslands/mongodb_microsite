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
from datetime import datetime
import logging
from fastapi import APIRouter, Depends, Query, status, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
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
)
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
# ENDPOINTS
# =============================================================================

@router.post(
    "",
    response_model=CreateEventRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Event Registration",
    description="""
    Create a new event registration for the authenticated user.
    
    **Required fields:**
    - `event_id`: Event ID (must exist in the system)
    
    **Authentication:** Required (JWT Bearer token)
    
    **Note:** 
    - User ID is extracted from the JWT token
    - A user can only register once for each event
    - A confirmation email is automatically sent to the user
    """,
    responses={
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
) -> CreateEventRegistrationResponse:
    """Create a new event registration for the authenticated user and send confirmation email."""
    try:
        # Get user details from JWT token
        user_id = current_user.id
        user_email = current_user.user_email
        
        logger.info(f"Creating registration for user {user_id} ({user_email}) for event {request.event_id}")
        
        # Create registration using user_id from token
        result = await service.create_registration(
            user_id=user_id,
            event_id=request.event_id,
        )
        
        # Fetch event details for confirmation email
        event = await event_repository.get_by_id(request.event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event not found: {request.event_id}",
            )
        
        # Build calendar download link
        calendar_download_link = f"{settings.BACKEND_BASE_URL}/api/v1/events/{request.event_id}/calendar"
        
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
            # Rollback: Delete the registration if email fails
            logger.error(f"Email failed, rolling back registration {result.id}")
            await service.delete_registration(result.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send confirmation email. Registration cancelled.",
            )
        
        logger.info(f"Registration created and email sent successfully: {result.id}")
        return result
        
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
        
        # Build calendar download link
        event_id = request.event_id
        calendar_download_link = f"{settings.BACKEND_BASE_URL}/api/v1/events/{event_id}/calendar"
        
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
    - `status`: Filter by status (REGISTERED, CANCELLED, ATTENDED)
    
    **Returns:** List of registrations sorted by registration date (newest first).
    """,
)
async def get_all_registrations(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED, ATTENDED)"
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
    - `status`: Filter by status (REGISTERED, CANCELLED, ATTENDED)
    
    **Returns:** List of registrations sorted by registration date (newest first).
    """,
)
async def get_registrations_by_user(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED, ATTENDED)"
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
    - `status`: Filter by status (REGISTERED, CANCELLED, ATTENDED)
    
    **Returns:** List of registrations sorted by registration date (newest first).
    """,
)
async def get_registrations_by_event(
    event_id: str,
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED, ATTENDED)"
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
    - `status`: Filter by status (REGISTERED, CANCELLED, ATTENDED)
    
    **Returns:** Event ID and registration count.
    """,
)
async def get_registration_count_by_event(
    event_id: str,
    status: Optional[str] = Query(
        default=None,
        description="Filter by status (REGISTERED, CANCELLED, ATTENDED)"
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
):
    """Export all registrations for a specific event to an Excel file."""
    try:
        # Fetch event details
        event = await event_repository.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event not found: {event_id}",
            )
        
        event_title = event.get("title", "Unknown Event")
        
        # Fetch all registrations for this event
        registrations = await service.get_registrations_by_event(event_id)
        
        # Create Excel workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Registrations"
        
        # Define styles
        header_font = Font(bold=True, color="FFFFFF", size=12)
        header_fill = PatternFill(start_color="5B6CFF", end_color="5B6CFF", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center")
        thin_border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        
        # Add event title as header row
        ws.merge_cells("A1:H1")
        title_cell = ws["A1"]
        title_cell.value = f"Registrations for: {event_title}"
        title_cell.font = Font(bold=True, size=14)
        title_cell.alignment = Alignment(horizontal="center", vertical="center")
        
        # Add export date
        ws.merge_cells("A2:H2")
        date_cell = ws["A2"]
        date_cell.value = f"Exported on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        date_cell.font = Font(italic=True, size=10)
        date_cell.alignment = Alignment(horizontal="center", vertical="center")
        
        # Define headers (starting from row 4)
        headers = [
            "Email",
            "First Name",
            "Last Name",
            "Company",
            "Designation",
            "Phone Number",
            "Registration Status",
            "Registration Date",
        ]
        
        # Write headers
        header_row = 4
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=header_row, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border
        
        # Write data rows
        data_start_row = 5
        for idx, registration in enumerate(registrations):
            # Fetch user details
            user = await user_repository.get_user_by_id(registration.user_id)
            
            if user:
                email = user.get("user_email", "N/A")
                first_name = user.get("first_name", "N/A")
                last_name = user.get("last_name", "N/A")
                company = user.get("company", "N/A")
                job_function = user.get("job_function", "N/A")
                phone_number = user.get("business_phone", "N/A")
            else:
                email = "User not found"
                first_name = "N/A"
                last_name = "N/A"
                company = "N/A"
                job_function = "N/A"
                phone_number = "N/A"
            
            row_data = [
                email,
                first_name,
                last_name,
                company,
                job_function,
                phone_number,
                registration.status,
                registration.registered_at,
            ]
            
            current_row = data_start_row + idx
            for col, value in enumerate(row_data, 1):
                cell = ws.cell(row=current_row, column=col, value=value)
                cell.border = thin_border
                cell.alignment = Alignment(vertical="center")
        
        # Adjust column widths
        column_widths = {
            "A": 35,  # Email
            "B": 15,  # First Name
            "C": 15,  # Last Name
            "D": 25,  # Company
            "E": 20,  # Designation
            "F": 18,  # Phone Number
            "G": 18,  # Status
            "H": 22,  # Registration Date
        }
        for col_letter, width in column_widths.items():
            ws.column_dimensions[col_letter].width = width
        
        # Add total count row
        total_row = data_start_row + len(registrations) + 1
        ws.cell(row=total_row, column=1, value=f"Total Registrations: {len(registrations)}")
        ws.cell(row=total_row, column=1).font = Font(bold=True)
        
        # Save to BytesIO
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        # Generate filename
        safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in event_title)
        safe_title = safe_title[:50]  # Limit length
        filename = f"{safe_title}_registrations_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        logger.info(f"Generated Excel export for event {event_id} with {len(registrations)} registrations")
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export registrations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export registrations: {str(e)}",
        )


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
    
    **Required fields:**
    - `status`: New status (REGISTERED, CANCELLED, or ATTENDED)
    """,
    responses={
        200: {"description": "Registration status updated successfully"},
        404: {"description": "Registration not found"},
        422: {"description": "Validation error"},
    },
)
async def update_registration_status(
    registration_id: str,
    request: UpdateRegistrationStatusRequest,
    service: EventRegistrationService = Depends(get_event_registration_service),
) -> UpdateEventRegistrationResponse:
    """Update the status of an existing registration."""
    try:
        return await service.update_registration_status(registration_id, request)
    except EventRegistrationNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
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
