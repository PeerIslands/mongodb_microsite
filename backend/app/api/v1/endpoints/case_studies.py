"""
Case Studies Endpoints - API endpoints for case study operations.

Endpoints:
- POST /case-studies - Create case study with file uploads (stored in Azure Blob Storage)
- GET /case-studies - Get all case studies with filters
- GET /case-studies/{case_id} - Get a single case study by ID
- PUT /case-studies/{case_id} - Update a case study
- DELETE /case-studies/{case_id} - Delete a case study
- GET /case-studies/{case_id}/files/{file_type} - Secure file proxy endpoint

Field naming convention: snake_case (matching frontend requirements)

File Storage:
- PDFs are uploaded to Azure Blob Storage
- Folder structure: casestudies/{case_id}/{field_name}.{ext}
- MongoDB stores the blob path, files are served via secure proxy endpoints
"""

import json
import mimetypes
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse

from app.api.v1.models.case_study import (
    CreateCaseStudyRequest,
    CreateCaseStudyResponse,
    UpdateCaseStudyRequest,
    UpdateCaseStudyResponse,
    CaseStudyResponse,
    CaseStudyDetailResponse,
    DeleteCaseStudyResponse,
    MetricItem,
)
from app.api.v1.endpoints.ai_extract import ExtractResponse
from app.api.v1.services.case_study_service import CaseStudyService
from app.api.v1.services.azure_blob_service import get_azure_blob_service, AzureBlobService, AzureBlobServiceError
from app.api.v1.dependencies.services import get_case_study_service
from app.api.v1.exceptions.case_study_exceptions import CaseStudyNotFoundError

router = APIRouter(prefix="/case-studies")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_valid_file(f) -> bool:
    """Check if an uploaded file is valid."""
    return f is not None and hasattr(f, 'filename') and f.filename and f.filename != ""


async def upload_file_to_blob(
    file: UploadFile,
    category: str,
    item_id: str,
    field_name: str,
    blob_service: AzureBlobService,
) -> str:
    """
    Upload a file to Azure Blob Storage and return the blob path.
    
    Args:
        file: The uploaded file
        category: Category folder - "casestudies", "accelerators", or "blogs"
        item_id: Item ID (case study ID, accelerator ID, or blog ID)
        field_name: Field name (pdf_url, etc.)
        blob_service: Azure Blob Service instance
        
    Returns:
        Blob path to store in MongoDB (full URL constructed on GET)
    """
    content = await file.read()
    
    mime_type = file.content_type
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type:
            mime_type = "application/octet-stream"
    
    blob_path = await blob_service.upload_file(
        file_content=content,
        category=category,
        item_id=item_id,
        field_name=field_name,
        original_filename=file.filename,
        content_type=mime_type,
    )
    
    return blob_path


def parse_metrics(metrics_json: str) -> List[MetricItem]:
    """
    Parse metrics JSON string into list of MetricItem objects.
    
    Expected format: [{"label": "Time Reduction", "value": "50%"}, ...]
    Maximum 5 items allowed.
    
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
    response_model=CreateCaseStudyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Case Study",
    description="""
    Create a new case study with file uploads.
    
    **Files are stored in Azure Blob Storage.**
    
    **File fields:** Uncheck 'Send empty value' to see file picker.
    
    **Supported files:**
    - pdf_file: PDF only (max 10MB)
    
    **Storage format:** Files are uploaded to Azure Blob with folder structure:
    `casestudies/{case_id}/{field_name}.{ext}`
    
    **Metrics format:** JSON array with max 5 items:
    `[{"label": "Time Reduction", "value": "50%"}, {"label": "Accuracy", "value": "99%"}]`
    """,
)
async def create_case_study(
    # Required text fields
    title: str = Form(..., description="Case study title"),
    slug: str = Form(..., description="URL-friendly slug derived from title"),
    industry: str = Form(..., description="Industry sector"),
    company_name: str = Form(..., description="Client company name"),
    
    # Optional text fields
    featured: bool = Form(default=False, description="Whether case study is featured"),
    status: str = Form(default="draft", description="Status: 'published' or 'draft'"),
    tech_stack: str = Form(default="", description="JSON array: [\"MongoDB\",\"Python\",\"AWS\"]"),
    migration_type: str = Form(default="", description="Type of migration (nullable)"),
    description: str = Form(default="", description="Full description"),
    
    # Required content fields
    challenges: str = Form(..., description="Challenges faced"),
    approach: str = Form(..., description="Solution approach"),
    business_outcomes: str = Form(..., description="Business outcomes"),
    testimonial_quote: str = Form(default="", description="Testimonial quote (nullable)"),
    testimonial_author: str = Form(default="", description="Testimonial author (nullable)"),
    testimonial_position: str = Form(default="", description="Testimonial position (nullable)"),
    
    # Metrics field - JSON array of {label, value} objects (max 5)
    metrics: str = Form(default="", description='JSON array: [{"label": "Time Reduction", "value": "50%"}]'),
    
    # File uploads - stored in Azure Blob Storage
    pdf_file: UploadFile = File(default=None, media_type="application/pdf", description="PDF document"),
    
    service: CaseStudyService = Depends(get_case_study_service),
) -> CreateCaseStudyResponse:
    """Create a case study with files stored in Azure Blob Storage."""
    
    # Parse tech stack (accepts JSON array string)
    tech_stack_list = []
    if tech_stack:
        try:
            parsed = json.loads(tech_stack)
            if isinstance(parsed, list):
                tech_stack_list = [str(t).strip() for t in parsed if t]
        except json.JSONDecodeError:
            # Fallback to comma-separated for backwards compatibility
            tech_stack_list = [t.strip() for t in tech_stack.split(",") if t.strip()]
    
    # Parse metrics
    metrics_list = parse_metrics(metrics)
    
    # Create request object (without pdf_url for now - will be added after creation)
    request = CreateCaseStudyRequest(
        title=title,
        slug=slug,
        featured=featured,
        status=status,
        industry=industry,
        tech_stack=tech_stack_list,
        migration_type=migration_type if migration_type else None,
        company_name=company_name,
        description=description,
        challenges=challenges,
        approach=approach,
        metrics=metrics_list,
        business_outcomes=business_outcomes,
        testimonial_quote=testimonial_quote if testimonial_quote else None,
        testimonial_author=testimonial_author if testimonial_author else None,
        testimonial_position=testimonial_position if testimonial_position else None,
        pdf_url="",
    )
    
    # Create case study first to get the ID
    result = await service.create_case_study(request)
    case_id = result.id
    
    # Upload PDF file if provided (using category folder structure)
    if is_valid_file(pdf_file):
        blob_service = get_azure_blob_service()
        pdf_blob_path = await upload_file_to_blob(
            pdf_file, "casestudies", case_id, "pdf_url", blob_service
        )
        # Update the case study with the PDF path
        update_request = UpdateCaseStudyRequest(pdf_url=pdf_blob_path)
        await service.update_case_study(case_id, update_request)
    
    return result


@router.get(
    "",
    response_model=List[CaseStudyDetailResponse],
    summary="Get All Case Studies",
    description="""
    Retrieve all case studies with optional filtering.
    
    **Filters:**
    - `industry`: Filter by industry sector
    - `status`: Filter by status ('published' or 'draft')
    - `featured`: Filter by featured status (true/false)
    
    **Returns:** List of case studies with summary information.
    """,
)
async def get_all_case_studies(
    industry: Optional[str] = Query(default=None, description="Filter by industry"),
    status: Optional[str] = Query(default=None, description="Filter by status ('published' or 'draft')"),
    featured: Optional[bool] = Query(default=None, description="Filter by featured status (boolean)"),
    service: CaseStudyService = Depends(get_case_study_service),
) -> List[CaseStudyDetailResponse]:
    """Get all case studies with optional filters."""
    return await service.get_all_case_studies(
        industry=industry,
        status=status,
        featured=featured,
    )


@router.get(
    "/testimonials/debug",
    response_model=List[Dict[str, Any]],
    summary="Debug All Case Studies Testimonial Data",
    description="""
    DEBUG: Show all case studies with their testimonial fields for debugging.
    """,
)
async def debug_testimonials(
    service: CaseStudyService = Depends(get_case_study_service),
) -> List[Dict[str, Any]]:
    """DEBUG: Get all case studies with testimonial field info."""
    all_case_studies = await service.get_all_case_studies()
    
    debug_data = []
    for cs in all_case_studies:
        debug_data.append({
            'id': cs.id,
            'company_name': cs.company_name,
            'status': cs.status,
            'testimonial_quote': cs.testimonial_quote or '[EMPTY]',
            'testimonial_author': cs.testimonial_author or '[EMPTY]',
            'testimonial_position': cs.testimonial_position or '[EMPTY]',
            'has_quote': bool(cs.testimonial_quote),
            'has_author': bool(cs.testimonial_author),
        })
    
    return debug_data


@router.get(
    "/testimonials",
    response_model=List[Dict[str, Any]],
    summary="Get All Testimonials",
    description="""
    Retrieve testimonials from all published case studies that have testimonial data.
    
    **Returns:** List of testimonials with company information.
    Only includes case studies that have both testimonial_quote and testimonial_author.
    """,
)
async def get_testimonials(
    service: CaseStudyService = Depends(get_case_study_service),
) -> List[Dict[str, Any]]:
    """Get all testimonials from published case studies."""
    return await service.get_testimonials()


@router.get(
    "/{case_id}",
    response_model=CaseStudyDetailResponse,
    summary="Get Case Study by ID",
    description="""
    Retrieve a single case study by its unique ID.
    
    **Returns:** Full case study details including all fields.
    """,
    responses={
        200: {"description": "Case study found"},
        404: {"description": "Case study not found"},
    },
)
async def get_case_study_by_id(
    case_id: str,
    service: CaseStudyService = Depends(get_case_study_service),
) -> CaseStudyDetailResponse:
    """Get a single case study by its unique ID."""
    return await service.get_case_study_by_id(case_id)


@router.put(
    "/{case_id}",
    response_model=UpdateCaseStudyResponse,
    summary="Update Case Study",
    description="""
    Update an existing case study with file uploads.
    
    **Field behavior:**
    - Send field with value → Updates the field
    - Send empty string for testimonial/migration_type → Sets to null
    - Send empty string for arrays (tech_stack, metrics) → Sets to empty array []
    - Don't send field at all → No change (field stays as is)
    
    **File deletion:**
    - To delete existing PDF: Send `delete_pdf=true`
    - To replace PDF: Upload new `pdf_file` (old one auto-deleted)
    - To keep PDF: Don't send either field
    
    **Metrics format:** JSON array with max 5 items:
    `[{"label": "Time Reduction", "value": "50%"}, {"label": "Accuracy", "value": "99%"}]`
    """,
    responses={
        200: {"description": "Case study updated successfully"},
        404: {"description": "Case study not found"},
        422: {"description": "Validation error"},
    },
)
async def update_case_study(
    case_id: str,
    # Optional text fields - use default="" to receive empty strings from frontend
    title: Optional[str] = Form(default="", description="Case study title"),
    slug: Optional[str] = Form(default="", description="URL-friendly slug derived from title"),
    industry: Optional[str] = Form(default="", description="Industry sector"),
    company_name: Optional[str] = Form(default="", description="Client company name"),
    featured: Optional[str] = Form(default="", description="true or false"),
    status: Optional[str] = Form(default="", description="Status: 'published' or 'draft'"),
    tech_stack: Optional[str] = Form(default="", description="JSON array: [\"MongoDB\",\"Python\",\"AWS\"]"),
    migration_type: Optional[str] = Form(default="", description="Type of migration"),
    description: Optional[str] = Form(default="", description="Full description"),
    challenges: Optional[str] = Form(default="", description="Challenges faced"),
    approach: Optional[str] = Form(default="", description="Solution approach"),
    business_outcomes: Optional[str] = Form(default="", description="Business outcomes"),
    testimonial_quote: Optional[str] = Form(default="", description="Testimonial quote"),
    testimonial_author: Optional[str] = Form(default="", description="Testimonial author"),
    testimonial_position: Optional[str] = Form(default="", description="Testimonial position"),
    
    # Metrics field - JSON array of {label, value} objects (max 5)
    metrics: Optional[str] = Form(default=None, description='JSON array: [{"label": "Time Reduction", "value": "50%"}]'),
    
    # File uploads - stored in Azure Blob Storage
    pdf_file: UploadFile = File(default=None, media_type="application/pdf", description="PDF document"),
    
    # File deletion flags - set to "true" to delete existing file
    delete_pdf: str = Form(default="false", description="Set to 'true' to delete existing PDF file"),
    
    service: CaseStudyService = Depends(get_case_study_service),
) -> UpdateCaseStudyResponse:
    """Update an existing case study. Only provided fields will be updated."""
    
    # Get Azure Blob Service
    blob_service = get_azure_blob_service()
    
    # Get existing case study to retrieve old blob paths for deletion
    existing_blob_paths = await service.get_blob_paths(case_id)
    
    # Build update data dictionary
    # Frontend always sends all fields, so we include everything that's not default empty string
    update_data: Dict[str, Any] = {}
    
    # Required fields - validate they're not empty if provided
    if title:
        if not title.strip():
            raise HTTPException(status_code=422, detail="Title cannot be empty")
        update_data["title"] = title
    
    if slug:
        if not slug.strip():
            raise HTTPException(status_code=422, detail="Slug cannot be empty")
        update_data["slug"] = slug
    
    if industry:
        if not industry.strip():
            raise HTTPException(status_code=422, detail="Industry cannot be empty")
        update_data["industry"] = industry
    
    if company_name:
        if not company_name.strip():
            raise HTTPException(status_code=422, detail="Company name cannot be empty")
        update_data["company_name"] = company_name
    
    # Boolean field
    if featured:
        update_data["featured"] = featured.lower() == "true"
    
    # Status field
    if status:
        update_data["status"] = status
    
    # Array field - tech_stack (empty string becomes empty array)
    if tech_stack:
        # Parse tech stack (accepts JSON array string)
        try:
            parsed = json.loads(tech_stack)
            if isinstance(parsed, list):
                update_data["tech_stack"] = [str(t).strip() for t in parsed if t]
            else:
                update_data["tech_stack"] = []
        except json.JSONDecodeError:
            # Fallback to comma-separated for backwards compatibility
            if tech_stack.strip():
                update_data["tech_stack"] = [t.strip() for t in tech_stack.split(",") if t.strip()]
            else:
                update_data["tech_stack"] = []
    
    # Optional string fields - ALWAYS process to allow clearing
    # migration_type - empty becomes None
    update_data["migration_type"] = migration_type if migration_type.strip() else None
    
    # description - ALWAYS process to allow clearing (empty becomes empty string)
    update_data["description"] = description
    
    # Other optional fields - only update if provided
    if challenges:
        if not challenges.strip():
            raise HTTPException(status_code=422, detail="Challenges cannot be empty")
        update_data["challenges"] = challenges
    
    if approach:
        if not approach.strip():
            raise HTTPException(status_code=422, detail="Approach cannot be empty")
        update_data["approach"] = approach
    
    if business_outcomes:
        if not business_outcomes.strip():
            raise HTTPException(status_code=422, detail="Business outcomes cannot be empty")
        update_data["business_outcomes"] = business_outcomes
    
    # Testimonial fields - ALWAYS process these even if empty (to allow clearing)
    # Empty string becomes None in MongoDB
    update_data["testimonial_quote"] = testimonial_quote if testimonial_quote.strip() else None
    update_data["testimonial_author"] = testimonial_author if testimonial_author.strip() else None
    update_data["testimonial_position"] = testimonial_position if testimonial_position.strip() else None
    
    # Array field - metrics (empty string becomes empty array)
    # ALWAYS process metrics field to allow clearing
    if metrics and metrics.strip():
        update_data["metrics"] = parse_metrics(metrics)
    else:
        update_data["metrics"] = []
    
    # Handle PDF file operations
    if delete_pdf.lower() == "true":
        # User wants to delete the existing PDF
        if existing_blob_paths.get("pdf_url"):
            await blob_service.delete_file(existing_blob_paths["pdf_url"])
        update_data["pdf_url"] = ""  # Clear the PDF URL in database
    elif is_valid_file(pdf_file):
        # User is uploading a new PDF (delete old file first)
        if existing_blob_paths.get("pdf_url"):
            await blob_service.delete_file(existing_blob_paths["pdf_url"])
        # Upload new file (using category folder structure)
        update_data["pdf_url"] = await upload_file_to_blob(
            pdf_file, "casestudies", case_id, "pdf_url", blob_service
        )
    
    # Create update request
    request = UpdateCaseStudyRequest(**update_data)
    
    return await service.update_case_study(case_id, request)


@router.delete(
    "/{case_id}",
    response_model=DeleteCaseStudyResponse,
    summary="Delete Case Study",
    description="""
    Delete a case study by its unique ID.
    
    **Warning:** This action is irreversible.
    """,
    responses={
        200: {"description": "Case study deleted successfully"},
        404: {"description": "Case study not found"},
    },
)
async def delete_case_study(
    case_id: str,
    service: CaseStudyService = Depends(get_case_study_service),
) -> DeleteCaseStudyResponse:
    """Delete a case study by its unique ID."""
    return await service.delete_case_study(case_id)


@router.post(
    "/generate-pdf",
    summary="Generate AI-Powered Case Study Presentation (PDF)",
    description="""
    Generate a professional case study presentation using Gamma AI, with PDF export.
    
    **Features:**
    - Beautiful AI-generated presentation with 8-10 professional slides
    - AI-generated images for each slide 
    - Professional layouts and design
    - Includes PeerIslands branding and logo
    - Metrics visualizations
    - Automatic PDF export
    
    **Process:**
    1. Takes case study data (enhanced or basic)
    2. Generates presentation via Gamma AI
    3. Returns PDF download URL
    
    **Request Body:**
    Send case study data as JSON with the following fields:
    - title (required)
    - companyName
    - description
    - industry
    - techStack (array)
    - challenges
    - approach
    - metrics (array of {label, value})
    - businessOutcomes
    - testimonialQuote
    - testimonialAuthor
    - testimonialPosition
    
    **Response:**
    Returns a JSON with presentation URL and PDF download link.
    
    **Note:** Requires GAMMA_API_KEY to be configured in environment variables.
    """,
    responses={
        200: {"description": "Presentation generated successfully"},
        400: {"description": "Invalid request data or Gamma API not configured"},
        500: {"description": "Presentation generation failed"},
    },
)
async def generate_ai_pdf(
    case_study_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate a case study presentation using Gamma AI with automatic PDF export.
    
    This endpoint creates a professional presentation that includes:
    - Title slide with company branding
    - Company overview
    - Technology stack
    - Challenges with imagery
    - Solution approach
    - Key metrics with visualizations
    - Business outcomes
    - Testimonial (if provided)
    - Call to action
    
    All slides include AI-generated images and professional layouts.
    """
    try:
        from app.api.v1.services.gamma_service import get_gamma_service
        
        gamma_service = get_gamma_service()
        result = await gamma_service.generate_case_study_presentation(case_study_data)
        
        return {
            "success": True,
            "presentation_url": result.get("presentation_url"),
            "pdf_url": result.get("pdf_url"),
            "presentation_id": result.get("presentation_id"),
            "message": "Professional presentation generated with Gamma AI. Use pdf_url to download the PDF.",
            "instructions": "Click pdf_url to download the PDF, or visit presentation_url to view/edit online."
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating presentation: {str(e)}"
        )


# =============================================================================
# FILE PROXY ENDPOINTS - Secure file serving without exposing Azure URLs
# =============================================================================

# Mapping of file types to their field names and default content types
CASE_STUDY_FILE_TYPE_CONFIG = {
    "pdf": {"field": "pdf_url", "default_content_type": "application/pdf", "extension": ".pdf"},
}


@router.get(
    "/{case_id}/files/{file_type}",
    summary="Get Case Study File (Secure Proxy)",
    description="""
    Securely serve case study files (PDF) through the backend.
    
    **Security Benefits:**
    - Azure Blob SAS tokens are never exposed to the client
    - Files are served through the backend, enabling access control
    - Supports future authentication requirements
    
    **File Types:**
    - `pdf` - PDF document
    
    **Response:**
    - Streams the file with appropriate Content-Type header
    - Includes Content-Disposition for downloads
    """,
    responses={
        200: {"description": "File stream"},
        404: {"description": "Case study or file not found"},
        400: {"description": "Invalid file type"},
    },
)
async def get_case_study_file(
    case_id: str,
    file_type: str,
    download: bool = Query(default=False, description="Force download instead of inline display"),
    service: CaseStudyService = Depends(get_case_study_service),
) -> StreamingResponse:
    """
    Securely proxy files from Azure Blob Storage.
    
    This endpoint fetches files from Azure Blob Storage and streams them to the client,
    keeping the Azure SAS token secure on the server side.
    """
    # Validate file type
    if file_type not in CASE_STUDY_FILE_TYPE_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file_type}. Must be one of: {list(CASE_STUDY_FILE_TYPE_CONFIG.keys())}"
        )
    
    config = CASE_STUDY_FILE_TYPE_CONFIG[file_type]
    
    # Get blob paths for this case study
    try:
        blob_paths = await service.get_blob_paths(case_id)
    except CaseStudyNotFoundError:
        raise HTTPException(status_code=404, detail=f"Case study not found: {case_id}")
    
    # Get the blob path for the requested file type
    blob_path = blob_paths.get(config["field"], "")
    
    if not blob_path:
        raise HTTPException(
            status_code=404,
            detail=f"No {file_type} file found for this case study"
        )
    
    # Get Azure Blob Service and stream the file
    blob_service = get_azure_blob_service()
    
    try:
        # Get file info for headers
        content_type, content_length = await blob_service.get_file_info(blob_path)
        
        # Determine filename for Content-Disposition
        filename = f"{case_id}_{file_type}{config['extension']}"
        
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


@router.post(
    "/enhance",
    response_model=ExtractResponse,
    status_code=status.HTTP_200_OK,
    summary="Enhance Case Study Content with AI",
    description="""
    Enhance prefilled case study data into a full-fledged, professionally written case study.
    
    Takes basic case study information and uses AI to:
    - Expand descriptions with professional writing
    - Enhance challenges and approaches with detailed bullet points
    - Generate or improve metrics with realistic, impressive numbers
    - Create compelling business outcomes
    - Generate professional testimonials if missing
    
    The enhanced content is optimized for PDF generation with:
    - Logo placement instructions
    - AI-generated image placement instructions
    - Professional formatting and structure
    """,
)
async def enhance_case_study_content(
    case_study_data: Dict[str, Any],
) -> ExtractResponse:
    """
    Enhance case study content using AI to create a professional, comprehensive document.
    
    This endpoint transforms basic case study information into polished content ready for PDF generation.
    """
    try:
        from app.api.v1.services.llm_service import LLMService
        
        llm_service = LLMService()
        enhanced_data = await llm_service.enhance_case_study_content(case_study_data)
        
        return ExtractResponse(
            success=True,
            data=enhanced_data,
            message="Case study content enhanced successfully"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error enhancing case study: {str(e)}"
        )

