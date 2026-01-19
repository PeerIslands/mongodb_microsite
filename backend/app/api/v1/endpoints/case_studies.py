"""
Case Studies Endpoints - API endpoints for case study operations.

Endpoints:
- POST /case-studies - Create case study with file uploads (stored in Azure Blob Storage)
- GET /case-studies - Get all case studies with filters
- GET /case-studies/{case_id} - Get a single case study by ID
- PUT /case-studies/{case_id} - Update a case study
- DELETE /case-studies/{case_id} - Delete a case study

Field naming convention: snake_case (matching frontend requirements)

File Storage:
- PDFs are uploaded to Azure Blob Storage
- Folder structure: {case_id}/{field_name}.{ext}
- MongoDB stores the blob path, full URL is constructed at retrieval time
"""

import json
import mimetypes
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, File, UploadFile, Form

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
from app.api.v1.services.case_study_service import CaseStudyService
from app.api.v1.services.azure_blob_service import get_azure_blob_service, AzureBlobService
from app.api.v1.dependencies.services import get_case_study_service

router = APIRouter(prefix="/case-studies")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_valid_file(f) -> bool:
    """Check if an uploaded file is valid."""
    return f is not None and hasattr(f, 'filename') and f.filename and f.filename != ""


async def upload_file_to_blob(
    file: UploadFile,
    case_id: str,
    field_name: str,
    blob_service: AzureBlobService,
) -> str:
    """
    Upload a file to Azure Blob Storage and return the blob path.
    
    Args:
        file: The uploaded file
        case_id: Case study ID (used in folder name)
        field_name: Field name (pdf_url, etc.)
        blob_service: Azure Blob Service instance
        
    Returns:
        Blob path to store in MongoDB
    """
    content = await file.read()
    
    mime_type = file.content_type
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type:
            mime_type = "application/octet-stream"
    
    blob_path = await blob_service.upload_file(
        file_content=content,
        slug=case_id,  # Using case_id instead of slug for folder path
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
    `{case_id}/{field_name}.{ext}`
    
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
    challenges: str = Form(default="", description="Challenges faced"),
    approach: str = Form(default="", description="Solution approach"),
    business_outcomes: str = Form(default="", description="Business outcomes"),
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
    
    # Upload PDF file if provided (using case_id for folder path)
    if is_valid_file(pdf_file):
        blob_service = get_azure_blob_service()
        pdf_blob_path = await upload_file_to_blob(
            pdf_file, case_id, "pdf_url", blob_service
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
    
    **All fields are optional** - only provided fields will be updated.
    
    **File fields:** Uncheck 'Send empty value' to see file picker.
    
    **Note:** When uploading new files, the old files in Azure Blob Storage
    will be automatically deleted and replaced with the new ones.
    
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
    # Optional text fields - empty string means "don't update"
    title: str = Form(default="", description="Case study title"),
    slug: str = Form(default="", description="URL-friendly slug derived from title"),
    industry: str = Form(default="", description="Industry sector"),
    company_name: str = Form(default="", description="Client company name"),
    featured: str = Form(default="", description="true or false"),
    status: str = Form(default="", description="Status: 'published' or 'draft'"),
    tech_stack: str = Form(default="", description="JSON array: [\"MongoDB\",\"Python\",\"AWS\"]"),
    migration_type: str = Form(default="", description="Type of migration"),
    description: str = Form(default="", description="Full description"),
    challenges: str = Form(default="", description="Challenges faced"),
    approach: str = Form(default="", description="Solution approach"),
    business_outcomes: str = Form(default="", description="Business outcomes"),
    testimonial_quote: str = Form(default="", description="Testimonial quote"),
    testimonial_author: str = Form(default="", description="Testimonial author"),
    testimonial_position: str = Form(default="", description="Testimonial position"),
    
    # Metrics field - JSON array of {label, value} objects (max 5)
    metrics: str = Form(default="", description='JSON array: [{"label": "Time Reduction", "value": "50%"}]'),
    
    # File uploads - stored in Azure Blob Storage
    pdf_file: UploadFile = File(default=None, media_type="application/pdf", description="PDF document"),
    
    service: CaseStudyService = Depends(get_case_study_service),
) -> UpdateCaseStudyResponse:
    """Update an existing case study. Only provided fields will be updated."""
    
    # Get Azure Blob Service
    blob_service = get_azure_blob_service()
    
    # Get existing case study to retrieve old blob paths for deletion
    existing_blob_paths = await service.get_blob_paths(case_id)
    
    # Build update data dictionary (only include non-empty fields)
    update_data: Dict[str, Any] = {}
    
    if title:
        update_data["title"] = title
    if slug:
        update_data["slug"] = slug
    if industry:
        update_data["industry"] = industry
    if company_name:
        update_data["company_name"] = company_name
    if featured:
        update_data["featured"] = featured.lower() == "true"
    if status:
        update_data["status"] = status
    if tech_stack:
        # Parse tech stack (accepts JSON array string)
        try:
            parsed = json.loads(tech_stack)
            if isinstance(parsed, list):
                update_data["tech_stack"] = [str(t).strip() for t in parsed if t]
        except json.JSONDecodeError:
            # Fallback to comma-separated for backwards compatibility
            update_data["tech_stack"] = [t.strip() for t in tech_stack.split(",") if t.strip()]
    if migration_type:
        update_data["migration_type"] = migration_type
    if description:
        update_data["description"] = description
    if challenges:
        update_data["challenges"] = challenges
    if approach:
        update_data["approach"] = approach
    if business_outcomes:
        update_data["business_outcomes"] = business_outcomes
    if testimonial_quote:
        update_data["testimonial_quote"] = testimonial_quote
    if testimonial_author:
        update_data["testimonial_author"] = testimonial_author
    if testimonial_position:
        update_data["testimonial_position"] = testimonial_position
    
    # Handle metrics
    if metrics:
        update_data["metrics"] = parse_metrics(metrics)
    
    # Upload new PDF file to Azure Blob Storage (delete old file first)
    if is_valid_file(pdf_file):
        # Delete old file if exists
        if existing_blob_paths.get("pdf_url"):
            await blob_service.delete_file(existing_blob_paths["pdf_url"])
        # Upload new file (using case_id for folder path)
        update_data["pdf_url"] = await upload_file_to_blob(
            pdf_file, case_id, "pdf_url", blob_service
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
