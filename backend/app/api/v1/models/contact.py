"""
Contact inquiry models.
Handles contact form submissions and email notifications.
"""

from pydantic import BaseModel, EmailStr, Field


class ContactInquiryRequest(BaseModel):
    """
    Request model for contact form submission.
    
    Attributes:
        first_name: Contact's first name
        last_name: Contact's last name
        user_email: Contact's email address (optional, auto-filled for logged-in users)
        company: Company name
        job_function: Job role/function
        business_phone: Business phone number (with country code)
        country: Country name
        inquiry: The inquiry message (supports markdown)
    """
    first_name: str = Field(..., min_length=1, description="First name")
    last_name: str = Field(..., min_length=1, description="Last name")
    user_email: EmailStr = Field(..., description="Email address")
    company: str = Field(..., min_length=1, description="Company name")
    job_function: str = Field(..., min_length=1, description="Job function")
    business_phone: str = Field(..., min_length=1, description="Business phone number")
    country: str = Field(..., min_length=1, description="Country")
    inquiry: str = Field(..., min_length=10, description="Inquiry message")


class ContactInquiryResponse(BaseModel):
    """
    Response model for contact form submission.
    """
    success: bool = Field(default=True)
    message: str = Field(..., description="Success message")

