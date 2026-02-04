"""
PDF Download Service - Business logic for PDF download lead capture.

This service handles all business logic for capturing lead data
when users download PDFs without being logged in.
"""

from typing import List, Optional

from app.api.v1.models.pdf_download import (
    PDFDownloadRequest,
    PDFDownloadResponse,
    PDFDownloadRecord,
)
from app.api.v1.repositories.pdf_download_repository import PDFDownloadRepository


class PDFDownloadService:
    """Service for PDF download lead capture business logic."""

    def __init__(self, repository: PDFDownloadRepository):
        """Initialize service with repository."""
        self._repository = repository

    def _to_record(self, doc: dict) -> PDFDownloadRecord:
        """Convert MongoDB document to PDFDownloadRecord."""
        return PDFDownloadRecord(
            id=str(doc.get("id", doc.get("_id", ""))),
            first_name=doc.get("first_name", ""),
            last_name=doc.get("last_name", ""),
            email=doc.get("email", ""),
            company=doc.get("company", ""),
            job_function=doc.get("job_function", ""),
            country=doc.get("country", ""),
            business_phone=doc.get("business_phone", ""),
            resource_type=doc.get("resource_type", ""),
            resource_id=doc.get("resource_id", ""),
            resource_title=doc.get("resource_title", ""),
            created_at=doc.get("created_at"),
        )

    async def create_download_record(
        self, request: PDFDownloadRequest
    ) -> PDFDownloadResponse:
        """
        Create a new PDF download record.
        
        This captures lead data when a non-logged-in user downloads a PDF.
        
        Args:
            request: PDFDownloadRequest with lead and resource data
            
        Returns:
            PDFDownloadResponse with record ID and success message
        """
        # Convert request to dict for storage
        download_data = request.model_dump()

        # Create record in database
        created_doc = await self._repository.create(download_data)

        return PDFDownloadResponse(
            id=str(created_doc["id"]),
            message="Download recorded successfully",
        )

    async def get_all_downloads(
        self,
        resource_type: Optional[str] = None,
        email: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[PDFDownloadRecord]:
        """
        Get all PDF download records with optional filters.
        
        Args:
            resource_type: Filter by resource type
            email: Filter by email address
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of PDFDownloadRecord
        """
        docs = await self._repository.get_all(
            resource_type=resource_type,
            email=email,
            skip=skip,
            limit=limit,
        )
        return [self._to_record(doc) for doc in docs]

    async def get_downloads_by_email(self, email: str) -> List[PDFDownloadRecord]:
        """
        Get all download records for a specific email.
        
        Args:
            email: Email address
            
        Returns:
            List of PDFDownloadRecord for the email
        """
        docs = await self._repository.get_by_email(email)
        return [self._to_record(doc) for doc in docs]

    async def get_downloads_by_resource(
        self, resource_type: str, resource_id: str
    ) -> List[PDFDownloadRecord]:
        """
        Get all download records for a specific resource.
        
        Args:
            resource_type: Type of resource ('accelerator' or 'case_study')
            resource_id: ID of the resource
            
        Returns:
            List of PDFDownloadRecord for the resource
        """
        docs = await self._repository.get_by_resource(resource_type, resource_id)
        return [self._to_record(doc) for doc in docs]
