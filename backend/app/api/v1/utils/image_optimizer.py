"""
Image Optimization Utility

Compress and optimize images before embedding them in email templates.
Helps prevent MongoDB BSON document size limit (16MB) issues.
"""

import io
import logging
from PIL import Image
from typing import Tuple

logger = logging.getLogger(__name__)

# Configuration
MAX_WIDTH = 1200  # Maximum width for images
MAX_HEIGHT = 1200  # Maximum height for images
JPEG_QUALITY = 85  # JPEG compression quality (1-100)
PNG_COMPRESSION = 6  # PNG compression level (0-9)
MAX_IMAGE_SIZE_MB = 2  # Maximum size per image in MB


def optimize_image(
    image_data: bytes,
    filename: str,
    max_width: int = MAX_WIDTH,
    max_height: int = MAX_HEIGHT,
    jpeg_quality: int = JPEG_QUALITY
) -> Tuple[bytes, str]:
    """
    Optimize an image by resizing and compressing it.
    
    Args:
        image_data: Original image bytes
        filename: Original filename
        max_width: Maximum width in pixels
        max_height: Maximum height in pixels
        jpeg_quality: JPEG compression quality (1-100)
    
    Returns:
        Tuple of (optimized_bytes, mime_type)
    """
    try:
        # Skip optimization for SVG files (they're already optimized as vectors)
        if filename.lower().endswith('.svg'):
            logger.info(f"Skipping optimization for SVG file: {filename}")
            return image_data, 'image/svg+xml'
        
        # Open image
        img = Image.open(io.BytesIO(image_data))
        original_format = img.format
        original_size = len(image_data)
        
        logger.info(f"Optimizing image: {filename} (original: {original_size / 1024:.2f} KB, format: {original_format})")
        
        # Convert RGBA to RGB if necessary (for JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        
        # Resize if image is too large
        if img.width > max_width or img.height > max_height:
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            logger.info(f"Resized image to: {img.width}x{img.height}")
        
        # Determine output format and MIME type based on original format
        # Preserve original format to avoid unnecessary conversions
        if original_format == 'PNG':
            output_format = 'PNG'
            mime_type = 'image/png'
        elif original_format in ('JPEG', 'JPG'):
            output_format = 'JPEG'
            mime_type = 'image/jpeg'
        elif original_format == 'GIF':
            output_format = 'GIF'
            mime_type = 'image/gif'
        elif original_format == 'WEBP':
            output_format = 'WEBP'
            mime_type = 'image/webp'
        else:
            # Default to JPEG for other formats
            output_format = 'JPEG'
            mime_type = 'image/jpeg'
        
        # Save optimized image
        output = io.BytesIO()
        if output_format == 'JPEG':
            img.save(output, format='JPEG', quality=jpeg_quality, optimize=True)
        elif output_format == 'PNG':
            img.save(output, format='PNG', compress_level=PNG_COMPRESSION, optimize=True)
        elif output_format == 'GIF':
            img.save(output, format='GIF', optimize=True)
        elif output_format == 'WEBP':
            img.save(output, format='WEBP', quality=jpeg_quality, optimize=True)
        
        optimized_data = output.getvalue()
        optimized_size = len(optimized_data)
        
        compression_ratio = (1 - optimized_size / original_size) * 100
        logger.info(
            f"Optimized {filename}: {original_size / 1024:.2f} KB → {optimized_size / 1024:.2f} KB "
            f"({compression_ratio:.1f}% reduction)"
        )
        
        # Check if still too large
        max_bytes = MAX_IMAGE_SIZE_MB * 1024 * 1024
        if optimized_size > max_bytes:
            logger.warning(
                f"Image {filename} still large after optimization ({optimized_size / 1024 / 1024:.2f} MB). "
                f"Applying aggressive compression..."
            )
            # Try more aggressive compression
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=70, optimize=True)
            optimized_data = output.getvalue()
            mime_type = 'image/jpeg'
            logger.info(f"After aggressive compression: {len(optimized_data) / 1024:.2f} KB")
        
        return optimized_data, mime_type
        
    except Exception as e:
        logger.error(f"Failed to optimize image {filename}: {e}")
        # Return original if optimization fails
        # Determine MIME type from filename
        mime_type = 'image/jpeg'
        if filename.lower().endswith('.png'):
            mime_type = 'image/png'
        elif filename.lower().endswith('.gif'):
            mime_type = 'image/gif'
        elif filename.lower().endswith('.webp'):
            mime_type = 'image/webp'
        
        return image_data, mime_type


def estimate_document_size(html_content: str) -> int:
    """
    Estimate the size of the MongoDB document in bytes.
    
    Args:
        html_content: HTML content with embedded images
    
    Returns:
        Estimated size in bytes
    """
    # Rough estimate: UTF-8 encoded string size
    return len(html_content.encode('utf-8'))


def check_document_size(html_content: str, max_size_mb: float = 15.0) -> bool:
    """
    Check if document size is within MongoDB limits.
    
    Args:
        html_content: HTML content to check
        max_size_mb: Maximum size in MB (default 15MB, leaving 1MB buffer)
    
    Returns:
        True if size is acceptable, False otherwise
    """
    size_bytes = estimate_document_size(html_content)
    size_mb = size_bytes / (1024 * 1024)
    max_bytes = max_size_mb * 1024 * 1024
    
    if size_bytes > max_bytes:
        logger.warning(
            f"Document size ({size_mb:.2f} MB) exceeds limit ({max_size_mb} MB)"
        )
        return False
    
    logger.info(f"Document size: {size_mb:.2f} MB (within {max_size_mb} MB limit)")
    return True
