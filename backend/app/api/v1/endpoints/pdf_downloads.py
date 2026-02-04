"""
PDF Downloads Endpoints
=======================
Handles PDF download lead capture when users download PDFs without being logged in.

Endpoints:
- POST /pdf-downloads - Create a PDF download record (lead capture)
- GET /pdf-downloads - Get all PDF download records (admin only)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
import logging

from app.api.v1.models.pdf_download import (
    PDFDownloadRequest,
    PDFDownloadResponse,
    PDFDownloadRecord,
)
from app.api.v1.services.pdf_download_service import PDFDownloadService
from app.api.v1.dependencies.services import get_pdf_download_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pdf-downloads")


@router.post(
    "",
    response_model=PDFDownloadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create PDF download record",
    description="""
    Record a PDF download with lead capture data.
    
    This endpoint is called when a non-logged-in user fills out the 
    contact form to download a PDF. It captures their information
    along with which resource they downloaded.
    
    **Required Fields:**
    - first_name, last_name: User's name
    - email: Business email address
    - company: Company name
    - job_function: Job role/function
    - country: User's country
    - business_phone: Contact phone number
    - resource_type: 'accelerator' or 'case_study'
    - resource_id: ID of the resource being downloaded
    - resource_title: Title of the resource (for reporting)
    """,
)
async def create_download_record(
    request: PDFDownloadRequest,
    service: PDFDownloadService = Depends(get_pdf_download_service),
) -> PDFDownloadResponse:
    """
    Create a new PDF download record.
    
    This captures lead data when a non-logged-in user downloads a PDF.
    
    Args:
        request: PDFDownloadRequest with lead and resource data
        
    Returns:
        PDFDownloadResponse with record ID and success message
    """
    logger.info(
        f"PDF download recorded: {request.email} downloaded {request.resource_type}/{request.resource_id}"
    )
    return await service.create_download_record(request)


@router.get(
    "",
    response_model=List[PDFDownloadRecord],
    summary="Get all PDF download records",
    description="""
    Retrieve all PDF download records with optional filtering.
    
    **Filters:**
    - resource_type: Filter by 'accelerator' or 'case_study'
    - email: Filter by email address
    """,
)
async def get_all_downloads(
    resource_type: Optional[str] = Query(
        default=None, 
        description="Filter by resource type ('accelerator' or 'case_study')"
    ),
    email: Optional[str] = Query(
        default=None, 
        description="Filter by email address"
    ),
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=100, ge=1, le=500, description="Maximum records to return"),
    service: PDFDownloadService = Depends(get_pdf_download_service),
) -> List[PDFDownloadRecord]:
    """Get all PDF download records with optional filters."""
    return await service.get_all_downloads(
        resource_type=resource_type,
        email=email,
        skip=skip,
        limit=limit,
    )
