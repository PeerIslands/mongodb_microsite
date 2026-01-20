"""
Contact Form Endpoints
======================
Handles contact form submissions and email notifications.

Endpoints:
- POST /contact/inquiry - Submit a contact inquiry
"""

from fastapi import APIRouter, HTTPException, status, BackgroundTasks
import logging

from app.api.v1.models.contact import (
    ContactInquiryRequest,
    ContactInquiryResponse,
)
from app.api.v1.services.email_service import EmailService

logger = logging.getLogger(__name__)

router = APIRouter()


async def send_inquiry_email_background(inquiry_data: dict):
    """
    Background task to send contact inquiry email.
    This runs asynchronously after the response is sent to the user.
    """
    try:
        logger.info(f"Background task: Sending contact inquiry email for {inquiry_data['first_name']} {inquiry_data['last_name']}")
        await EmailService.send_contact_inquiry_email(inquiry_data)
        logger.info("Background task: Contact inquiry email sent successfully")
    except Exception as e:
        logger.error(f"Background task: Failed to send contact inquiry email: {e}")
        # Don't raise the exception since the response was already sent


@router.post(
    "/inquiry",
    response_model=ContactInquiryResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit a contact inquiry",
    description="Submit a contact form inquiry and send notification email in background.",
)
async def submit_inquiry(
    request: ContactInquiryRequest,
    background_tasks: BackgroundTasks,
) -> ContactInquiryResponse:
    """
    Submit a contact inquiry.
    
    Processing Flow:
    1. Validate the inquiry data (handled by Pydantic)
    2. Queue email notification for background processing
    3. Return immediate success response (email sent in background)
    
    Args:
        request: ContactInquiryRequest containing inquiry details
        background_tasks: FastAPI background tasks handler
        
    Returns:
        ContactInquiryResponse with success status
        
    Note:
        Email is sent asynchronously in the background to provide
        immediate response to the user without waiting for email delivery.
    """
    try:
        # Prepare email data
        inquiry_data = {
            'first_name': request.first_name,
            'last_name': request.last_name,
            'user_email': request.user_email,
            'company': request.company,
            'job_function': request.job_function,
            'business_phone': request.business_phone,
            'country': request.country,
            'inquiry': request.inquiry,
        }
        
        # Add email sending to background tasks
        # This allows us to return the response immediately
        background_tasks.add_task(send_inquiry_email_background, inquiry_data)
        
        logger.info(f"Contact inquiry submitted by {request.first_name} {request.last_name}. Email queued for background processing.")
        
        # Return immediate success response
        return ContactInquiryResponse(
            success=True,
            message="Your inquiry has been submitted successfully. We'll get back to you soon!"
        )
        
    except Exception as e:
        logger.error(f"Failed to process inquiry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process inquiry: {str(e)}",
        )

