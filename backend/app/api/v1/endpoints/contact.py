"""
Contact Form Endpoints
======================
Handles contact form submissions and email notifications.

Endpoints:
- POST /contact/inquiry - Submit a contact inquiry
"""

from fastapi import APIRouter, HTTPException, status

from app.api.v1.models.contact import (
    ContactInquiryRequest,
    ContactInquiryResponse,
)
from app.api.v1.services.email_service import EmailService


router = APIRouter()


@router.post(
    "/inquiry",
    response_model=ContactInquiryResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit a contact inquiry",
    description="Submit a contact form inquiry and send notification email.",
)
async def submit_inquiry(
    request: ContactInquiryRequest,
) -> ContactInquiryResponse:
    """
    Submit a contact inquiry.
    
    Processing Flow:
    1. Validate the inquiry data (handled by Pydantic)
    2. Send email notification to akshay.anoop@peerislands.io
    3. Return success response
    
    Args:
        request: ContactInquiryRequest containing inquiry details
        
    Returns:
        ContactInquiryResponse with success status
        
    Raises:
        HTTPException 500: If email sending fails
    """
    try:
        # Prepare email data
        inquiry_data = {
            'first_name': request.first_name,
            'last_name': request.last_name,
            'company': request.company,
            'job_function': request.job_function,
            'business_phone': request.business_phone,
            'country': request.country,
            'inquiry': request.inquiry,
        }
        
        # Send email
        email_sent = EmailService.send_contact_inquiry_email(inquiry_data)
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send inquiry email. Please try again later.",
            )
        
        return ContactInquiryResponse(
            success=True,
            message="Your inquiry has been submitted successfully. We'll get back to you soon!"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process inquiry: {str(e)}",
        )

