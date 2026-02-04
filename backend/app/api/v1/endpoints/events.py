"""
Event Endpoints - API endpoints for event operations.

Endpoints:
- POST /events - Create a new event
- GET /events - Get all events with filters
- GET /events/categories - Get all unique event categories
- GET /events/{event_id} - Get a single event by ID
- GET /events/{event_id}/calendar - Download ICS calendar file for event
- PUT /events/{event_id} - Update an event
- DELETE /events/{event_id} - Delete an event
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from fastapi.responses import Response

from app.api.v1.models.event import (
    CreateEventRequest,
    CreateEventResponse,
    UpdateEventRequest,
    UpdateEventResponse,
    EventResponse,
    EventDetailResponse,
    DeleteEventResponse,
)
from app.api.v1.services.event_service import EventService
from app.api.v1.dependencies.services import get_event_service
from app.api.v1.exceptions.event_exceptions import EventNotFoundError

router = APIRouter(prefix="/events")


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "",
    response_model=CreateEventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Event",
    description="""
    Create a new event.
    
    **Required fields:**
    - `title`: Event title
    - `subtitle`: Event subtitle
    - `date`: Event date (YYYY-MM-DD, must be in the future)
    - `time`: Event time (HH:mm, 24-hour format)
    - `timezone`: IANA timezone (e.g., Asia/Kolkata)
    - `duration_minutes`: Event duration in minutes
    - `description`: Event description
    - `attendee_value`: Value for attendees
    - `category`: Event category
    
    **Optional fields:**
    - `featured`: Whether event is featured (default: false)
    - `status`: 'draft', 'published', or 'archived' (default: draft)
    """,
    responses={
        201: {"description": "Event created successfully"},
        422: {"description": "Validation error"},
    },
)
async def create_event(
    request: CreateEventRequest,
    service: EventService = Depends(get_event_service),
) -> CreateEventResponse:
    """Create a new event."""
    return await service.create_event(request)


@router.get(
    "",
    response_model=List[EventResponse],
    summary="Get All Events",
    description="""
    Retrieve all events with optional filtering.
    
    **Filters:**
    - `category`: Filter by category
    - `status`: Filter by status ('draft', 'published', or 'archived')
    - `featured`: Filter by featured status (true/false)
    
    **Returns:** List of events sorted by date and time (upcoming first).
    """,
)
async def get_all_events(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    status: Optional[str] = Query(default=None, description="Filter by status ('draft', 'published', or 'archived')"),
    featured: Optional[bool] = Query(default=None, description="Filter by featured status (boolean)"),
    service: EventService = Depends(get_event_service),
) -> List[EventResponse]:
    """Get all events with optional filters."""
    return await service.get_all_events(
        category=category,
        status=status,
        featured=featured,
    )


@router.get(
    "/categories",
    response_model=List[str],
    summary="Get All Categories",
    description="Get list of all unique event categories.",
)
async def get_categories(
    service: EventService = Depends(get_event_service),
) -> List[str]:
    """Get all unique event categories."""
    return await service.get_categories()


@router.get(
    "/{event_id}",
    response_model=EventDetailResponse,
    summary="Get Event by ID",
    description="Retrieve a single event by its unique ID.",
    responses={
        200: {"description": "Event found"},
        404: {"description": "Event not found"},
    },
)
async def get_event_by_id(
    event_id: str,
    service: EventService = Depends(get_event_service),
) -> EventDetailResponse:
    """Get a single event by its unique ID."""
    try:
        return await service.get_event_by_id(event_id)
    except EventNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.get(
    "/{event_id}/calendar",
    summary="Download Calendar File",
    description="Download an ICS calendar file for the event. Can be added to any calendar application.",
    responses={
        200: {
            "description": "ICS calendar file",
            "content": {"text/calendar": {}},
        },
        404: {"description": "Event not found"},
    },
)
async def download_event_calendar(
    event_id: str,
    service: EventService = Depends(get_event_service),
) -> Response:
    """Download ICS calendar file for the event."""
    try:
        ics_content = await service.generate_calendar_file(event_id)
        
        return Response(
            content=ics_content,
            media_type="text/calendar",
            headers={
                "Content-Disposition": f'attachment; filename="event-{event_id}.ics"',
            },
        )
    except EventNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.put(
    "/{event_id}",
    response_model=UpdateEventResponse,
    summary="Update Event",
    description="""
    Update an existing event.
    
    **All fields are optional** - only provided fields will be updated.
    
    **Note:** Date must be in YYYY-MM-DD format and must be in the future.
    Time must be in HH:mm format (24-hour).
    """,
    responses={
        200: {"description": "Event updated successfully"},
        404: {"description": "Event not found"},
        422: {"description": "Validation error"},
    },
)
async def update_event(
    event_id: str,
    request: UpdateEventRequest,
    service: EventService = Depends(get_event_service),
) -> UpdateEventResponse:
    """Update an existing event."""
    try:
        return await service.update_event(event_id, request)
    except EventNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.delete(
    "/{event_id}",
    response_model=DeleteEventResponse,
    summary="Delete Event",
    description="Delete an event by its unique ID.",
    responses={
        200: {"description": "Event deleted successfully"},
        404: {"description": "Event not found"},
    },
)
async def delete_event(
    event_id: str,
    service: EventService = Depends(get_event_service),
) -> DeleteEventResponse:
    """Delete an event by its unique ID."""
    try:
        return await service.delete_event(event_id)
    except EventNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
