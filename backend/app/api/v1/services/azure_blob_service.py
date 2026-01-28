"""
Azure Blob Storage Service - Handles file uploads to Azure Blob Storage.

This service uploads PDF, video, and image files to Azure Blob Storage and returns the blob path
that can be stored in MongoDB. Full URLs are constructed at retrieval time.

Supported file types:
- PDF: application/pdf
- Video: video/mp4, video/webm, video/quicktime, video/x-msvideo
- Image: image/jpeg, image/png, image/webp, image/gif

Folder Structure:
- casestudies/{item_id}/{field_name}.pdf
- accelerators/{item_id}/{field_name}.pdf
- accelerators/{item_id}/{field_name}.mp4 (or other video extension)
- accelerators/{item_id}/{field_name}.jpg (or other image extension)
"""

from typing import Optional, Literal
from urllib.parse import urlparse
import httpx

from app.core.config import settings


# Allowed content types for PDF files
ALLOWED_PDF_CONTENT_TYPES = {
    "application/pdf",
}

# Allowed content types for video files
ALLOWED_VIDEO_CONTENT_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",  # .mov
    "video/x-msvideo",  # .avi
}

# Allowed content types for image files
ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
}

# Video file extensions mapping
VIDEO_EXTENSIONS = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi",
}

# Image file extensions mapping
IMAGE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
}

# Maximum file sizes
MAX_PDF_SIZE = 10 * 1024 * 1024      # 10MB for PDFs
MAX_VIDEO_SIZE = 100 * 1024 * 1024   # 100MB for videos
MAX_IMAGE_SIZE = 5 * 1024 * 1024     # 5MB for images
MAX_SVG_SIZE = 2 * 1024 * 1024       # 2MB for SVG files

# Valid categories for folder organization
CategoryType = Literal["casestudies", "accelerators", "emailtemplates"]
VALID_CATEGORIES = ["casestudies", "accelerators", "emailtemplates"]


class AzureBlobServiceError(Exception):
    """Custom exception for Azure Blob Service errors."""
    pass


class AzureBlobService:
    """
    Service for uploading and managing files in Azure Blob Storage.
    
    Uses SAS URL for authentication (no Azure SDK required).
    Supports PDF and video files.
    
    Folder structure: {category}/{item_id}/{field_name}.{ext}
    Categories: casestudies, accelerators
    
    Note: Blogs are stored in MongoDB only (no Azure Blob uploads).
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
        if content_type not in ALLOWED_PDF_CONTENT_TYPES:
            raise AzureBlobServiceError(
                f"Invalid file type: {content_type}. Only PDF files are allowed."
            )
        
        # Check file extension
        if original_filename and not original_filename.lower().endswith('.pdf'):
            raise AzureBlobServiceError(
                "Invalid file extension. Only .pdf files are allowed."
            )
        
        # Check file size
        if len(file_content) > MAX_PDF_SIZE:
            raise AzureBlobServiceError(
                f"File too large. Maximum size is {MAX_PDF_SIZE // (1024 * 1024)}MB."
            )
        
        # Check PDF magic bytes (PDF files start with %PDF-)
        if not file_content.startswith(b'%PDF-'):
            raise AzureBlobServiceError(
                "Invalid PDF file. File does not appear to be a valid PDF."
            )

    def _validate_video_file(self, content_type: str, file_content: bytes, original_filename: str) -> str:
        """
        Validate that the file is a valid video.
        
        Args:
            content_type: MIME content type
            file_content: Raw file bytes
            original_filename: Original filename
            
        Returns:
            File extension for the video (e.g., ".mp4")
            
        Raises:
            AzureBlobServiceError: If file is not a valid video
        """
        # Check content type
        if content_type not in ALLOWED_VIDEO_CONTENT_TYPES:
            raise AzureBlobServiceError(
                f"Invalid file type: {content_type}. Allowed video types: mp4, webm, mov, avi."
            )
        
        # Check file size
        if len(file_content) > MAX_VIDEO_SIZE:
            raise AzureBlobServiceError(
                f"Video too large. Maximum size is {MAX_VIDEO_SIZE // (1024 * 1024)}MB."
            )
        
        # Return the appropriate extension
        return VIDEO_EXTENSIONS.get(content_type, ".mp4")

    def _validate_image_file(self, content_type: str, file_content: bytes, original_filename: str) -> str:
        """
        Validate that the file is a valid image.
        
        Args:
            content_type: MIME content type
            file_content: Raw file bytes
            original_filename: Original filename
            
        Returns:
            File extension for the image (e.g., ".jpg")
            
        Raises:
            AzureBlobServiceError: If file is not a valid image
        """
        # Check content type
        if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
            raise AzureBlobServiceError(
                f"Invalid file type: {content_type}. Allowed image types: jpeg, png, webp, gif, svg."
            )
        
        # Check file size (different limit for SVG)
        max_size = MAX_SVG_SIZE if content_type == "image/svg+xml" else MAX_IMAGE_SIZE
        if len(file_content) > max_size:
            raise AzureBlobServiceError(
                f"Image too large. Maximum size is {max_size // (1024 * 1024)}MB."
            )
        
        # Return the appropriate extension
        return IMAGE_EXTENSIONS.get(content_type, ".jpg")

    async def upload_file(
        self,
        file_content: bytes,
        category: CategoryType,
        item_id: str,
        field_name: str,
        original_filename: str,
        content_type: str,
    ) -> str:
        """
        Upload a PDF file to Azure Blob Storage.
        
        Creates folder structure: {category}/{item_id}/{field_name}.pdf
        
        Args:
            file_content: Raw file bytes
            category: Category folder - "casestudies", "accelerators", or "blogs"
            item_id: Item ID (case study ID, accelerator ID, or blog ID)
            field_name: Field name (pdf_url)
            original_filename: Original filename for validation
            content_type: MIME content type (must be application/pdf)
            
        Returns:
            Blob path (without base URL) e.g., "casestudies/abc123/pdf_url.pdf"
            
        Raises:
            AzureBlobServiceError: If file is not a valid PDF or invalid category
            ValueError: If Azure Blob SAS URL not configured
        """
        if not self._sas_url:
            raise ValueError("Azure Blob SAS URL not configured")
        
        # Validate category
        if category not in VALID_CATEGORIES:
            raise AzureBlobServiceError(
                f"Invalid category: {category}. Must be one of {VALID_CATEGORIES}"
            )
        
        # Validate PDF file
        self._validate_pdf_file(content_type, file_content, original_filename)
        
        # Create standardized filename: {field_name}.pdf
        standardized_filename = f"{field_name}.pdf"
        
        # Full blob path: {category}/{item_id}/{field_name}.pdf
        blob_path = f"{category}/{item_id}/{standardized_filename}"
        
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

    async def upload_video(
        self,
        file_content: bytes,
        category: CategoryType,
        item_id: str,
        field_name: str,
        original_filename: str,
        content_type: str,
    ) -> str:
        """
        Upload a video file to Azure Blob Storage.
        
        Creates folder structure: {category}/{item_id}/{field_name}.{ext}
        
        Args:
            file_content: Raw file bytes
            category: Category folder - "casestudies" or "accelerators"
            item_id: Item ID (case study ID or accelerator ID)
            field_name: Field name (video_url)
            original_filename: Original filename for validation
            content_type: MIME content type (must be a video type)
            
        Returns:
            Blob path (without base URL) e.g., "accelerators/abc123/video_url.mp4"
            
        Raises:
            AzureBlobServiceError: If file is not a valid video or invalid category
            ValueError: If Azure Blob SAS URL not configured
        """
        if not self._sas_url:
            raise ValueError("Azure Blob SAS URL not configured")
        
        # Validate category
        if category not in VALID_CATEGORIES:
            raise AzureBlobServiceError(
                f"Invalid category: {category}. Must be one of {VALID_CATEGORIES}"
            )
        
        # Validate video file and get extension
        file_extension = self._validate_video_file(content_type, file_content, original_filename)
        
        # Create standardized filename: {field_name}.{ext}
        standardized_filename = f"{field_name}{file_extension}"
        
        # Full blob path: {category}/{item_id}/{field_name}.{ext}
        blob_path = f"{category}/{item_id}/{standardized_filename}"
        
        # Construct upload URL with SAS token
        upload_url = f"{self._base_url}/{blob_path}?{self._sas_token}"
        
        # Set appropriate content type header
        headers = {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": content_type,
        }
        
        # Upload file using httpx with longer timeout for videos
        async with httpx.AsyncClient() as client:
            response = await client.put(
                upload_url,
                content=file_content,
                headers=headers,
                timeout=300.0,  # 5 minute timeout for large video files
            )
            response.raise_for_status()
        
        return blob_path

    async def upload_image(
        self,
        file_content: bytes,
        category: CategoryType,
        item_id: str,
        field_name: str,
        original_filename: str,
        content_type: str,
    ) -> str:
        """
        Upload an image file to Azure Blob Storage.
        
        Creates folder structure: {category}/{item_id}/{field_name}.{ext}
        
        Args:
            file_content: Raw file bytes
            category: Category folder - "casestudies" or "accelerators"
            item_id: Item ID (case study ID or accelerator ID)
            field_name: Field name (thumbnail_url)
            original_filename: Original filename for validation
            content_type: MIME content type (must be an image type)
            
        Returns:
            Blob path (without base URL) e.g., "accelerators/abc123/thumbnail_url.jpg"
            
        Raises:
            AzureBlobServiceError: If file is not a valid image or invalid category
            ValueError: If Azure Blob SAS URL not configured
        """
        if not self._sas_url:
            raise ValueError("Azure Blob SAS URL not configured")
        
        # Validate category
        if category not in VALID_CATEGORIES:
            raise AzureBlobServiceError(
                f"Invalid category: {category}. Must be one of {VALID_CATEGORIES}"
            )
        
        # Validate image file and get extension
        file_extension = self._validate_image_file(content_type, file_content, original_filename)
        
        # Create standardized filename: {field_name}.{ext}
        standardized_filename = f"{field_name}{file_extension}"
        
        # Full blob path: {category}/{item_id}/{field_name}.{ext}
        blob_path = f"{category}/{item_id}/{standardized_filename}"
        
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
                timeout=60.0,  # 60 second timeout for images
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

    async def download_file(self, blob_path: str) -> tuple[bytes, str, int]:
        """
        Download a file from Azure Blob Storage.
        
        Args:
            blob_path: Blob path stored in MongoDB
            
        Returns:
            Tuple of (file_content, content_type, content_length)
            
        Raises:
            AzureBlobServiceError: If file cannot be downloaded
        """
        if not blob_path or not self._sas_url:
            raise AzureBlobServiceError("Invalid blob path or SAS URL not configured")
        
        download_url = f"{self._base_url}/{blob_path}?{self._sas_token}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    download_url,
                    timeout=120.0,  # 2 minute timeout for large files
                )
                response.raise_for_status()
                
                content_type = response.headers.get("content-type", "application/octet-stream")
                content_length = int(response.headers.get("content-length", 0))
                
                return response.content, content_type, content_length
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise AzureBlobServiceError(f"File not found: {blob_path}")
            raise AzureBlobServiceError(f"Failed to download file: {e}")
        except Exception as e:
            raise AzureBlobServiceError(f"Failed to download file: {e}")

    async def stream_file(self, blob_path: str):
        """
        Stream a file from Azure Blob Storage as an async generator.
        
        Args:
            blob_path: Blob path stored in MongoDB
            
        Yields:
            Chunks of file content
            
        Raises:
            AzureBlobServiceError: If file cannot be streamed
        """
        if not blob_path or not self._sas_url:
            raise AzureBlobServiceError("Invalid blob path or SAS URL not configured")
        
        download_url = f"{self._base_url}/{blob_path}?{self._sas_token}"
        
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("GET", download_url, timeout=300.0) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes(chunk_size=65536):  # 64KB chunks
                        yield chunk
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise AzureBlobServiceError(f"File not found: {blob_path}")
            raise AzureBlobServiceError(f"Failed to stream file: {e}")
        except Exception as e:
            raise AzureBlobServiceError(f"Failed to stream file: {e}")

    async def get_file_info(self, blob_path: str) -> tuple[str, int]:
        """
        Get file metadata (content type and size) without downloading.
        
        Args:
            blob_path: Blob path stored in MongoDB
            
        Returns:
            Tuple of (content_type, content_length)
            
        Raises:
            AzureBlobServiceError: If file info cannot be retrieved
        """
        if not blob_path or not self._sas_url:
            raise AzureBlobServiceError("Invalid blob path or SAS URL not configured")
        
        head_url = f"{self._base_url}/{blob_path}?{self._sas_token}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.head(
                    head_url,
                    timeout=30.0,
                )
                response.raise_for_status()
                
                content_type = response.headers.get("content-type", "application/octet-stream")
                content_length = int(response.headers.get("content-length", 0))
                
                return content_type, content_length
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise AzureBlobServiceError(f"File not found: {blob_path}")
            raise AzureBlobServiceError(f"Failed to get file info: {e}")
        except Exception as e:
            raise AzureBlobServiceError(f"Failed to get file info: {e}")


# Singleton instance
_azure_blob_service: Optional[AzureBlobService] = None


def get_azure_blob_service() -> AzureBlobService:
    """Get or create Azure Blob Service instance."""
    global _azure_blob_service
    if _azure_blob_service is None:
        _azure_blob_service = AzureBlobService()
    return _azure_blob_service
