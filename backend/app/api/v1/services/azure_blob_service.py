"""
Azure Blob Storage Service - Handles file uploads to Azure Blob Storage.

This service uploads files to Azure Blob Storage and returns the blob path
that can be stored in MongoDB. Full URLs are constructed at retrieval time.
"""

import mimetypes
from typing import Optional
from urllib.parse import urlparse, parse_qs
import httpx

from app.core.config import settings


class AzureBlobService:
    """
    Service for uploading and managing files in Azure Blob Storage.
    
    Uses SAS URL for authentication (no Azure SDK required).
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

    def _get_file_extension(self, filename: str, content_type: str) -> str:
        """
        Get file extension from filename or content type.
        
        Args:
            filename: Original filename
            content_type: MIME content type
            
        Returns:
            File extension with dot (e.g., '.png')
        """
        if filename and '.' in filename:
            return '.' + filename.rsplit('.', 1)[1].lower()
        
        # Fallback to content type
        ext = mimetypes.guess_extension(content_type)
        if ext:
            return ext
        
        # Default extensions based on content type
        content_type_map = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/svg+xml': '.svg',
            'image/webp': '.webp',
            'application/pdf': '.pdf',
        }
        return content_type_map.get(content_type, '.bin')

    async def upload_file(
        self,
        file_content: bytes,
        slug: str,
        field_name: str,
        original_filename: str,
        content_type: str,
    ) -> str:
        """
        Upload a file to Azure Blob Storage.
        
        Creates folder structure: {slug}/{field_name}.{ext}
        
        Args:
            file_content: Raw file bytes
            slug: Case study slug (used as folder name)
            field_name: Field name (hero_image, company_logo, etc.)
            original_filename: Original filename for extension detection
            content_type: MIME content type
            
        Returns:
            Blob path (without base URL) e.g., "my-case-study/hero_image.png"
        """
        if not self._sas_url:
            raise ValueError("Azure Blob SAS URL not configured")
        
        # Get file extension
        extension = self._get_file_extension(original_filename, content_type)
        
        # Create standardized filename: {field_name}.{ext}
        standardized_filename = f"{field_name}{extension}"
        
        # Full blob path: {slug}/{field_name}.{ext}
        blob_path = f"{slug}/{standardized_filename}"
        
        # Construct upload URL with SAS token
        upload_url = f"{self._base_url}/{blob_path}?{self._sas_token}"
        
        # Set appropriate content type header
        headers = {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": content_type,
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
            blob_path: Blob path (e.g., "my-case-study/hero_image.png")
            
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

