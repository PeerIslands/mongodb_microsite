"""
Email API endpoints

Provides endpoints for sending emails via Azure Communication Services

⚠️ WARNING: These endpoints are currently OPEN (no authentication required).
For production use, uncomment the authentication dependencies.
"""

from fastapi import APIRouter, HTTPException, status
from azure.core.exceptions import AzureError
import logging

from app.api.v1.models.email import (
    SendEmailRequest,
    SendSimpleEmailRequest,
    SendTemplateEmailRequest,
    EmailResponse
)
from app.api.v1.services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/send",
    response_model=EmailResponse,
    status_code=status.HTTP_200_OK,
    summary="Send an email (OPEN - No Auth)",
    description="Send an email with full customization options including CC, BCC, and attachments. ⚠️ No authentication required."
)
async def send_email(
    email_data: SendEmailRequest,
) -> EmailResponse:
    """
    Send an email with full customization options
    
    - **to_addresses**: List of recipient email addresses
    - **subject**: Email subject
    - **html_content**: HTML content (optional if plain_text_content provided)
    - **plain_text_content**: Plain text content (optional if html_content provided)
    - **cc_addresses**: CC recipients (optional)
    - **bcc_addresses**: BCC recipients (optional)
    - **reply_to_address**: Reply-to address (optional)
    - **attachments**: Email attachments (optional)
    
    ⚠️ WARNING: No authentication required. Open for testing.
    """
    try:
        result = await email_service.send_email(
            to_addresses=email_data.to_addresses,
            subject=email_data.subject,
            html_content=email_data.html_content,
            plain_text_content=email_data.plain_text_content,
            cc_addresses=email_data.cc_addresses,
            bcc_addresses=email_data.bcc_addresses,
            reply_to_address=email_data.reply_to_address,
            attachments=[att.dict() for att in email_data.attachments] if email_data.attachments else None
        )
        
        return EmailResponse(**result)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AzureError as e:
        logger.error(f"Azure error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the email"
        )


@router.post(
    "/send-simple",
    response_model=EmailResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a simple email (OPEN - No Auth)",
    description="Send a simple email to a single recipient. ⚠️ No authentication required."
)
async def send_simple_email(
    email_data: SendSimpleEmailRequest,
) -> EmailResponse:
    """
    Send a simple email to a single recipient
    
    - **to_address**: Recipient email address
    - **subject**: Email subject
    - **body**: Email body content
    - **is_html**: Whether the body is HTML (true) or plain text (false)
    
    ⚠️ WARNING: No authentication required. Open for testing.
    """
    try:
        result = await email_service.send_simple_email(
            to_address=email_data.to_address,
            subject=email_data.subject,
            body=email_data.body,
            is_html=email_data.is_html
        )
        
        return EmailResponse(**result)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AzureError as e:
        logger.error(f"Azure error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the email"
        )


@router.post(
    "/send-template",
    response_model=EmailResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a template-based email (OPEN - No Auth)",
    description="Send an email using a predefined template. ⚠️ No authentication required."
)
async def send_template_email(
    email_data: SendTemplateEmailRequest,
) -> EmailResponse:
    """
    Send an email using a predefined template
    
    - **to_address**: Recipient email address
    - **subject**: Email subject
    - **template_name**: Name of the template (welcome, password_reset, notification)
    - **template_data**: Data to populate the template
    
    Available templates:
    - **welcome**: Welcome email for new users (requires: name)
    - **password_reset**: Password reset email (requires: name, reset_code, expiry_minutes)
    - **notification**: General notification (requires: title, message)
    
    ⚠️ WARNING: No authentication required. Open for testing.
    """
    try:
        result = await email_service.send_template_email(
            to_address=email_data.to_address,
            subject=email_data.subject,
            template_name=email_data.template_name,
            template_data=email_data.template_data
        )
        
        return EmailResponse(**result)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AzureError as e:
        logger.error(f"Azure error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while sending the email"
        )
