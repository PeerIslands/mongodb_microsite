"""
Email Template Models

Pydantic models for email template management.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TemplateCategory(str, Enum):
    """Template category types"""
    NEWSLETTER = "newsletter"
    TRANSACTIONAL = "transactional"
    PROMOTIONAL = "promotional"
    NOTIFICATION = "notification"


class TemplateStatus(str, Enum):
    """Template status"""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class TemplateVariable(BaseModel):
    """Template variable definition"""
    name: str = Field(..., description="Variable name (e.g., 'recipient_name')")
    type: str = Field(..., description="Variable type: string, number, boolean, array, object")
    required: bool = Field(default=False, description="Whether this variable is required")
    default_value: Optional[Any] = Field(None, description="Default value if not provided")
    description: Optional[str] = Field(None, description="Description of this variable")


class TemplateImage(BaseModel):
    """Template image metadata"""
    filename: str = Field(..., description="Image filename")
    original_path: Optional[str] = Field(None, description="Original path in HTML")
    url: str = Field(..., description="Public URL of hosted image")
    alt_text: Optional[str] = Field(None, description="Alt text for image")
    size_bytes: Optional[int] = Field(None, description="File size in bytes")


class EmailTemplateCreate(BaseModel):
    """Create new email template"""
    name: str = Field(..., min_length=1, max_length=200, description="Template name")
    description: Optional[str] = Field(None, max_length=1000, description="Template description")
    category: TemplateCategory = Field(..., description="Template category")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject line")
    html_content: str = Field(..., min_length=1, description="HTML email content")
    plain_text_content: Optional[str] = Field(None, description="Plain text fallback")
    variables: List[TemplateVariable] = Field(default_factory=list, description="Template variables")
    images: List[TemplateImage] = Field(default_factory=list, description="Embedded images")
    sendgrid_template_id: Optional[str] = Field(None, description="SendGrid template ID")


class EmailTemplateUpdate(BaseModel):
    """Update existing email template"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[TemplateCategory] = None
    status: Optional[TemplateStatus] = None
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    html_content: Optional[str] = Field(None, min_length=1)
    plain_text_content: Optional[str] = None
    variables: Optional[List[TemplateVariable]] = None
    images: Optional[List[TemplateImage]] = None
    sendgrid_template_id: Optional[str] = None


class EmailTemplateResponse(BaseModel):
    """Email template response"""
    id: str = Field(..., alias="_id", description="Template ID")
    name: str
    slug: str
    description: Optional[str] = None
    category: TemplateCategory
    status: TemplateStatus
    subject: str
    html_content: Optional[str] = None  # Optional for list views
    plain_text_content: Optional[str] = None
    sendgrid_template_id: Optional[str] = None
    sendgrid_version_id: Optional[str] = None
    variables: List[TemplateVariable] = Field(default_factory=list)
    images: List[TemplateImage] = Field(default_factory=list)
    created_by: str
    created_at: datetime
    updated_at: datetime
    version: int = 1
    send_count: int = 0
    test_send_count: int = 0
    last_sent_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class EmailTemplateListResponse(BaseModel):
    """List of email templates"""
    templates: List[EmailTemplateResponse]
    total: int
    skip: int
    limit: int


class SendTestEmailRequest(BaseModel):
    """Request to send test email"""
    to_email: str = Field(..., description="Test recipient email address")
    test_data: Optional[Dict[str, Any]] = Field(None, description="Test data for template variables")


class SendTestEmailResponse(BaseModel):
    """Response after sending test email"""
    success: bool
    message_id: Optional[str] = None
    message: str
    status: str


class UploadHTMLRequest(BaseModel):
    """Metadata for HTML file upload (multipart form data)"""
    name: str = Field(..., description="Template name")
    description: Optional[str] = None
    category: TemplateCategory = Field(default=TemplateCategory.NEWSLETTER)
    subject: str = Field(..., description="Email subject")
    # File will be uploaded separately via multipart/form-data


class DuplicateTemplateResponse(BaseModel):
    """Response after duplicating template"""
    original_id: str
    new_template: EmailTemplateResponse
    message: str


class RecipientFilter(str, Enum):
    """Recipient filter options for bulk sending"""
    ALL_USERS = "all_users"
    ACTIVE_USERS = "active_users"
    INTERNAL_USERS = "internal_users"
    EXTERNAL_USERS = "external_users"
    CUSTOM_LIST = "custom_list"


class SendNewsletterRequest(BaseModel):
    """Request to send newsletter to multiple recipients"""
    recipient_filter: RecipientFilter = Field(..., description="Filter for recipient selection")
    custom_emails: Optional[List[str]] = Field(None, description="Custom email list (required if filter is CUSTOM_LIST)")
    test_mode: bool = Field(default=False, description="If true, send only to custom_emails for testing")
    variable_data: Optional[Dict[str, Any]] = Field(None, description="Data for template variables")


class SendNewsletterResponse(BaseModel):
    """Response after sending newsletter"""
    success: bool
    total_recipients: int
    emails_sent: int
    emails_failed: int
    failed_emails: Optional[List[str]] = None
    message: str
    send_job_id: Optional[str] = None
