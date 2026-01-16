"""
Accelerators Endpoints - API endpoints for accelerator operations.

Endpoints:
- POST /accelerators - Create accelerator with file uploads (video + PDF to Azure Blob)
- GET /accelerators - Get all accelerators with filters
- GET /accelerators/{accelerator_id} - Get a single accelerator by ID
- PUT /accelerators/{accelerator_id} - Update an accelerator
- DELETE /accelerators/{accelerator_id} - Delete an accelerator
- GET /accelerators/{accelerator_id}/files/{file_type} - Secure file proxy endpoint

File Storage:
- Videos and PDFs are uploaded to Azure Blob Storage
- Folder structure: accelerators/{accelerator_id}/{field_name}.{ext}
- MongoDB stores the blob path, files are served via secure proxy endpoints
"""

import json
import mimetypes
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse, Response

from app.api.v1.models.accelerator import (
    CreateAcceleratorRequest,
    CreateAcceleratorResponse,
    UpdateAcceleratorRequest,
    UpdateAcceleratorResponse,
    AcceleratorDetailResponse,
    DeleteAcceleratorResponse,
    MetricItem,
)
from app.api.v1.services.accelerator_service import AcceleratorService
from app.api.v1.services.azure_blob_service import get_azure_blob_service, AzureBlobService, AzureBlobServiceError
from app.api.v1.dependencies.services import get_accelerator_service
from app.api.v1.exceptions.accelerator_exceptions import AcceleratorNotFoundError

router = APIRouter(prefix="/accelerators")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_valid_file(f) -> bool:
    """Check if an uploaded file is valid."""
    return f is not None and hasattr(f, 'filename') and f.filename and f.filename != ""


async def upload_pdf_to_blob(
    file: UploadFile,
    accelerator_id: str,
    field_name: str,
    blob_service: AzureBlobService,
) -> str:
    """
    Upload a PDF file to Azure Blob Storage.
    
    Args:
        file: The uploaded file
        accelerator_id: Accelerator ID
        field_name: Field name (pdf_url)
        blob_service: Azure Blob Service instance
        
    Returns:
        Blob path to store in MongoDB (full URL constructed on GET)
    """
    content = await file.read()
    
    mime_type = file.content_type
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type:
            mime_type = "application/pdf"
    
    blob_path = await blob_service.upload_file(
        file_content=content,
        category="accelerators",
        item_id=accelerator_id,
        field_name=field_name,
        original_filename=file.filename,
        content_type=mime_type,
    )
    
    return blob_path


async def upload_video_to_blob(
    file: UploadFile,
    accelerator_id: str,
    field_name: str,
    blob_service: AzureBlobService,
) -> str:
    """
    Upload a video file to Azure Blob Storage.
    
    Args:
        file: The uploaded file
        accelerator_id: Accelerator ID
        field_name: Field name (video_url)
        blob_service: Azure Blob Service instance
        
    Returns:
        Blob path to store in MongoDB (full URL constructed on GET)
    """
    content = await file.read()
    
    mime_type = file.content_type
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type:
            mime_type = "video/mp4"
    
    blob_path = await blob_service.upload_video(
        file_content=content,
        category="accelerators",
        item_id=accelerator_id,
        field_name=field_name,
        original_filename=file.filename,
        content_type=mime_type,
    )
    
    return blob_path


async def upload_image_to_blob(
    file: UploadFile,
    accelerator_id: str,
    field_name: str,
    blob_service: AzureBlobService,
) -> str:
    """
    Upload an image file to Azure Blob Storage.
    
    Args:
        file: The uploaded file
        accelerator_id: Accelerator ID
        field_name: Field name (thumbnail_url)
        blob_service: Azure Blob Service instance
        
    Returns:
        Blob path to store in MongoDB (full URL constructed on GET)
    """
    content = await file.read()
    
    mime_type = file.content_type
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type:
            mime_type = "image/jpeg"
    
    blob_path = await blob_service.upload_image(
        file_content=content,
        category="accelerators",
        item_id=accelerator_id,
        field_name=field_name,
        original_filename=file.filename,
        content_type=mime_type,
    )
    
    return blob_path


def parse_metrics(metrics_json: str) -> List[MetricItem]:
    """
    Parse metrics JSON string into list of MetricItem objects.
    
    Expected format: [{"label": "Time Saved", "value": "50%"}, ...]
    Minimum 3 items, maximum 5 items required.
    
    Args:
        metrics_json: JSON string of metrics array
        
    Returns:
        List of MetricItem objects
    """
    if not metrics_json:
        return []
    
    try:
        parsed = json.loads(metrics_json)
        if not isinstance(parsed, list):
            return []
        
        metrics = []
        for item in parsed[:5]:  # Limit to 5 items
            if isinstance(item, dict) and "label" in item and "value" in item:
                metrics.append(MetricItem(
                    label=str(item["label"]).strip(),
                    value=str(item["value"]).strip()
                ))
        return metrics
    except json.JSONDecodeError:
        return []


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "",
    response_model=CreateAcceleratorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Accelerator",
    description="""
    Create a new accelerator with file uploads.
    
    **Files are stored in Azure Blob Storage.**
    
    **File fields:** Uncheck 'Send empty value' to see file picker.
    
    **Supported files:**
    - thumbnail_file: JPEG, PNG, WebP, GIF (max 5MB)
    - video_file: MP4, WebM, MOV, AVI (max 100MB)
    - pdf_file: PDF only (max 10MB)
    
    **Storage format:** Files are uploaded to Azure Blob with folder structure:
    `accelerators/{accelerator_id}/{field_name}.{ext}`
    
    **Metrics format:** JSON array with 3-5 items:
    `[{"label": "Time Saved", "value": "50%"}, {"label": "Accuracy", "value": "99%"}, {"label": "Cost Reduction", "value": "30%"}]`
    """,
)
async def create_accelerator(
    # Required text fields
    title: str = Form(..., description="Accelerator title"),
    subtitle: str = Form(..., description="Accelerator subtitle"),
    description: str = Form(..., description="Full description"),
    
    # Metrics field - JSON array of {label, value} objects (min 3, max 5)
    metrics: str = Form(..., description='JSON array (min 3, max 5): [{"label": "Time Saved", "value": "50%"}]'),
    
    # Optional text fields
    status: str = Form(default="draft", description="Status: 'published' or 'draft'"),
    feature_on_homepage: bool = Form(default=False, description="Whether to feature on homepage"),
    
    # File uploads - stored in Azure Blob Storage
    thumbnail_file: UploadFile = File(default=None, description="Thumbnail image (JPEG, PNG, WebP, GIF - max 5MB)"),
    video_file: UploadFile = File(default=None, description="Video file (MP4, WebM, MOV, AVI - max 100MB)"),
    pdf_file: UploadFile = File(default=None, description="PDF document (max 10MB)"),
    
    service: AcceleratorService = Depends(get_accelerator_service),
) -> CreateAcceleratorResponse:
    """Create an accelerator with files stored in Azure Blob Storage."""
    
    # Parse metrics
    metrics_list = parse_metrics(metrics)
    if len(metrics_list) < 3:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="Metrics must have at least 3 items"
        )
    if len(metrics_list) > 5:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="Metrics cannot have more than 5 items"
        )
    
    # Create request object (without file URLs for now - will be added after creation)
    request = CreateAcceleratorRequest(
        title=title,
        subtitle=subtitle,
        description=description,
        metrics=metrics_list,
        status=status,
        feature_on_homepage=feature_on_homepage,
        thumbnail_url="",
        video_url="",
        pdf_url="",
    )
    
    # Create accelerator first to get the ID
    result = await service.create_accelerator(request)
    accelerator_id = result.id
    
    # Upload files if provided
    blob_service = get_azure_blob_service()
    update_data: Dict[str, str] = {}
    
    # Upload thumbnail image
    if is_valid_file(thumbnail_file):
        thumbnail_blob_path = await upload_image_to_blob(
            thumbnail_file, accelerator_id, "thumbnail_url", blob_service
        )
        update_data["thumbnail_url"] = thumbnail_blob_path
    
    # Upload video file
    if is_valid_file(video_file):
        video_blob_path = await upload_video_to_blob(
            video_file, accelerator_id, "video_url", blob_service
        )
        update_data["video_url"] = video_blob_path
    
    # Upload PDF file
    if is_valid_file(pdf_file):
        pdf_blob_path = await upload_pdf_to_blob(
            pdf_file, accelerator_id, "pdf_url", blob_service
        )
        update_data["pdf_url"] = pdf_blob_path
    
    # Update accelerator with file paths if any files were uploaded
    if update_data:
        update_request = UpdateAcceleratorRequest(**update_data)
        await service.update_accelerator(accelerator_id, update_request)
    
    return result


@router.get(
    "",
    response_model=List[AcceleratorDetailResponse],
    summary="Get All Accelerators",
    description="""
    Retrieve all accelerators with optional filtering.
    
    **Filters:**
    - `status`: Filter by status ('published' or 'draft')
    - `feature_on_homepage`: Filter by featured status (true/false)
    
    **Returns:** List of accelerators with full details.
    """,
)
async def get_all_accelerators(
    status: Optional[str] = Query(default=None, description="Filter by status ('published' or 'draft')"),
    feature_on_homepage: Optional[bool] = Query(default=None, description="Filter by featured status"),
    service: AcceleratorService = Depends(get_accelerator_service),
) -> List[AcceleratorDetailResponse]:
    """Get all accelerators with optional filters."""
    return await service.get_all_accelerators(
        status=status,
        feature_on_homepage=feature_on_homepage,
    )


@router.get(
    "/{accelerator_id}",
    response_model=AcceleratorDetailResponse,
    summary="Get Accelerator by ID",
    description="""
    Retrieve a single accelerator by its unique ID.
    
    **Returns:** Full accelerator details including metrics and file URLs.
    """,
    responses={
        200: {"description": "Accelerator found"},
        404: {"description": "Accelerator not found"},
    },
)
async def get_accelerator_by_id(
    accelerator_id: str,
    service: AcceleratorService = Depends(get_accelerator_service),
) -> AcceleratorDetailResponse:
    """Get a single accelerator by its unique ID."""
    return await service.get_accelerator_by_id(accelerator_id)


@router.put(
    "/{accelerator_id}",
    response_model=UpdateAcceleratorResponse,
    summary="Update Accelerator",
    description="""
    Update an existing accelerator with file uploads.
    
    **All fields are optional** - only provided fields will be updated.
    
    **File fields:** Uncheck 'Send empty value' to see file picker.
    
    **Note:** When uploading new files, the old files in Azure Blob Storage
    will be automatically deleted and replaced with the new ones.
    
    **Metrics format:** JSON array with 3-5 items:
    `[{"label": "Time Saved", "value": "50%"}, {"label": "Accuracy", "value": "99%"}, {"label": "Cost Reduction", "value": "30%"}]`
    """,
    responses={
        200: {"description": "Accelerator updated successfully"},
        404: {"description": "Accelerator not found"},
        422: {"description": "Validation error"},
    },
)
async def update_accelerator(
    accelerator_id: str,
    # Optional text fields - empty string means "don't update"
    title: str = Form(default="", description="Accelerator title"),
    subtitle: str = Form(default="", description="Accelerator subtitle"),
    description: str = Form(default="", description="Full description"),
    status: str = Form(default="", description="Status: 'published' or 'draft'"),
    feature_on_homepage: str = Form(default="", description="true or false"),
    
    # Metrics field - JSON array of {label, value} objects (min 3, max 5)
    metrics: str = Form(default="", description='JSON array: [{"label": "Time Saved", "value": "50%"}]'),
    
    # File uploads - stored in Azure Blob Storage
    thumbnail_file: UploadFile = File(default=None, description="Thumbnail image (JPEG, PNG, WebP, GIF - max 5MB)"),
    video_file: UploadFile = File(default=None, description="Video file (MP4, WebM, MOV, AVI - max 100MB)"),
    pdf_file: UploadFile = File(default=None, description="PDF document (max 10MB)"),
    
    service: AcceleratorService = Depends(get_accelerator_service),
) -> UpdateAcceleratorResponse:
    """Update an existing accelerator. Only provided fields will be updated."""
    
    # Get Azure Blob Service
    blob_service = get_azure_blob_service()
    
    # Get existing blob paths for deletion
    existing_blob_paths = await service.get_blob_paths(accelerator_id)
    
    # Build update data dictionary (only include non-empty fields)
    update_data: Dict[str, Any] = {}
    
    if title:
        update_data["title"] = title
    if subtitle:
        update_data["subtitle"] = subtitle
    if description:
        update_data["description"] = description
    if status:
        update_data["status"] = status
    if feature_on_homepage:
        update_data["feature_on_homepage"] = feature_on_homepage.lower() == "true"
    
    # Handle metrics
    if metrics:
        metrics_list = parse_metrics(metrics)
        if len(metrics_list) < 3:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail="Metrics must have at least 3 items"
            )
        if len(metrics_list) > 5:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=422,
                detail="Metrics cannot have more than 5 items"
            )
        update_data["metrics"] = metrics_list
    
    # Upload new thumbnail image (delete old file first)
    if is_valid_file(thumbnail_file):
        if existing_blob_paths.get("thumbnail_url"):
            await blob_service.delete_file(existing_blob_paths["thumbnail_url"])
        update_data["thumbnail_url"] = await upload_image_to_blob(
            thumbnail_file, accelerator_id, "thumbnail_url", blob_service
        )
    
    # Upload new video file (delete old file first)
    if is_valid_file(video_file):
        if existing_blob_paths.get("video_url"):
            await blob_service.delete_file(existing_blob_paths["video_url"])
        update_data["video_url"] = await upload_video_to_blob(
            video_file, accelerator_id, "video_url", blob_service
        )
    
    # Upload new PDF file (delete old file first)
    if is_valid_file(pdf_file):
        if existing_blob_paths.get("pdf_url"):
            await blob_service.delete_file(existing_blob_paths["pdf_url"])
        update_data["pdf_url"] = await upload_pdf_to_blob(
            pdf_file, accelerator_id, "pdf_url", blob_service
        )
    
    # Create update request
    request = UpdateAcceleratorRequest(**update_data)
    
    return await service.update_accelerator(accelerator_id, request)


@router.delete(
    "/{accelerator_id}",
    response_model=DeleteAcceleratorResponse,
    summary="Delete Accelerator",
    description="""
    Delete an accelerator by its unique ID.
    
    **Warning:** This action is irreversible. Associated files in Azure Blob 
    Storage will also be deleted.
    """,
    responses={
        200: {"description": "Accelerator deleted successfully"},
        404: {"description": "Accelerator not found"},
    },
)
async def delete_accelerator(
    accelerator_id: str,
    service: AcceleratorService = Depends(get_accelerator_service),
) -> DeleteAcceleratorResponse:
    """Delete an accelerator by its unique ID."""
    
    # Get blob paths before deletion
    blob_service = get_azure_blob_service()
    blob_paths = await service.get_blob_paths(accelerator_id)
    
    # Delete the accelerator
    result = await service.delete_accelerator(accelerator_id)
    
    # Delete associated files from Azure Blob
    if blob_paths.get("thumbnail_url"):
        await blob_service.delete_file(blob_paths["thumbnail_url"])
    if blob_paths.get("video_url"):
        await blob_service.delete_file(blob_paths["video_url"])
    if blob_paths.get("pdf_url"):
        await blob_service.delete_file(blob_paths["pdf_url"])
    
    return result


# =============================================================================
# FILE PROXY ENDPOINTS - Secure file serving without exposing Azure URLs
# =============================================================================

# Mapping of file types to their field names and default content types
FILE_TYPE_CONFIG = {
    "pdf": {"field": "pdf_url", "default_content_type": "application/pdf", "extension": ".pdf"},
    "video": {"field": "video_url", "default_content_type": "video/mp4", "extension": ".mp4"},
    "thumbnail": {"field": "thumbnail_url", "default_content_type": "image/jpeg", "extension": ".jpg"},
}


@router.get(
    "/{accelerator_id}/files/{file_type}",
    summary="Get Accelerator File (Secure Proxy)",
    description="""
    Securely serve accelerator files (PDF, video, thumbnail) through the backend.
    
    **Security Benefits:**
    - Azure Blob SAS tokens are never exposed to the client
    - Files are served through the backend, enabling access control
    - Supports future authentication requirements
    
    **File Types:**
    - `pdf` - PDF document
    - `video` - Video file (MP4, WebM, etc.)
    - `thumbnail` - Thumbnail image
    
    **Response:**
    - Streams the file with appropriate Content-Type header
    - Includes Content-Disposition for downloads
    """,
    responses={
        200: {"description": "File stream"},
        404: {"description": "Accelerator or file not found"},
        400: {"description": "Invalid file type"},
    },
)
async def get_accelerator_file(
    accelerator_id: str,
    file_type: str,
    download: bool = Query(default=False, description="Force download instead of inline display"),
    service: AcceleratorService = Depends(get_accelerator_service),
) -> StreamingResponse:
    """
    Securely proxy files from Azure Blob Storage.
    
    This endpoint fetches files from Azure Blob Storage and streams them to the client,
    keeping the Azure SAS token secure on the server side.
    """
    # Validate file type
    if file_type not in FILE_TYPE_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file_type}. Must be one of: {list(FILE_TYPE_CONFIG.keys())}"
        )
    
    config = FILE_TYPE_CONFIG[file_type]
    
    # Get blob paths for this accelerator
    try:
        blob_paths = await service.get_blob_paths(accelerator_id)
    except AcceleratorNotFoundError:
        raise HTTPException(status_code=404, detail=f"Accelerator not found: {accelerator_id}")
    
    # Get the blob path for the requested file type
    blob_path = blob_paths.get(config["field"], "")
    
    if not blob_path:
        raise HTTPException(
            status_code=404,
            detail=f"No {file_type} file found for this accelerator"
        )
    
    # Get Azure Blob Service and stream the file
    blob_service = get_azure_blob_service()
    
    try:
        # Get file info for headers
        content_type, content_length = await blob_service.get_file_info(blob_path)
        
        # Determine filename for Content-Disposition
        filename = f"{accelerator_id}_{file_type}{config['extension']}"
        
        # Set disposition based on download flag
        disposition = "attachment" if download else "inline"
        
        # Stream the file
        return StreamingResponse(
            content=blob_service.stream_file(blob_path),
            media_type=content_type or config["default_content_type"],
            headers={
                "Content-Disposition": f'{disposition}; filename="{filename}"',
                "Content-Length": str(content_length) if content_length else "",
                "Cache-Control": "private, max-age=3600",  # Cache for 1 hour
                "X-Content-Type-Options": "nosniff",
            },
        )
    except AzureBlobServiceError as e:
        raise HTTPException(status_code=404, detail=str(e))

