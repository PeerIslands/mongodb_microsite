"""
Email models for request and response validation
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class EmailRecipient(BaseModel):
    """Email recipient model"""
    address: EmailStr


class EmailAttachment(BaseModel):
    """Email attachment model"""
    name: str = Field(..., description="Attachment filename")
    content_type: str = Field(..., description="MIME type of the attachment")
    content_bytes: str = Field(..., description="Base64 encoded attachment content")


class SendEmailRequest(BaseModel):
    """Request model for sending emails"""
    to_addresses: List[EmailStr] = Field(..., min_items=1, description="List of recipient email addresses")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject")
    html_content: Optional[str] = Field(None, description="HTML content of the email")
    plain_text_content: Optional[str] = Field(None, description="Plain text content of the email")
    cc_addresses: Optional[List[EmailStr]] = Field(None, description="List of CC email addresses")
    bcc_addresses: Optional[List[EmailStr]] = Field(None, description="List of BCC email addresses")
    reply_to_address: Optional[EmailStr] = Field(None, description="Reply-to email address")
    attachments: Optional[List[EmailAttachment]] = Field(None, description="List of email attachments")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_addresses": ["recipient@example.com"],
                "subject": "Welcome to MongoDB Microsite",
                "html_content": "<h1>Welcome!</h1><p>Thank you for signing up.</p>",
                "plain_text_content": "Welcome! Thank you for signing up."
            }
        }


class SendSimpleEmailRequest(BaseModel):
    """Request model for sending simple emails"""
    to_address: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject")
    body: str = Field(..., min_length=1, description="Email body content")
    is_html: bool = Field(False, description="Whether the body is HTML or plain text")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_address": "recipient@example.com",
                "subject": "Test Email",
                "body": "This is a test email.",
                "is_html": False
            }
        }


class SendTemplateEmailRequest(BaseModel):
    """Request model for sending template-based emails"""
    to_address: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject")
    template_name: str = Field(..., description="Name of the email template (welcome, password_reset, notification)")
    template_data: Dict[str, Any] = Field(..., description="Data to populate the template")
    
    class Config:
        json_schema_extra = {
            "example": {
                "to_address": "recipient@example.com",
                "subject": "Welcome!",
                "template_name": "welcome",
                "template_data": {
                    "name": "John Doe"
                }
            }
        }


class EmailResponse(BaseModel):
    """Response model for email operations"""
    success: bool = Field(..., description="Whether the email was sent successfully")
    message_id: Optional[str] = Field(None, description="Unique identifier for the sent email")
    status: Optional[str] = Field(None, description="Email status")
    message: str = Field(..., description="Response message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message_id": "12345678-1234-1234-1234-123456789abc",
                "status": "Queued",
                "message": "Email sent successfully"
            }
        }


class EmailStatusResponse(BaseModel):
    """Response model for email status check"""
    message_id: str = Field(..., description="Unique identifier for the email")
    status: str = Field(..., description="Current status of the email")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message_id": "12345678-1234-1234-1234-123456789abc",
                "status": "Delivered"
            }
        }
