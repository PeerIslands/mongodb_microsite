"""
Azure Blob Storage Service - Handles PDF uploads to Azure Blob Storage.

This service uploads PDF files to Azure Blob Storage and returns the blob path
that can be stored in MongoDB. Full URLs are constructed at retrieval time.

Supported file types: PDF only
"""

from typing import Optional
from urllib.parse import urlparse
import httpx

from app.core.config import settings


# Allowed content types for PDF files
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
}

# Maximum file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024


class AzureBlobServiceError(Exception):
    """Custom exception for Azure Blob Service errors."""
    pass


class AzureBlobService:
    """
    Service for uploading and managing PDF files in Azure Blob Storage.
    
    Uses SAS URL for authentication (no Azure SDK required).
    Only accepts PDF files.
    """

    def __init__(self):
        """Initialize the Azure Blob Service with SAS URL from settings."""
        self._sas_url = settings.AZURE_BLOB_SAS_URL
        self._base_url, self._sas_token = self._parse_sas_url(self._sas_url)
    
    def _parse_sas_url(self, sas_url: str) -> tuple[str, str]:
        """
        Parse the SAS URL into base URL and SAS token.
        
        Args:
            sas_url: Full SAS URL like https://account.blob.core.windows.net/container?sp=...
            
        Returns:
            Tuple of (base_url, sas_token)
        """
        if not sas_url:
            return "", ""
        
        parsed = urlparse(sas_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        sas_token = parsed.query
        return base_url, sas_token

    def _validate_pdf_file(self, content_type: str, file_content: bytes, original_filename: str) -> None:
        """
        Validate that the file is a valid PDF.
        
        Args:
            content_type: MIME content type
            file_content: Raw file bytes
            original_filename: Original filename
            
        Raises:
            AzureBlobServiceError: If file is not a valid PDF
        """
        # Check content type
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise AzureBlobServiceError(
                f"Invalid file type: {content_type}. Only PDF files are allowed."
            )
        
        # Check file extension
        if original_filename and not original_filename.lower().endswith('.pdf'):
            raise AzureBlobServiceError(
                "Invalid file extension. Only .pdf files are allowed."
            )
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise AzureBlobServiceError(
                f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB."
            )
        
        # Check PDF magic bytes (PDF files start with %PDF-)
        if not file_content.startswith(b'%PDF-'):
            raise AzureBlobServiceError(
                "Invalid PDF file. File does not appear to be a valid PDF."
            )

    async def upload_file(
        self,
        file_content: bytes,
        slug: str,
        field_name: str,
        original_filename: str,
        content_type: str,
    ) -> str:
        """
        Upload a PDF file to Azure Blob Storage.
        
        Creates folder structure: {case_id}/{field_name}.pdf
        
        Args:
            file_content: Raw file bytes
            slug: Case study ID (used as folder name)
            field_name: Field name (pdf_url)
            original_filename: Original filename for validation
            content_type: MIME content type (must be application/pdf)
            
        Returns:
            Blob path (without base URL) e.g., "abc123/pdf_url.pdf"
            
        Raises:
            AzureBlobServiceError: If file is not a valid PDF
            ValueError: If Azure Blob SAS URL not configured
        """
        if not self._sas_url:
            raise ValueError("Azure Blob SAS URL not configured")
        
        # Validate PDF file
        self._validate_pdf_file(content_type, file_content, original_filename)
        
        # Create standardized filename: {field_name}.pdf
        standardized_filename = f"{field_name}.pdf"
        
        # Full blob path: {case_id}/{field_name}.pdf
        blob_path = f"{slug}/{standardized_filename}"
        
        # Construct upload URL with SAS token
        upload_url = f"{self._base_url}/{blob_path}?{self._sas_token}"
        
        # Set appropriate content type header
        headers = {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": "application/pdf",
        }
        
        # Upload file using httpx
        async with httpx.AsyncClient() as client:
            response = await client.put(
                upload_url,
                content=file_content,
                headers=headers,
                timeout=60.0,  # 60 second timeout for large files
            )
            response.raise_for_status()
        
        return blob_path

    async def delete_file(self, blob_path: str) -> bool:
        """
        Delete a file from Azure Blob Storage.
        
        Args:
            blob_path: Blob path (e.g., "abc123/pdf_url.pdf")
            
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self._sas_url or not blob_path:
            return False
        
        # Construct delete URL with SAS token
        delete_url = f"{self._base_url}/{blob_path}?{self._sas_token}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    delete_url,
                    timeout=30.0,
                )
                # 202 Accepted or 404 Not Found are both "success" for delete
                return response.status_code in [202, 204, 404]
        except Exception:
            return False

    def get_full_url(self, blob_path: str) -> str:
        """
        Construct full URL from blob path.
        
        Args:
            blob_path: Blob path stored in MongoDB
            
        Returns:
            Full URL with SAS token for accessing the file
        """
        if not blob_path or not self._sas_url:
            return ""
        
        return f"{self._base_url}/{blob_path}?{self._sas_token}"


# Singleton instance
_azure_blob_service: Optional[AzureBlobService] = None


def get_azure_blob_service() -> AzureBlobService:
    """Get or create Azure Blob Service instance."""
    global _azure_blob_service
    if _azure_blob_service is None:
        _azure_blob_service = AzureBlobService()
    return _azure_blob_service
