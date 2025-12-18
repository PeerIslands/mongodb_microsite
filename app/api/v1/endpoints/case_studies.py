"""
Case Studies Endpoints - API endpoints for case study operations.

Endpoints:
- POST /case-studies - Create case study with file uploads (stored as BSON Binary in MongoDB)
- GET /case-studies - Get all case studies with filters
- PUT /case-studies/{id} - Update a case study
"""

import mimetypes
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, File, UploadFile, Form
from bson import Binary

from app.api.v1.models.case_study import (
    CreateCaseStudyRequest,
    CreateCaseStudyResponse,
    UpdateCaseStudyRequest,
    UpdateCaseStudyResponse,
    CaseStudyResponse,
)
from app.api.v1.services.case_study_service import CaseStudyService
from app.api.v1.dependencies.services import get_case_study_service

router = APIRouter(prefix="/case-studies")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def file_to_binary_dict(file: UploadFile) -> Dict[str, Any]:
    """
    Convert an uploaded file to a BSON Binary dictionary.
    
    Stores raw binary data in MongoDB with metadata.
    Returns a dict with:
    - data: BSON Binary (raw bytes)
    - filename: Original filename
    - content_type: MIME type
    - size: File size in bytes
    """
    # Read file content
    content = await file.read()
    
    # Get MIME type
    mime_type = file.content_type
    if not mime_type:
        # Guess from filename
        mime_type, _ = mimetypes.guess_type(file.filename)
        if not mime_type:
            mime_type = "application/octet-stream"
    
    # Return dict with Binary data
    return {
        "data": Binary(content),  # Raw binary data stored in MongoDB
        "filename": file.filename,
        "content_type": mime_type,
        "size": len(content)
    }


def is_valid_file(f) -> bool:
    """Check if an uploaded file is valid."""
    return f is not None and hasattr(f, 'filename') and f.filename and f.filename != ""


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
    
    **Files are stored as base64 data directly in MongoDB.**
    Frontend can use them directly in img src or download links.
    
    **File fields:** Uncheck 'Send empty value' to see file picker.
    
    **Supported files:**
    - heroImage: PNG/JPG (max 5MB)
    - companyLogo: PNG/JPG/SVG (max 2MB)  
    - pdfFile: PDF only (max 10MB)
    - architectureDiagram: PNG/JPG/SVG (max 5MB)
    """,
)
async def create_case_study_with_files(
    # Required text fields
    title: str = Form(..., description="Case study title"),
    slug: str = Form(..., description="URL-friendly slug"),
    industry: str = Form(..., description="Industry sector"),
    migrationType: str = Form(..., description="Type of migration"),
    companyName: str = Form(..., description="Client company name"),
    
    # Optional text fields
    summary: str = Form(default="", description="Brief summary"),
    cs_description: str = Form(default="", alias="description", description="Full description"),
    industryDetails: str = Form(default="", description="Industry details"),
    businessImpact: str = Form(default="", description="Business impact"),
    technicalConstraints: str = Form(default="", description="Technical constraints"),
    solutionApproach: str = Form(default="", description="Solution approach"),
    implementationDetails: str = Form(default="", description="Implementation details"),
    testimonialQuote: str = Form(default="", description="Testimonial quote"),
    testimonialAuthor: str = Form(default="", description="Testimonial author"),
    testimonialPosition: str = Form(default="", description="Testimonial position"),
    techStack: str = Form(default="", description="Comma-separated: MongoDB,Python,AWS"),
    
    # Status fields
    cs_status: str = Form(default="draft", alias="status", description="published or draft"),
    featured: bool = Form(default=False, description="Featured flag"),
    
    # File uploads - stored as BSON Binary in MongoDB
    heroImage: UploadFile = File(default=None, media_type="image/*", description="Hero image PNG/JPG"),
    companyLogo: UploadFile = File(default=None, media_type="image/*", description="Company logo"),
    pdfFile: UploadFile = File(default=None, media_type="application/pdf", description="PDF document"),
    architectureDiagram: UploadFile = File(default=None, media_type="image/*", description="Architecture diagram"),
    
    service: CaseStudyService = Depends(get_case_study_service),
) -> CreateCaseStudyResponse:
    """Create a case study with files stored as raw binary in MongoDB."""
    
    # Convert files to BSON Binary dicts for MongoDB storage
    file_data: Dict[str, Any] = {}
    
    if is_valid_file(heroImage):
        file_data["heroImage"] = await file_to_binary_dict(heroImage)
    
    if is_valid_file(companyLogo):
        file_data["companyLogo"] = await file_to_binary_dict(companyLogo)
    
    if is_valid_file(pdfFile):
        file_data["pdfUrl"] = await file_to_binary_dict(pdfFile)
    
    if is_valid_file(architectureDiagram):
        file_data["architectureDiagram"] = await file_to_binary_dict(architectureDiagram)
    
    # Parse tech stack
    tech_stack_list = [t.strip() for t in techStack.split(",") if t.strip()] if techStack else []
    
    # Create request object (without file data - those go separately)
    request = CreateCaseStudyRequest(
        title=title,
        slug=slug,
        industry=industry,
        migrationType=migrationType,
        companyName=companyName,
        companyLogo="",  # Will be replaced with binary data
        summary=summary,
        description=cs_description,
        industryDetails=industryDetails if industryDetails else None,
        businessImpact=businessImpact,
        technicalConstraints=technicalConstraints if technicalConstraints else None,
        solutionApproach=solutionApproach,
        implementationDetails=implementationDetails,
        heroImage="",  # Will be replaced with binary data
        architectureDiagram="",  # Will be replaced with binary data
        pdfUrl=None,  # Will be replaced with binary data
        testimonialQuote=testimonialQuote if testimonialQuote else None,
        testimonialAuthor=testimonialAuthor if testimonialAuthor else None,
        testimonialPosition=testimonialPosition if testimonialPosition else None,
        techStack=tech_stack_list,
        status=cs_status,
        featured=featured,
        challenges=[],
        metrics=[],
        businessOutcomes=[],
        galleryImages=None,
        codeSnippets=None,
    )
    
    # Create with file data
    return await service.create_case_study_with_files(request, file_data)


@router.get(
    "",
    response_model=List[CaseStudyResponse],
    summary="Get All Case Studies",
    description="""
    Retrieve all case studies with optional filtering.
    
    **Filters:**
    - `industry`: Filter by industry sector
    - `status`: Filter by status ("published" or "draft")
    - `featured`: Filter by featured status (true/false)
    
    **Returns:** List of case studies with summary information.
    """,
)
async def get_all_case_studies(
    industry: Optional[str] = Query(None, description="Filter by industry"),
    status: Optional[str] = Query(None, description="Filter by status"),
    featured: Optional[bool] = Query(None, description="Filter by featured"),
    service: CaseStudyService = Depends(get_case_study_service),
) -> List[CaseStudyResponse]:
    """Get all case studies with optional filters."""
    return await service.get_all_case_studies(
        industry=industry,
        status=status,
        featured=featured,
    )


@router.put(
    "/{case_id}",
    response_model=UpdateCaseStudyResponse,
    summary="Update Case Study",
    description="""
    Update an existing case study with file uploads.
    
    **Files are stored as base64 data directly in MongoDB.**
    
    **All fields are optional** - only provided fields will be updated.
    
    **File fields:** Uncheck 'Send empty value' to see file picker.
    
    **Supported files:**
    - heroImage: PNG/JPG (max 5MB)
    - companyLogo: PNG/JPG/SVG (max 2MB)  
    - pdfFile: PDF only (max 10MB)
    - architectureDiagram: PNG/JPG/SVG (max 5MB)
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
    migrationType: str = Form(default="", description="Type of migration"),
    companyName: str = Form(default="", description="Client company name"),
    summary: str = Form(default="", description="Brief summary"),
    cs_description: str = Form(default="", alias="description", description="Full description"),
    industryDetails: str = Form(default="", description="Industry details"),
    businessImpact: str = Form(default="", description="Business impact"),
    technicalConstraints: str = Form(default="", description="Technical constraints"),
    solutionApproach: str = Form(default="", description="Solution approach"),
    implementationDetails: str = Form(default="", description="Implementation details"),
    testimonialQuote: str = Form(default="", description="Testimonial quote"),
    testimonialAuthor: str = Form(default="", description="Testimonial author"),
    testimonialPosition: str = Form(default="", description="Testimonial position"),
    techStack: str = Form(default="", description="Comma-separated: MongoDB,Python,AWS"),
    cs_status: str = Form(default="", alias="status", description="published or draft"),
    featured: str = Form(default="", description="true or false"),
    
    # File uploads - stored as BSON Binary in MongoDB
    heroImage: UploadFile = File(default=None, media_type="image/*", description="Hero image PNG/JPG"),
    companyLogo: UploadFile = File(default=None, media_type="image/*", description="Company logo"),
    pdfFile: UploadFile = File(default=None, media_type="application/pdf", description="PDF document"),
    architectureDiagram: UploadFile = File(default=None, media_type="image/*", description="Architecture diagram"),
    
    service: CaseStudyService = Depends(get_case_study_service),
) -> UpdateCaseStudyResponse:
    """
    Update an existing case study with files stored as raw binary in MongoDB.
    Only the fields provided will be updated.
    """
    # Build update data dictionary (only include non-empty fields)
    update_data = {}
    
    if title:
        update_data["title"] = title
    if slug:
        update_data["slug"] = slug
    if industry:
        update_data["industry"] = industry
    if migrationType:
        update_data["migrationType"] = migrationType
    if companyName:
        update_data["companyName"] = companyName
    if summary:
        update_data["summary"] = summary
    if cs_description:
        update_data["description"] = cs_description
    if industryDetails:
        update_data["industryDetails"] = industryDetails
    if businessImpact:
        update_data["businessImpact"] = businessImpact
    if technicalConstraints:
        update_data["technicalConstraints"] = technicalConstraints
    if solutionApproach:
        update_data["solutionApproach"] = solutionApproach
    if implementationDetails:
        update_data["implementationDetails"] = implementationDetails
    if testimonialQuote:
        update_data["testimonialQuote"] = testimonialQuote
    if testimonialAuthor:
        update_data["testimonialAuthor"] = testimonialAuthor
    if testimonialPosition:
        update_data["testimonialPosition"] = testimonialPosition
    if techStack:
        update_data["techStack"] = [t.strip() for t in techStack.split(",") if t.strip()]
    if cs_status:
        update_data["status"] = cs_status
    if featured:
        update_data["featured"] = featured.lower() == "true"
    
    # Convert files to BSON Binary for MongoDB storage
    file_data: Dict[str, Any] = {}
    
    if is_valid_file(heroImage):
        file_data["heroImage"] = await file_to_binary_dict(heroImage)
    
    if is_valid_file(companyLogo):
        file_data["companyLogo"] = await file_to_binary_dict(companyLogo)
    
    if is_valid_file(pdfFile):
        file_data["pdfUrl"] = await file_to_binary_dict(pdfFile)
    
    if is_valid_file(architectureDiagram):
        file_data["architectureDiagram"] = await file_to_binary_dict(architectureDiagram)
    
    # Create update request
    request = UpdateCaseStudyRequest(**update_data)
    
    return await service.update_case_study(case_id, request, file_data)

