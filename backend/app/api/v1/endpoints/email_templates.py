"""
Email Template Management API Endpoints

Admin-only endpoints for managing email templates.
Requires admin authentication.
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
import logging
from datetime import datetime
import base64
import uuid
from pathlib import Path
from bs4 import BeautifulSoup
import re

from app.api.v1.models.email_template import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse,
    EmailTemplateListResponse,
    SendTestEmailRequest,
    SendTestEmailResponse,
    SendNewsletterRequest,
    SendNewsletterResponse,
    RecipientFilter,
    TemplateCategory,
    TemplateStatus,
    TemplateImage,
)
from app.api.v1.models.user import UserModel
from app.api.v1.dependencies.services import get_email_template_repository, get_current_user, get_user_repository
from app.api.v1.repositories.email_template_repository import EmailTemplateRepository
from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.services.email_service import email_service
from app.api.v1.utils.image_optimizer import optimize_image, check_document_size, estimate_document_size
from app.api.v1.services.email_template_image_service import get_email_template_image_service

logger = logging.getLogger(__name__)

router = APIRouter()


# =====================================================
# Public Newsletter Endpoint (No Auth Required)
# =====================================================

@router.get(
    "/newsletters",
    response_model=List[dict],
    summary="Get Active Newsletters",
    description="Get all active newsletters for public display (No auth required)"
)
async def get_public_newsletters(
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> List[dict]:
    """
    Get all active newsletters for public display on the Insights page.
    
    **No authentication required**
    
    - Filters by category="newsletter" and status="active"
    - Returns only essential fields for display
    - Sorted by creation date (newest first)
    """
    try:
        # Fetch active newsletters
        templates, _ = await repo.get_all_templates(
            skip=0,
            limit=100,
            category="newsletter",
            status="active"
        )
        
        # Return simplified data for frontend
        newsletters = []
        for template in templates:
            newsletters.append({
                "_id": str(template.get("_id", "")),
                "name": template.get("name", ""),
                "description": template.get("description", ""),
                "subject": template.get("subject", ""),
                "html_content": template.get("html_content", ""),
                "created_at": template.get("created_at"),
                "updated_at": template.get("updated_at"),
            })
        
        logger.info(f"📬 Fetched {len(newsletters)} active newsletters for public display")
        return newsletters
        
    except Exception as e:
        logger.error(f"Error fetching public newsletters: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve newsletters"
        )


def require_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """Dependency to require admin role"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


def extract_images_from_html(html_content: str) -> List[dict]:
    """Extract image information from HTML content"""
    soup = BeautifulSoup(html_content, 'html.parser')
    images = []
    
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if src:
            images.append({
                'filename': Path(src).name if not src.startswith(('http://', 'https://', 'data:')) else src,
                'original_path': src,
                'url': src,  # For now, keep original URL
                'alt_text': img.get('alt', ''),
            })
    
    return images


def embed_images_as_base64(html_content: str, base_path: Optional[Path] = None) -> str:
    """Convert local image references to base64 data URIs"""
    if not base_path:
        return html_content
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    for img in soup.find_all('img'):
        src = img.get('src', '')
        
        # Skip if already a data URI or external URL
        if src.startswith('data:') or src.startswith(('http://', 'https://')):
            continue
        
        # Try to find local image file
        image_path = base_path / src
        if image_path.exists():
            try:
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                
                # Determine MIME type
                mime_types = {
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml',
                    '.webp': 'image/webp',
                }
                mime_type = mime_types.get(image_path.suffix.lower(), 'image/png')
                
                # Encode to base64
                base64_data = base64.b64encode(image_data).decode('utf-8')
                data_uri = f"data:{mime_type};base64,{base64_data}"
                
                # Update src attribute
                img['src'] = data_uri
                logger.info(f"Embedded image: {image_path.name}")
            except Exception as e:
                logger.error(f"Failed to embed image {src}: {e}")
    
    return str(soup)


# =====================================================
# CRUD Endpoints
# =====================================================

@router.post(
    "/",
    response_model=EmailTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Email Template",
    description="Create a new email template (Admin only)"
)
async def create_template(
    template_data: EmailTemplateCreate,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> EmailTemplateResponse:
    """
    Create a new email template.
    
    **Admin only**
    
    - Auto-generates slug from name
    - Extracts image references from HTML
    - Validates template content
    """
    try:
        # Generate slug
        slug = slugify(template_data.name)
        
        # Check if slug already exists
        existing = await repo.get_template_by_slug(slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template with name '{template_data.name}' already exists"
            )
        
        # Extract images from HTML
        if not template_data.images:
            images = extract_images_from_html(template_data.html_content)
            template_data.images = [TemplateImage(**img) for img in images]
        
        # Create template dict
        template_dict = template_data.model_dump()
        template_dict['slug'] = slug
        template_dict['status'] = TemplateStatus.DRAFT
        template_dict['created_by'] = str(current_user.id)
        
        # Convert Pydantic models to dicts for MongoDB
        template_dict['variables'] = [v.model_dump() for v in template_data.variables]
        template_dict['images'] = [img.model_dump() for img in template_data.images]
        
        # Create in database
        template_id = await repo.create_template(template_dict)
        
        # Fetch and return created template
        created_template = await repo.get_template_by_id(template_id)
        
        logger.info(f"Template created: {template_id} by user {current_user.user_email}")
        
        return EmailTemplateResponse(**created_template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create template: {str(e)}"
        )


@router.get(
    "/",
    response_model=EmailTemplateListResponse,
    summary="List Email Templates",
    description="Get all email templates with optional filtering (Admin only)"
)
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    category: Optional[TemplateCategory] = None,
    status_filter: Optional[TemplateStatus] = None,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> EmailTemplateListResponse:
    """
    Get list of all email templates.
    
    **Admin only**
    
    - Supports pagination (skip/limit)
    - Filter by category and status
    - Sorted by creation date (newest first)
    """
    try:
        templates, total = await repo.get_all_templates(
            skip=skip,
            limit=limit,
            category=category.value if category else None,
            status=status_filter.value if status_filter else None
        )
        
        return EmailTemplateListResponse(
            templates=[EmailTemplateResponse(**t) for t in templates],
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve templates"
        )


@router.get(
    "/{template_id}",
    response_model=EmailTemplateResponse,
    summary="Get Email Template",
    description="Get a specific email template by ID (Admin only)"
)
async def get_template(
    template_id: str,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> EmailTemplateResponse:
    """
    Get a specific email template by ID.
    
    **Admin only**
    """
    template = await repo.get_template_by_id(template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )
    
    return EmailTemplateResponse(**template)


@router.put(
    "/{template_id}",
    response_model=EmailTemplateResponse,
    summary="Update Email Template",
    description="Update an existing email template (Admin only)"
)
async def update_template(
    template_id: str,
    update_data: EmailTemplateUpdate,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> EmailTemplateResponse:
    """
    Update an existing email template.
    
    **Admin only**
    
    - Updates only provided fields
    - Auto-increments version number
    - Updates timestamp
    """
    # Check if template exists
    existing = await repo.get_template_by_id(template_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )
    
    # Prepare update dict (exclude None values)
    update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
    
    # If name is updated, regenerate slug
    if 'name' in update_dict:
        new_slug = slugify(update_dict['name'])
        # Check if new slug conflicts with another template
        slug_check = await repo.get_template_by_slug(new_slug)
        if slug_check and slug_check['_id'] != template_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template name '{update_dict['name']}' is already in use"
            )
        update_dict['slug'] = new_slug
    
    # If HTML content is updated, re-extract images
    if 'html_content' in update_dict and 'images' not in update_dict:
        images = extract_images_from_html(update_dict['html_content'])
        update_dict['images'] = images
    
    # Convert Pydantic models to dicts
    if 'variables' in update_dict:
        update_dict['variables'] = [v.model_dump() for v in update_data.variables]
    if 'images' in update_dict:
        update_dict['images'] = [img.model_dump() for img in update_data.images]
    
    # Update in database
    success = await repo.update_template(template_id, update_dict)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template"
        )
    
    # Fetch and return updated template
    updated_template = await repo.get_template_by_id(template_id)
    logger.info(f"Template updated: {template_id} by user {current_user.user_email}")
    
    return EmailTemplateResponse(**updated_template)


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Email Template",
    description="Delete an email template (Admin only)"
)
async def delete_template(
    template_id: str,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
):
    """
    Delete an email template.
    
    **Admin only**
    
    - Permanently removes template from database
    - Cannot be undone
    """
    # Check if template exists
    existing = await repo.get_template_by_id(template_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )
    
    # Delete from database
    success = await repo.delete_template(template_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete template"
        )
    
    logger.info(f"Template deleted: {template_id} by user {current_user.user_email}")
    return None


# =====================================================
# File Upload Endpoint
# =====================================================

@router.post(
    "/upload-html",
    response_model=EmailTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload HTML Template",
    description="Upload an HTML file as a new email template with optional image files (Admin only)"
)
async def upload_html_template(
    name: str = Form(...),
    subject: str = Form(...),
    html_file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    category: TemplateCategory = Form(TemplateCategory.NEWSLETTER),
    image_files: List[UploadFile] = File(default=[]),
    use_blob_storage: bool = Form(True),  # Default to Azure Blob Storage
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> EmailTemplateResponse:
    """
    Upload an HTML file as a new email template.
    
    **Admin only**
    
    - Accepts .html files
    - Accepts multiple image files (optional)
    - **use_blob_storage=True** (default): Uploads images to Azure Blob Storage (recommended for large newsletters)
    - **use_blob_storage=False**: Embeds images as base64 (for small templates only, <15MB total)
    - Automatically optimizes images before storage
    - Generates plain text version
    - Extracts image references
    
    **Note**: MongoDB has a 16MB document size limit. For newsletters with many/large images,
    use Azure Blob Storage (use_blob_storage=True) to avoid this limit.
    """
    try:
        # Validate file type
        if not html_file.filename.endswith('.html'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only .html files are allowed"
            )
        
        # Read HTML content
        html_content = await html_file.read()
        html_content = html_content.decode('utf-8')
        
        # Generate a temporary template ID for image storage
        temp_template_id = str(uuid.uuid4())
        
        # Process uploaded images
        image_map = {}
        total_images_size = 0
        
        if image_files:
            if use_blob_storage:
                # Use Azure Blob Storage for images (recommended for large newsletters)
                logger.info(f"Using Azure Blob Storage for {len(image_files)} images")
                
                # Prepare image data for upload
                image_data_list = []
                for img_file in image_files:
                    if img_file.filename:
                        try:
                            image_data = await img_file.read()
                            mime_types = {
                                '.png': 'image/png',
                                '.jpg': 'image/jpeg',
                                '.jpeg': 'image/jpeg',
                                '.gif': 'image/gif',
                                '.svg': 'image/svg+xml',
                                '.webp': 'image/webp',
                            }
                            file_ext = Path(img_file.filename).suffix.lower()
                            content_type = mime_types.get(file_ext, 'image/jpeg')
                            
                            image_data_list.append((image_data, img_file.filename, content_type))
                            total_images_size += len(image_data)
                        except Exception as e:
                            logger.error(f"Failed to read image {img_file.filename}: {e}")
                
                # Upload images to Azure Blob Storage
                image_service = get_email_template_image_service()
                image_map = await image_service.upload_template_images(
                    temp_template_id,
                    image_data_list,
                    optimize=False  # Bypass optimization - upload original images only
                )
                
                logger.info(
                    f"Uploaded {len(image_map)} images to Azure Blob Storage "
                    f"(total size: {total_images_size / 1024 / 1024:.2f} MB)"
                )
                
            else:
                # Use base64 embedding (for small templates only)
                logger.info(f"Using base64 embedding for {len(image_files)} images")
                
                for img_file in image_files:
                    if img_file.filename:
                        try:
                            # Read image data
                            image_data = await img_file.read()
                            original_size = len(image_data)
                            
                            # Skip SVG files (don't optimize them)
                            if img_file.filename.lower().endswith('.svg'):
                                mime_type = 'image/svg+xml'
                                base64_data = base64.b64encode(image_data).decode('utf-8')
                                data_uri = f"data:{mime_type};base64,{base64_data}"
                                image_map[img_file.filename] = data_uri
                                total_images_size += original_size
                                logger.info(f"Embedded SVG (no optimization): {img_file.filename}")
                                continue
                            
                            # Optimize image
                            optimized_data, mime_type = optimize_image(image_data, img_file.filename)
                            optimized_size = len(optimized_data)
                            
                            # Check individual image size
                            if optimized_size > 2 * 1024 * 1024:
                                logger.warning(
                                    f"Large image after optimization: {img_file.filename} "
                                    f"({optimized_size / 1024 / 1024:.2f} MB)"
                                )
                            
                            # Encode to base64
                            base64_data = base64.b64encode(optimized_data).decode('utf-8')
                            data_uri = f"data:{mime_type};base64,{base64_data}"
                            
                            # Store with filename as key
                            image_map[img_file.filename] = data_uri
                            total_images_size += optimized_size
                            
                            compression_ratio = (1 - optimized_size / original_size) * 100
                            logger.info(
                                f"Embedded image: {img_file.filename} "
                                f"({original_size / 1024:.1f} KB → {optimized_size / 1024:.1f} KB, "
                                f"{compression_ratio:.1f}% reduction)"
                            )
                        except Exception as e:
                            logger.error(f"Failed to process image {img_file.filename}: {e}")
                
                logger.info(f"Total embedded images size: {total_images_size / 1024 / 1024:.2f} MB")
        
        # Replace image sources in HTML
        if image_map:
            if use_blob_storage:
                # Replace with Azure Blob URLs
                image_service = get_email_template_image_service()
                html_content = image_service.replace_image_sources_in_html(html_content, image_map)
                logger.info("Replaced image sources with Azure Blob URLs")
            else:
                # Embed as base64
                soup = BeautifulSoup(html_content, 'html.parser')
                for img_tag in soup.find_all('img'):
                    src = img_tag.get('src', '')
                    if src:
                        # Extract filename from src (handles paths like "assets/image.png")
                        filename = Path(src).name
                        if filename in image_map:
                            img_tag['src'] = image_map[filename]
                            logger.info(f"Embedded base64 image in HTML: {filename}")
                html_content = str(soup)
        
        # Check document size before proceeding (only for base64 embedding)
        if not use_blob_storage:
            doc_size = estimate_document_size(html_content)
            doc_size_mb = doc_size / (1024 * 1024)
            logger.info(f"Final document size with base64 images: {doc_size_mb:.2f} MB")
            
            # MongoDB BSON limit is 16MB, we'll enforce 15MB to be safe
            if not check_document_size(html_content, max_size_mb=15.0):
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=(
                        f"Template size ({doc_size_mb:.2f} MB) exceeds MongoDB limit (15 MB). "
                        f"Please use Azure Blob Storage (use_blob_storage=true) for large newsletters, "
                        f"or reduce the number/size of images."
                    )
                )
        else:
            # With blob storage, HTML only contains URLs, so size is minimal
            doc_size_mb = len(html_content) / (1024 * 1024)
            logger.info(f"Final document size with blob URLs: {doc_size_mb:.2f} MB")
        
        # Generate plain text version
        soup = BeautifulSoup(html_content, 'html.parser')
        plain_text = soup.get_text(separator='\n', strip=True)
        
        # Extract images
        images = extract_images_from_html(html_content)
        
        # Create template
        template_create = EmailTemplateCreate(
            name=name,
            description=description,
            category=category,
            subject=subject,
            html_content=html_content,
            plain_text_content=plain_text,
            variables=[],
            images=[TemplateImage(**img) for img in images]
        )
        
        # Generate slug
        slug = slugify(name)
        
        # Check if slug already exists
        existing = await repo.get_template_by_slug(slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template with name '{name}' already exists"
            )
        
        # Create template dict
        template_dict = template_create.model_dump()
        template_dict['slug'] = slug
        template_dict['status'] = TemplateStatus.DRAFT
        template_dict['created_by'] = str(current_user.id)
        template_dict['variables'] = []
        template_dict['images'] = images
        
        # Create in database
        template_id = await repo.create_template(template_dict)
        
        # Fetch and return created template
        created_template = await repo.get_template_by_id(template_id)
        
        logger.info(f"HTML template uploaded: {template_id} by user {current_user.user_email}")
        
        return EmailTemplateResponse(**created_template)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading HTML template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload template: {str(e)}"
        )


# =====================================================
# Send Test Email Endpoint
# =====================================================

@router.post(
    "/{template_id}/send-test",
    response_model=SendTestEmailResponse,
    summary="Send Test Email",
    description="Send a test email using a specific template (Admin only)"
)
async def send_test_email(
    template_id: str,
    test_request: SendTestEmailRequest,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> SendTestEmailResponse:
    """
    Send a test email using a specific template.
    
    **Admin only**
    
    - Sends to specified test email address
    - Uses actual template content (with base64-embedded images)
    - Increments test_send_count
    - Returns message ID for tracking
    """
    try:
        # Get template
        template = await repo.get_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template not found: {template_id}"
            )
        
        # Prepare email content
        html_content = template['html_content']
        plain_text = template.get('plain_text_content', '')
        
        # TODO: Replace template variables with test_data if needed
        # For now, send as-is
        
        # Send email via email service
        result = await email_service.send_email(
            to_addresses=[test_request.to_email],
            subject=f"[TEST] {template['subject']}",
            html_content=html_content,
            plain_text_content=plain_text
        )
        
        # Increment test send count
        await repo.increment_test_send_count(template_id)
        
        logger.info(f"Test email sent for template {template_id} to {test_request.to_email}")
        
        return SendTestEmailResponse(
            success=True,
            message_id=result.get('message_id'),
            message=f"Test email sent successfully to {test_request.to_email}",
            status=result.get('status', 'sent')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test email: {str(e)}"
        )


# =====================================================
# Additional Utility Endpoints
# =====================================================

@router.post(
    "/{template_id}/duplicate",
    response_model=EmailTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate Template",
    description="Create a copy of an existing template (Admin only)"
)
async def duplicate_template(
    template_id: str,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> EmailTemplateResponse:
    """
    Duplicate an existing template.
    
    **Admin only**
    
    - Creates a copy with " (Copy)" appended to name
    - Resets send counts
    - Sets status to DRAFT
    """
    # Get original template
    original = await repo.get_template_by_id(template_id)
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )
    
    # Create copy
    copy_data = original.copy()
    copy_data.pop('_id')
    copy_data['name'] = f"{original['name']} (Copy)"
    copy_data['slug'] = slugify(copy_data['name'])
    copy_data['status'] = TemplateStatus.DRAFT
    copy_data['created_by'] = str(current_user.id)
    copy_data['send_count'] = 0
    copy_data['test_send_count'] = 0
    copy_data['last_sent_at'] = None
    
    # Check for slug conflicts and add number if needed
    counter = 1
    base_slug = copy_data['slug']
    while await repo.get_template_by_slug(copy_data['slug']):
        counter += 1
        copy_data['slug'] = f"{base_slug}-{counter}"
        copy_data['name'] = f"{original['name']} (Copy {counter})"
    
    # Create in database
    new_id = await repo.create_template(copy_data)
    
    # Fetch and return
    new_template = await repo.get_template_by_id(new_id)
    logger.info(f"Template duplicated: {template_id} -> {new_id} by user {current_user.user_email}")
    
    return EmailTemplateResponse(**new_template)


@router.patch(
    "/{template_id}/status",
    response_model=EmailTemplateResponse,
    summary="Update Template Status",
    description="Update template status (draft/active/archived) (Admin only)"
)
async def update_template_status(
    template_id: str,
    new_status: TemplateStatus,
    current_user: UserModel = Depends(require_admin),
    repo: EmailTemplateRepository = Depends(get_email_template_repository)
) -> EmailTemplateResponse:
    """
    Update template status.
    
    **Admin only**
    
    - Change between draft, active, or archived
    - Active templates can be used for sending
    """
    # Check if template exists
    existing = await repo.get_template_by_id(template_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )
    
    # Update status
    success = await repo.update_template(template_id, {'status': new_status.value})
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update template status"
        )
    
    # Fetch and return updated template
    updated_template = await repo.get_template_by_id(template_id)
    logger.info(f"Template status updated: {template_id} -> {new_status} by user {current_user.user_email}")
    
    return EmailTemplateResponse(**updated_template)


# =====================================================
# Bulk Newsletter Sending Endpoint
# =====================================================

@router.post(
    "/{template_id}/send-newsletter",
    response_model=SendNewsletterResponse,
    summary="Send Newsletter to Multiple Recipients",
    description="Send newsletter to multiple recipients based on filter criteria (Admin only)"
)
async def send_newsletter(
    template_id: str,
    newsletter_request: SendNewsletterRequest,
    current_user: UserModel = Depends(require_admin),
    template_repo: EmailTemplateRepository = Depends(get_email_template_repository),
    user_repo: UserRepository = Depends(get_user_repository)
) -> SendNewsletterResponse:
    """
    Send newsletter to multiple recipients.
    
    **Admin only**
    
    - Send to all users, active users, internal/external users, or custom list
    - Test mode allows sending to specific emails for testing
    - Increments send_count for tracking
    - Returns detailed sending statistics
    
    **Recipient Filters:**
    - `all_users`: Send to all registered users
    - `active_users`: Send to users with active accounts
    - `internal_users`: Send to internal users only
    - `external_users`: Send to external users only
    - `custom_list`: Send to specific email addresses (requires custom_emails)
    
    **Test Mode:**
    - Set `test_mode: true` to send only to `custom_emails` for testing
    - Does not increment send_count in test mode
    """
    try:
        # Get template
        template = await template_repo.get_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template not found: {template_id}"
            )
        
        # Check if template is active (unless in test mode)
        if not newsletter_request.test_mode and template['status'] != TemplateStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template must be 'active' to send. Current status: {template['status']}"
            )
        
        # Get recipient list based on filter
        recipient_emails = []
        
        if newsletter_request.test_mode:
            # Test mode: only send to custom emails
            if not newsletter_request.custom_emails:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="custom_emails required when test_mode is true"
                )
            recipient_emails = newsletter_request.custom_emails
            logger.info(f"Test mode: Sending to {len(recipient_emails)} custom emails")
            
        elif newsletter_request.recipient_filter == RecipientFilter.CUSTOM_LIST:
            # Custom list mode
            if not newsletter_request.custom_emails:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="custom_emails required when recipient_filter is CUSTOM_LIST"
                )
            recipient_emails = newsletter_request.custom_emails
            logger.info(f"Custom list mode: Sending to {len(recipient_emails)} emails")
            
        else:
            # Fetch users from database based on filter
            all_users = await user_repo.get_all_users(skip=0, limit=10000)  # Fetch up to 10k users
            
            if newsletter_request.recipient_filter == RecipientFilter.ALL_USERS:
                recipient_emails = [user['user_email'] for user in all_users]
                
            elif newsletter_request.recipient_filter == RecipientFilter.ACTIVE_USERS:
                recipient_emails = [
                    user['user_email'] for user in all_users 
                    if user.get('account_active', False) and user.get('can_login', False)
                ]
                
            elif newsletter_request.recipient_filter == RecipientFilter.INTERNAL_USERS:
                recipient_emails = [
                    user['user_email'] for user in all_users 
                    if user.get('is_internal', False)
                ]
                
            elif newsletter_request.recipient_filter == RecipientFilter.EXTERNAL_USERS:
                recipient_emails = [
                    user['user_email'] for user in all_users 
                    if not user.get('is_internal', False)
                ]
            
            logger.info(
                f"Filter '{newsletter_request.recipient_filter}': "
                f"Found {len(recipient_emails)} recipients out of {len(all_users)} total users"
            )
        
        if not recipient_emails:
            return SendNewsletterResponse(
                success=True,
                total_recipients=0,
                emails_sent=0,
                emails_failed=0,
                message="No recipients found matching the filter criteria"
            )
        
        # Prepare email content
        html_content = template['html_content']
        plain_text = template.get('plain_text_content', '')
        subject = template['subject']
        
        # Add [TEST] prefix if in test mode
        if newsletter_request.test_mode:
            subject = f"[TEST] {subject}"
        
        # TODO: Replace template variables with variable_data if provided
        # For now, send as-is
        
        # Send emails in batches
        batch_size = 50  # Send 50 emails at a time
        emails_sent = 0
        emails_failed = 0
        failed_emails = []
        
        for i in range(0, len(recipient_emails), batch_size):
            batch = recipient_emails[i:i + batch_size]
            
            for email in batch:
                try:
                    # Send email to individual recipient
                    await email_service.send_email(
                        to_addresses=[email],
                        subject=subject,
                        html_content=html_content,
                        plain_text_content=plain_text
                    )
                    emails_sent += 1
                    logger.info(f"Newsletter sent to: {email}")
                    
                except Exception as e:
                    emails_failed += 1
                    failed_emails.append(email)
                    logger.error(f"Failed to send newsletter to {email}: {e}")
            
            # Small delay between batches to avoid rate limiting
            if i + batch_size < len(recipient_emails):
                import asyncio
                await asyncio.sleep(0.5)
        
        # Increment send count (only if not in test mode)
        if not newsletter_request.test_mode:
            await template_repo.increment_send_count(template_id)
            logger.info(f"Incremented send_count for template {template_id}")
        
        # Prepare response
        success_rate = (emails_sent / len(recipient_emails) * 100) if recipient_emails else 0
        message = (
            f"Newsletter sent successfully! "
            f"{emails_sent}/{len(recipient_emails)} emails delivered ({success_rate:.1f}% success rate)"
        )
        
        if newsletter_request.test_mode:
            message = f"[TEST MODE] {message}"
        
        if emails_failed > 0:
            message += f". {emails_failed} emails failed."
        
        logger.info(
            f"Newsletter campaign completed for template {template_id}: "
            f"{emails_sent} sent, {emails_failed} failed"
        )
        
        return SendNewsletterResponse(
            success=True,
            total_recipients=len(recipient_emails),
            emails_sent=emails_sent,
            emails_failed=emails_failed,
            failed_emails=failed_emails if failed_emails else None,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending newsletter: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send newsletter: {str(e)}"
        )
