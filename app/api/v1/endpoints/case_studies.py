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
- Images and PDFs are uploaded to Azure Blob Storage
- Folder structure: {slug}/{field_name}.{ext}
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
    Metrics,
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
    slug: str,
    field_name: str,
    blob_service: AzureBlobService,
) -> str:
    """
    Upload a file to Azure Blob Storage and return the blob path.
    
    Args:
        file: The uploaded file
        slug: Case study slug (used in folder name)
        field_name: Field name (hero_image, company_logo, etc.)
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
        slug=slug,
        field_name=field_name,
        original_filename=file.filename,
        content_type=mime_type,
    )
    
    return blob_path


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
    - hero_image: PNG/JPG (max 5MB)
    - company_logo: PNG/JPG/SVG (max 2MB)  
    - pdf_file: PDF only (max 10MB)
    - architecture_diagram: PNG/JPG/SVG (max 5MB)
    
    **Storage format:** Files are uploaded to Azure Blob with folder structure:
    `{slug}/{field_name}.{ext}`
    """,
)
async def create_case_study(
    # Required text fields
    title: str = Form(..., description="Case study title"),
    slug: str = Form(..., description="URL-friendly slug (unique)"),
    industry: str = Form(..., description="Industry sector"),
    company_name: str = Form(..., description="Client company name"),
    
    # Optional text fields
    featured: bool = Form(default=False, description="Whether case study is featured"),
    status: str = Form(default="draft", description="Status: 'published' or 'draft'"),
    tech_stack: str = Form(default="", description="JSON array: [\"MongoDB\",\"Python\",\"AWS\"]"),
    migration_type: str = Form(default="", description="Type of migration (nullable)"),
    description: str = Form(default="", description="Full description"),
    industry_details: str = Form(default="", description="Industry details (nullable)"),
    challenges: str = Form(default="", description="Challenges faced"),
    technical_constraints: str = Form(default="", description="Technical constraints (nullable)"),
    approach: str = Form(default="", description="Solution approach"),
    implementation_details: str = Form(default="", description="Implementation details"),
    business_outcomes: str = Form(default="", description="Business outcomes"),
    testimonial_quote: str = Form(default="", description="Testimonial quote (nullable)"),
    testimonial_author: str = Form(default="", description="Testimonial author (nullable)"),
    testimonial_position: str = Form(default="", description="Testimonial position (nullable)"),
    
    # Metrics fields
    time_reduction: str = Form(default="", description="Time reduction metric"),
    ingestion_speed: str = Form(default="", description="Ingestion speed metric"),
    data_accuracy: str = Form(default="", description="Data accuracy metric"),
    
    # File uploads - stored in Azure Blob Storage
    hero_image: UploadFile = File(default=None, media_type="image/*", description="Hero image PNG/JPG"),
    company_logo: UploadFile = File(default=None, media_type="image/*", description="Company logo"),
    pdf_file: UploadFile = File(default=None, media_type="application/pdf", description="PDF document"),
    architecture_diagram: UploadFile = File(default=None, media_type="image/*", description="Architecture diagram"),
    
    service: CaseStudyService = Depends(get_case_study_service),
) -> CreateCaseStudyResponse:
    """Create a case study with files stored in Azure Blob Storage."""
    
    # Get Azure Blob Service
    blob_service = get_azure_blob_service()
    
    # Upload files to Azure Blob Storage and get blob paths
    blob_paths: Dict[str, str] = {}
    
    if is_valid_file(hero_image):
        blob_paths["hero_image"] = await upload_file_to_blob(
            hero_image, slug, "hero_image", blob_service
        )
    
    if is_valid_file(company_logo):
        blob_paths["company_logo"] = await upload_file_to_blob(
            company_logo, slug, "company_logo", blob_service
        )
    
    if is_valid_file(pdf_file):
        blob_paths["pdf_url"] = await upload_file_to_blob(
            pdf_file, slug, "pdf_url", blob_service
        )
    
    if is_valid_file(architecture_diagram):
        blob_paths["architecture_diagram"] = await upload_file_to_blob(
            architecture_diagram, slug, "architecture_diagram", blob_service
        )
    
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
    
    # Build metrics object
    metrics = Metrics(
        time_reduction=time_reduction if time_reduction else None,
        ingestion_speed=ingestion_speed if ingestion_speed else None,
        data_accuracy=data_accuracy if data_accuracy else None,
    )
    
    # Create request object with blob paths
    request = CreateCaseStudyRequest(
        title=title,
        slug=slug,
        featured=featured,
        status=status,
        industry=industry,
        tech_stack=tech_stack_list,
        migration_type=migration_type if migration_type else None,
        company_name=company_name,
        company_logo=blob_paths.get("company_logo", ""),
        description=description,
        industry_details=industry_details if industry_details else None,
        challenges=challenges,
        technical_constraints=technical_constraints if technical_constraints else None,
        approach=approach,
        architecture_diagram=blob_paths.get("architecture_diagram"),
        implementation_details=implementation_details,
        metrics=metrics,
        business_outcomes=business_outcomes,
        testimonial_quote=testimonial_quote if testimonial_quote else None,
        testimonial_author=testimonial_author if testimonial_author else None,
        testimonial_position=testimonial_position if testimonial_position else None,
        hero_image=blob_paths.get("hero_image", ""),
        pdf_url=blob_paths.get("pdf_url", ""),
    )
    
    # Create case study (no file_data needed, blob paths are in request)
    return await service.create_case_study(request)


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
    slug: str = Form(default="", description="URL-friendly slug"),
    industry: str = Form(default="", description="Industry sector"),
    company_name: str = Form(default="", description="Client company name"),
    featured: str = Form(default="", description="true or false"),
    status: str = Form(default="", description="Status: 'published' or 'draft'"),
    tech_stack: str = Form(default="", description="JSON array: [\"MongoDB\",\"Python\",\"AWS\"]"),
    migration_type: str = Form(default="", description="Type of migration"),
    description: str = Form(default="", description="Full description"),
    industry_details: str = Form(default="", description="Industry details"),
    challenges: str = Form(default="", description="Challenges faced"),
    technical_constraints: str = Form(default="", description="Technical constraints"),
    approach: str = Form(default="", description="Solution approach"),
    implementation_details: str = Form(default="", description="Implementation details"),
    business_outcomes: str = Form(default="", description="Business outcomes"),
    testimonial_quote: str = Form(default="", description="Testimonial quote"),
    testimonial_author: str = Form(default="", description="Testimonial author"),
    testimonial_position: str = Form(default="", description="Testimonial position"),
    
    # Metrics fields
    time_reduction: str = Form(default="", description="Time reduction metric"),
    ingestion_speed: str = Form(default="", description="Ingestion speed metric"),
    data_accuracy: str = Form(default="", description="Data accuracy metric"),
    
    # File uploads - stored in Azure Blob Storage
    hero_image: UploadFile = File(default=None, media_type="image/*", description="Hero image PNG/JPG"),
    company_logo: UploadFile = File(default=None, media_type="image/*", description="Company logo"),
    pdf_file: UploadFile = File(default=None, media_type="application/pdf", description="PDF document"),
    architecture_diagram: UploadFile = File(default=None, media_type="image/*", description="Architecture diagram"),
    
    service: CaseStudyService = Depends(get_case_study_service),
) -> UpdateCaseStudyResponse:
    """Update an existing case study. Only provided fields will be updated."""
    
    # Get Azure Blob Service
    blob_service = get_azure_blob_service()
    
    # Get existing case study to retrieve old blob paths for deletion
    # We need to get raw document to access blob paths (not full URLs)
    existing_detail = await service.get_case_study_by_id(case_id)
    existing_slug = existing_detail.slug
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
    if industry_details:
        update_data["industry_details"] = industry_details
    if challenges:
        update_data["challenges"] = challenges
    if technical_constraints:
        update_data["technical_constraints"] = technical_constraints
    if approach:
        update_data["approach"] = approach
    if implementation_details:
        update_data["implementation_details"] = implementation_details
    if business_outcomes:
        update_data["business_outcomes"] = business_outcomes
    if testimonial_quote:
        update_data["testimonial_quote"] = testimonial_quote
    if testimonial_author:
        update_data["testimonial_author"] = testimonial_author
    if testimonial_position:
        update_data["testimonial_position"] = testimonial_position
    
    # Handle metrics
    if time_reduction or ingestion_speed or data_accuracy:
        update_data["metrics"] = Metrics(
            time_reduction=time_reduction if time_reduction else None,
            ingestion_speed=ingestion_speed if ingestion_speed else None,
            data_accuracy=data_accuracy if data_accuracy else None,
        )
    
    # Use new slug if provided, otherwise use existing slug for file uploads
    upload_slug = slug if slug else existing_slug
    
    # Upload new files to Azure Blob Storage (delete old files first)
    if is_valid_file(hero_image):
        # Delete old file if exists
        if existing_blob_paths.get("hero_image"):
            await blob_service.delete_file(existing_blob_paths["hero_image"])
        # Upload new file
        update_data["hero_image"] = await upload_file_to_blob(
            hero_image, upload_slug, "hero_image", blob_service
        )
    
    if is_valid_file(company_logo):
        # Delete old file if exists
        if existing_blob_paths.get("company_logo"):
            await blob_service.delete_file(existing_blob_paths["company_logo"])
        # Upload new file
        update_data["company_logo"] = await upload_file_to_blob(
            company_logo, upload_slug, "company_logo", blob_service
        )
    
    if is_valid_file(pdf_file):
        # Delete old file if exists
        if existing_blob_paths.get("pdf_url"):
            await blob_service.delete_file(existing_blob_paths["pdf_url"])
        # Upload new file
        update_data["pdf_url"] = await upload_file_to_blob(
            pdf_file, upload_slug, "pdf_url", blob_service
        )
    
    if is_valid_file(architecture_diagram):
        # Delete old file if exists
        if existing_blob_paths.get("architecture_diagram"):
            await blob_service.delete_file(existing_blob_paths["architecture_diagram"])
        # Upload new file
        update_data["architecture_diagram"] = await upload_file_to_blob(
            architecture_diagram, upload_slug, "architecture_diagram", blob_service
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
