"""
HTML File Processor Service

Processes HTML email templates:
- Extracts image references
- Uploads images to Azure Blob Storage
- Updates HTML with hosted image URLs
"""

import re
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from azure.storage.blob import BlobServiceClient
from app.core.config import settings
import logging
import mimetypes

logger = logging.getLogger(__name__)


class HTMLProcessorService:
    """Service to process HTML files and manage email assets"""
    
    def __init__(self):
        """Initialize Azure Blob Storage client"""
        if settings.AZURE_BLOB_SAS_URL:
            try:
                self.blob_service_client = BlobServiceClient(
                    account_url=settings.AZURE_BLOB_SAS_URL.split('?')[0],
                    credential=settings.AZURE_BLOB_SAS_URL.split('?')[1] if '?' in settings.AZURE_BLOB_SAS_URL else None
                )
                # Extract container name from SAS URL
                self.container_name = settings.AZURE_BLOB_SAS_URL.split('/')[-1].split('?')[0]
                logger.info(f"Azure Blob Storage initialized. Container: {self.container_name}")
            except Exception as e:
                logger.error(f"Failed to initialize Azure Blob Storage: {e}")
                self.blob_service_client = None
                self.container_name = None
        else:
            logger.warning("Azure Blob Storage not configured")
            self.blob_service_client = None
            self.container_name = None
    
    def extract_image_paths(self, html_content: str) -> List[str]:
        """
        Extract all image references from HTML.
        
        Finds:
        - <img src="path/to/image.jpg" />
        - <img src='path/to/image.png' />
        - background: url('image.gif')
        - background-image: url("image.svg")
        
        Returns:
            List of unique image paths (relative paths only)
        """
        all_images = []
        
        # Pattern 1: <img> tags
        img_pattern = r'<img[^>]+src=["\']([^"\']+)["\']'
        img_matches = re.findall(img_pattern, html_content, re.IGNORECASE)
        all_images.extend(img_matches)
        
        # Pattern 2: CSS url() in inline styles
        css_url_pattern = r'url\(["\']?([^"\'()]+)["\']?\)'
        css_matches = re.findall(css_url_pattern, html_content, re.IGNORECASE)
        all_images.extend(css_matches)
        
        # Pattern 3: srcset attributes
        srcset_pattern = r'srcset=["\']([^"\']+)["\']'
        srcset_matches = re.findall(srcset_pattern, html_content, re.IGNORECASE)
        for srcset in srcset_matches:
            # Parse srcset format: "image1.jpg 1x, image2.jpg 2x"
            urls = re.findall(r'([^\s,]+\.(?:jpg|jpeg|png|gif|svg|webp))', srcset, re.IGNORECASE)
            all_images.extend(urls)
        
        # Remove duplicates and filter for relative paths only
        unique_images = list(set(all_images))
        
        relative_images = [
            img for img in unique_images
            if not img.startswith('http://') 
            and not img.startswith('https://')
            and not img.startswith('data:')
            and not img.startswith('//')
            and re.search(r'\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$', img, re.IGNORECASE)
        ]
        
        logger.info(f"Found {len(relative_images)} relative image references in HTML")
        for img in relative_images:
            logger.debug(f"  - {img}")
        
        return relative_images
    
    async def upload_image_to_blob(
        self, 
        image_filename: str, 
        image_data: bytes,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload image to Azure Blob Storage.
        
        Args:
            image_filename: Name of the image file
            image_data: Binary image data
            content_type: MIME type (auto-detected if not provided)
        
        Returns:
            Public URL of uploaded image
        
        Raises:
            ValueError: If Azure Blob Storage not configured
            Exception: If upload fails
        """
        if not self.blob_service_client:
            raise ValueError("Azure Blob Storage not configured. Please set AZURE_BLOB_SAS_URL in .env")
        
        # Auto-detect content type if not provided
        if not content_type:
            content_type, _ = mimetypes.guess_type(image_filename)
            if not content_type:
                content_type = 'application/octet-stream'
        
        # Upload to newsletter-assets/ folder
        blob_name = f"newsletter-assets/{image_filename}"
        
        try:
            container_client = self.blob_service_client.get_container_client(self.container_name)
            blob_client = container_client.get_blob_client(blob_name)
            
            # Upload blob with content type
            from azure.storage.blob import ContentSettings
            
            blob_client.upload_blob(
                image_data, 
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type)
            )
            
            # Generate public URL (without SAS token for email compatibility)
            base_url = settings.AZURE_BLOB_SAS_URL.split('?')[0]
            public_url = f"{base_url}/{blob_name}"
            
            logger.info(f"✅ Uploaded: {image_filename} ({len(image_data)} bytes) -> {public_url}")
            return public_url
            
        except Exception as e:
            logger.error(f"❌ Failed to upload image {image_filename}: {e}")
            raise
    
    async def process_html_and_upload_images(
        self,
        html_content: str,
        image_files: Optional[Dict[str, bytes]] = None
    ) -> Tuple[str, List[Dict]]:
        """
        Process HTML and upload referenced images.
        
        Workflow:
        1. Extract all image references from HTML
        2. For each image, upload to Azure Blob Storage
        3. Replace image path in HTML with hosted URL
        4. Return updated HTML and image metadata
        
        Args:
            html_content: HTML string to process
            image_files: Optional dict mapping filename to file bytes
        
        Returns:
            Tuple of (updated_html, list of uploaded image metadata)
        """
        # Extract image references
        image_refs = self.extract_image_paths(html_content)
        
        if not image_refs:
            logger.info("No images found in HTML")
            return html_content, []
        
        updated_html = html_content
        uploaded_images = []
        
        # Process each image reference
        for image_ref in image_refs:
            # Get just the filename from path
            filename = Path(image_ref).name
            
            # Check if we have this image in provided files
            if image_files and filename in image_files:
                try:
                    # Upload to blob storage
                    public_url = await self.upload_image_to_blob(
                        filename, 
                        image_files[filename]
                    )
                    
                    # Replace ALL occurrences in HTML
                    updated_html = updated_html.replace(image_ref, public_url)
                    
                    uploaded_images.append({
                        "filename": filename,
                        "original_path": image_ref,
                        "url": public_url,
                        "size_bytes": len(image_files[filename])
                    })
                    
                    logger.info(f"✅ Replaced: {image_ref} -> {public_url}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to process image {filename}: {e}")
                    # Continue with other images
            else:
                logger.warning(f"⚠️  Image referenced but not provided: {filename} (from {image_ref})")
        
        logger.info(f"✅ Processed {len(uploaded_images)} images successfully")
        return updated_html, uploaded_images
    
    async def upload_images_from_folder(
        self, 
        folder_path: Path
    ) -> Dict[str, str]:
        """
        Upload all images from a folder to blob storage.
        
        Args:
            folder_path: Path to folder containing images
        
        Returns:
            Dict mapping filename to public URL
        """
        uploaded = {}
        
        image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'}
        
        for image_path in folder_path.glob('*'):
            if image_path.is_file() and image_path.suffix.lower() in image_extensions:
                try:
                    with open(image_path, 'rb') as f:
                        image_data = f.read()
                    
                    url = await self.upload_image_to_blob(
                        image_path.name,
                        image_data
                    )
                    uploaded[image_path.name] = url
                    
                except Exception as e:
                    logger.error(f"Failed to upload {image_path}: {e}")
        
        logger.info(f"Uploaded {len(uploaded)} images from folder")
        return uploaded
    
    def validate_html(self, html_content: str) -> Dict[str, Any]:
        """
        Validate HTML content.
        
        Returns:
            Dict with validation results
        """
        issues = []
        
        # Check for basic HTML structure
        if not re.search(r'<html', html_content, re.IGNORECASE):
            issues.append("Missing <html> tag")
        
        if not re.search(r'<head', html_content, re.IGNORECASE):
            issues.append("Missing <head> tag")
        
        if not re.search(r'<body', html_content, re.IGNORECASE):
            issues.append("Missing <body> tag")
        
        # Extract title if present
        title_match = re.search(r'<title>(.+?)</title>', html_content, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else None
        
        # Count images
        images = self.extract_image_paths(html_content)
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "title": title,
            "image_count": len(images),
            "size_bytes": len(html_content.encode('utf-8'))
        }


# Singleton instance
_html_processor_service = None

def get_html_processor_service() -> HTMLProcessorService:
    """Get or create HTML processor service instance"""
    global _html_processor_service
    if _html_processor_service is None:
        _html_processor_service = HTMLProcessorService()
    return _html_processor_service
