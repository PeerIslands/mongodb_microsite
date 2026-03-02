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
from fastapi import APIRouter, Depends, Query, status, HTTPException, File, UploadFile, Form
from fastapi.responses import Response, StreamingResponse
import mimetypes

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
from app.api.v1.services.azure_blob_service import get_azure_blob_service, AzureBlobServiceError, MAX_EVENT_VIDEO_SIZE

router = APIRouter(prefix="/events")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_valid_file(file: Optional[UploadFile]) -> bool:
    """Check if a file is valid (not None and has content)."""
    return file is not None and file.filename not in [None, ""]


async def upload_image_to_blob(
    file: UploadFile,
    event_id: str,
    field_name: str,
    blob_service,
) -> str:
    """Upload an image file to Azure Blob Storage."""
    content = await file.read()
    mime_type = file.content_type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = mimetypes.guess_type(file.filename or "")[0] or "image/jpeg"
    
    blob_path = await blob_service.upload_image(
        file_content=content,
        category="events",
        item_id=event_id,
        field_name=field_name,
        original_filename=file.filename or "thumbnail.jpg",
        content_type=mime_type,
    )
    return blob_path


async def upload_video_to_blob(
    file: UploadFile,
    event_id: str,
    field_name: str,
    blob_service,
) -> str:
    """Upload a video file to Azure Blob Storage."""
    content = await file.read()
    mime_type = file.content_type
    if not mime_type or mime_type == "application/octet-stream":
        mime_type = "video/mp4"
    
    blob_path = await blob_service.upload_video(
        file_content=content,
        category="events",
        item_id=event_id,
        field_name=field_name,
        original_filename=file.filename or "recording.mp4",
        content_type=mime_type,
        max_size=MAX_EVENT_VIDEO_SIZE,
    )
    return blob_path


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
    - `date`: Event date (YYYY-MM-DD)
    - `time`: Event time (HH:mm, 24-hour format)
    - `timezone`: IANA timezone (e.g., Asia/Kolkata)
    - `duration_minutes`: Event duration in minutes
    - `description`: Event description
    - `attendee_value`: Value for attendees
    - `category`: Event category
    - `event_type`: Event type ('online', 'in-person', or 'hybrid')
    - `location`: Meeting link or physical address
    
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
    Update an existing event with optional file uploads.
    
    **All fields are optional** - only provided fields will be updated.
    
    **File handling:**
    - Set `delete_thumbnail=true` to remove existing thumbnail
    - Set `delete_video=true` to remove existing video
    - Upload new files to replace existing ones
    
    **Note:** Date must be in YYYY-MM-DD format.
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
    title: Optional[str] = Form(None),
    subtitle: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    time: Optional[str] = Form(None),
    timezone: Optional[str] = Form(None),
    duration_minutes: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    attendee_value: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    event_type: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    featured: Optional[bool] = Form(None),
    status: Optional[str] = Form(None),
    delete_thumbnail: str = Form("false"),
    delete_video: str = Form("false"),
    thumbnail: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    service: EventService = Depends(get_event_service),
) -> UpdateEventResponse:
    """Update an existing event with optional file uploads."""
    try:
        blob_service = get_azure_blob_service()
        
        # Get existing blob paths
        existing_blob_paths = await service.get_blob_paths(event_id)
        
        # Build update data
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if subtitle is not None:
            update_data["subtitle"] = subtitle
        if date is not None:
            update_data["date"] = date
        if time is not None:
            update_data["time"] = time
        if timezone is not None:
            update_data["timezone"] = timezone
        if duration_minutes is not None:
            update_data["duration_minutes"] = duration_minutes
        if description is not None:
            update_data["description"] = description
        if attendee_value is not None:
            update_data["attendee_value"] = attendee_value
        if category is not None:
            update_data["category"] = category
        if event_type is not None:
            update_data["event_type"] = event_type
        if location is not None:
            update_data["location"] = location
        if featured is not None:
            update_data["featured"] = featured
        if status is not None:
            update_data["status"] = status
        
        # Handle thumbnail file operations
        if delete_thumbnail.lower() == "true":
            if existing_blob_paths.get("thumbnail_url"):
                await blob_service.delete_file(existing_blob_paths["thumbnail_url"])
            update_data["thumbnail_url"] = ""
        elif is_valid_file(thumbnail):
            if existing_blob_paths.get("thumbnail_url"):
                await blob_service.delete_file(existing_blob_paths["thumbnail_url"])
            thumbnail_blob_path = await upload_image_to_blob(
                thumbnail, event_id, "thumbnail_url", blob_service
            )
            update_data["thumbnail_url"] = thumbnail_blob_path
        
        # Handle video file operations
        if delete_video.lower() == "true":
            if existing_blob_paths.get("video_url"):
                await blob_service.delete_file(existing_blob_paths["video_url"])
            update_data["video_url"] = ""
        elif is_valid_file(video):
            if existing_blob_paths.get("video_url"):
                await blob_service.delete_file(existing_blob_paths["video_url"])
            video_blob_path = await upload_video_to_blob(
                video, event_id, "video_url", blob_service
            )
            update_data["video_url"] = video_blob_path
        
        # Update event
        update_request = UpdateEventRequest(**update_data)
        result = await service.update_event(event_id, update_request)
        return result
        
    except EventNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.delete(
    "/{event_id}",
    response_model=DeleteEventResponse,
    summary="Delete Event",
    description="Delete an event by its unique ID and cleanup associated files.",
    responses={
        200: {"description": "Event deleted successfully"},
        404: {"description": "Event not found"},
    },
)
async def delete_event(
    event_id: str,
    service: EventService = Depends(get_event_service),
) -> DeleteEventResponse:
    """Delete an event by its unique ID and cleanup files."""
    try:
        blob_service = get_azure_blob_service()
        
        # Get blob paths before deletion
        blob_paths = await service.get_blob_paths(event_id)
        
        # Delete the event
        result = await service.delete_event(event_id)
        
        # Delete associated files from Azure Blob
        if blob_paths.get("thumbnail_url"):
            await blob_service.delete_file(blob_paths["thumbnail_url"])
        if blob_paths.get("video_url"):
            await blob_service.delete_file(blob_paths["video_url"])
        
        return result
        
    except EventNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


# =============================================================================
# FILE PROXY ENDPOINTS
# =============================================================================

# Mapping of file types to their field names
FILE_TYPE_CONFIG = {
    "thumbnail": {"field": "thumbnail_url", "default_content_type": "image/jpeg"},
    "video": {"field": "video_url", "default_content_type": "video/mp4"},
}


@router.get(
    "/{event_id}/files/{file_type}",
    summary="Get Event File",
    description="Secure proxy endpoint to serve event files (thumbnail, video) from Azure Blob Storage.",
    responses={
        200: {"description": "File content"},
        404: {"description": "Event or file not found"},
    },
)
async def get_event_file(
    event_id: str,
    file_type: str,
    service: EventService = Depends(get_event_service),
) -> StreamingResponse:
    """Serve event files securely through proxy endpoint."""
    # Validate file type
    if file_type not in FILE_TYPE_CONFIG:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Must be one of: {', '.join(FILE_TYPE_CONFIG.keys())}"
        )
    
    try:
        # Get blob paths directly from MongoDB (not the proxy URLs)
        blob_paths = await service.get_blob_paths(event_id)
        
        # Get the blob path for the requested file
        config = FILE_TYPE_CONFIG[file_type]
        field_name = config["field"]
        blob_path = blob_paths.get(field_name, "")
        
        if not blob_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No {file_type} file found for this event"
            )
        
        # Download file from Azure Blob
        blob_service = get_azure_blob_service()
        file_content, content_type, content_length = await blob_service.download_file(blob_path)
        
        # Use default content type if not available
        if not content_type:
            content_type = config["default_content_type"]
        
        # Return file as streaming response
        return StreamingResponse(
            iter([file_content]),
            media_type=content_type,
            headers={
                "Content-Length": str(content_length),
                "Cache-Control": "public, max-age=31536000",  # Cache for 1 year
            }
        )
        
    except EventNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except AzureBlobServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {str(e)}"
        )