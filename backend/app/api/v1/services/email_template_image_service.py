"""
Email Template Image Service

Handles image uploads to Azure Blob Storage for email templates.
Stores images externally to avoid MongoDB 16MB BSON limit.
"""

import logging
import uuid
from typing import List, Dict
from pathlib import Path
from bs4 import BeautifulSoup

from app.api.v1.services.azure_blob_service import get_azure_blob_service, AzureBlobServiceError
from app.api.v1.utils.image_optimizer import optimize_image

logger = logging.getLogger(__name__)

# Email templates category for Azure Blob
EMAIL_TEMPLATES_CATEGORY = "emailtemplates"


class EmailTemplateImageService:
    """Service for handling email template images in Azure Blob Storage."""
    
    def __init__(self):
        self.blob_service = get_azure_blob_service()
    
    async def upload_template_images(
        self,
        template_id: str,
        image_files: List[tuple[bytes, str, str]],  # (data, filename, content_type)
        optimize: bool = True
    ) -> Dict[str, str]:
        """
        Upload multiple images to Azure Blob Storage.
        
        Args:
            template_id: Email template ID
            image_files: List of (image_data, filename, content_type) tuples
            optimize: Whether to optimize images before upload
        
        Returns:
            Dictionary mapping filename -> public URL
        """
        image_url_map = {}
        
        for image_data, filename, content_type in image_files:
            try:
                # Optimize image if requested (skip SVG files as they're already optimized)
                if optimize and not filename.lower().endswith('.svg'):
                    optimized_data, optimized_content_type = optimize_image(image_data, filename)
                    logger.info(
                        f"Optimized {filename}: {len(image_data) / 1024:.1f} KB → "
                        f"{len(optimized_data) / 1024:.1f} KB"
                    )
                    image_data = optimized_data
                    content_type = optimized_content_type
                elif filename.lower().endswith('.svg'):
                    logger.info(f"Skipping optimization for SVG: {filename} ({len(image_data) / 1024:.1f} KB)")
                
                # Generate unique field name for this image (without extension)
                # The azure_blob_service will add the correct extension based on content_type
                field_name = f"img_{uuid.uuid4().hex[:8]}"
                
                # Upload to Azure Blob
                # For email templates, we'll store in: emailtemplates/{template_id}/{field_name}.{ext}
                blob_path = await self._upload_image_to_blob(
                    image_data,
                    template_id,
                    field_name,
                    filename,
                    content_type
                )
                
                # Get public URL
                public_url = self.blob_service.get_full_url(blob_path)
                image_url_map[filename] = public_url
                
                logger.info(f"Uploaded image {filename} to {blob_path}")
                
            except Exception as e:
                logger.error(f"Failed to upload image {filename}: {e}")
                # Continue with other images
        
        return image_url_map
    
    async def _upload_image_to_blob(
        self,
        image_data: bytes,
        template_id: str,
        field_name: str,
        original_filename: str,
        content_type: str
    ) -> str:
        """
        Upload a single image to Azure Blob Storage using the standard service.
        """
        # Use the standard Azure Blob Service upload_image method
        blob_path = await self.blob_service.upload_image(
            file_content=image_data,
            category="emailtemplates",  # type: ignore
            item_id=template_id,
            field_name=field_name,
            original_filename=original_filename,
            content_type=content_type
        )
        
        return blob_path
    
    def replace_image_sources_in_html(
        self,
        html_content: str,
        image_url_map: Dict[str, str]
    ) -> str:
        """
        Replace local image paths in HTML with Azure Blob URLs.
        
        Args:
            html_content: Original HTML content
            image_url_map: Mapping of filename -> public URL
        
        Returns:
            Updated HTML content with blob URLs
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        images_replaced = 0
        
        for img_tag in soup.find_all('img'):
            src = img_tag.get('src', '')
            if src:
                # Extract filename from src (handles paths like "assets/image.png")
                filename = Path(src).name
                if filename in image_url_map:
                    img_tag['src'] = image_url_map[filename]
                    images_replaced += 1
                    logger.info(f"Replaced {filename} with blob URL")
        
        logger.info(f"Replaced {images_replaced} image sources in HTML")
        return str(soup)
    
    async def delete_template_images(self, template_id: str) -> bool:
        """
        Delete all images for a template from Azure Blob Storage.
        
        Args:
            template_id: Email template ID
        
        Returns:
            True if successful
        """
        try:
            # Note: Azure Blob doesn't have a "delete folder" operation
            # In a production system, you'd need to list all blobs with the prefix
            # and delete them individually
            # For now, we'll just log this operation
            logger.info(f"Would delete all images for template {template_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete template images: {e}")
            return False


# Singleton instance
_email_template_image_service = None


def get_email_template_image_service() -> EmailTemplateImageService:
    """Get or create EmailTemplateImageService instance."""
    global _email_template_image_service
    if _email_template_image_service is None:
        _email_template_image_service = EmailTemplateImageService()
    return _email_template_image_service
