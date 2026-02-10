"""
Testimonials Endpoints - API endpoints for testimonial operations.

Endpoints:
- POST /testimonials - Create testimonial
- GET /testimonials - Get all standalone testimonials with filters
- GET /testimonials/combined - Get all testimonials (merged with case studies)
- GET /testimonials/{testimonial_id} - Get a single testimonial by ID
- PUT /testimonials/{testimonial_id} - Update a testimonial
- DELETE /testimonials/{testimonial_id} - Delete a testimonial

Field naming convention: snake_case (matching frontend requirements)
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, Form

from app.api.v1.models.testimonial import (
    CreateTestimonialRequest,
    CreateTestimonialResponse,
    UpdateTestimonialRequest,
    UpdateTestimonialResponse,
    TestimonialResponse,
    DeleteTestimonialResponse,
)
from app.api.v1.services.testimonial_service import TestimonialService
from app.api.v1.dependencies.services import get_testimonial_service

router = APIRouter(prefix="/testimonials")


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "",
    response_model=CreateTestimonialResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Testimonial",
    description="""
    Create a new standalone testimonial.
    
    **Required fields:**
    - company_name: Company name
    - testimonial_quote: The testimonial quote/text
    - testimonial_author: Author name
    - testimonial_position: Author's position/title
    
    **Optional fields:**
    - status: 'published' or 'draft' (default: 'draft')
    """,
)
async def create_testimonial(
    company_name: str = Form(..., description="Company name"),
    testimonial_quote: str = Form(..., description="Testimonial quote"),
    testimonial_author: str = Form(..., description="Author name"),
    testimonial_position: str = Form(..., description="Author position/title"),
    status: str = Form(default="draft", description="Status: 'published' or 'draft'"),
    service: TestimonialService = Depends(get_testimonial_service),
) -> CreateTestimonialResponse:
    """Create a new testimonial."""
    request = CreateTestimonialRequest(
        company_name=company_name,
        testimonial_quote=testimonial_quote,
        testimonial_author=testimonial_author,
        testimonial_position=testimonial_position,
        status=status,
    )
    return await service.create_testimonial(request)


@router.get(
    "",
    response_model=List[TestimonialResponse],
    summary="Get All Standalone Testimonials",
    description="""
    Retrieve all standalone testimonials with optional filtering.
    
    **Filters:**
    - `status`: Filter by status ('published' or 'draft')
    
    **Returns:** List of standalone testimonials only (does not include case study testimonials).
    """,
)
async def get_all_testimonials(
    status: Optional[str] = Query(default=None, description="Filter by status ('published' or 'draft')"),
    service: TestimonialService = Depends(get_testimonial_service),
) -> List[TestimonialResponse]:
    """Get all standalone testimonials with optional filters."""
    return await service.get_all_testimonials(status=status)


@router.get(
    "/combined",
    response_model=List[Dict[str, Any]],
    summary="Get All Testimonials (Combined)",
    description="""
    Retrieve all testimonials from both standalone testimonials and case studies.
    
    **Combines:**
    1. Published standalone testimonials from testimonials collection
    2. Published case study testimonials (that have both quote and author)
    
    **Returns:** List of testimonials with company information and source indicator.
    Each testimonial includes a 'source' field ('testimonials' or 'case_studies').
    """,
)
async def get_combined_testimonials(
    service: TestimonialService = Depends(get_testimonial_service),
) -> List[Dict[str, Any]]:
    """Get all testimonials from both standalone collection and case studies."""
    return await service.get_combined_testimonials()


@router.get(
    "/{testimonial_id}",
    response_model=TestimonialResponse,
    summary="Get Testimonial by ID",
    description="""
    Retrieve a single testimonial by its unique ID.
    
    **Returns:** Full testimonial details.
    """,
    responses={
        200: {"description": "Testimonial found"},
        404: {"description": "Testimonial not found"},
    },
)
async def get_testimonial_by_id(
    testimonial_id: str,
    service: TestimonialService = Depends(get_testimonial_service),
) -> TestimonialResponse:
    """Get a single testimonial by its unique ID."""
    return await service.get_testimonial_by_id(testimonial_id)


@router.put(
    "/{testimonial_id}",
    response_model=UpdateTestimonialResponse,
    summary="Update Testimonial",
    description="""
    Update an existing testimonial.
    
    **Field behavior:**
    - Send field with value → Updates the field
    - Send empty string → No change (field stays as is)
    - Don't send field at all → No change (field stays as is)
    
    **Updatable fields:**
    - company_name
    - testimonial_quote
    - testimonial_author
    - testimonial_position
    - status
    """,
    responses={
        200: {"description": "Testimonial updated successfully"},
        404: {"description": "Testimonial not found"},
        422: {"description": "Validation error"},
    },
)
async def update_testimonial(
    testimonial_id: str,
    company_name: Optional[str] = Form(default="", description="Company name"),
    testimonial_quote: Optional[str] = Form(default="", description="Testimonial quote"),
    testimonial_author: Optional[str] = Form(default="", description="Author name"),
    testimonial_position: Optional[str] = Form(default="", description="Author position/title"),
    status: Optional[str] = Form(default="", description="Status: 'published' or 'draft'"),
    service: TestimonialService = Depends(get_testimonial_service),
) -> UpdateTestimonialResponse:
    """Update an existing testimonial. Only provided fields will be updated."""
    # Build update data dictionary - only include non-empty fields
    update_data: Dict[str, Any] = {}
    
    if company_name and company_name.strip():
        update_data["company_name"] = company_name
    
    if testimonial_quote and testimonial_quote.strip():
        update_data["testimonial_quote"] = testimonial_quote
    
    if testimonial_author and testimonial_author.strip():
        update_data["testimonial_author"] = testimonial_author
    
    if testimonial_position and testimonial_position.strip():
        update_data["testimonial_position"] = testimonial_position
    
    if status and status.strip():
        update_data["status"] = status
    
    # Create update request
    request = UpdateTestimonialRequest(**update_data)
    
    return await service.update_testimonial(testimonial_id, request)


@router.delete(
    "/{testimonial_id}",
    response_model=DeleteTestimonialResponse,
    summary="Delete Testimonial",
    description="""
    Delete a testimonial by its unique ID.
    
    **Warning:** This action is irreversible.
    """,
    responses={
        200: {"description": "Testimonial deleted successfully"},
        404: {"description": "Testimonial not found"},
    },
)
async def delete_testimonial(
    testimonial_id: str,
    service: TestimonialService = Depends(get_testimonial_service),
) -> DeleteTestimonialResponse:
    """Delete a testimonial by its unique ID."""
    return await service.delete_testimonial(testimonial_id)
