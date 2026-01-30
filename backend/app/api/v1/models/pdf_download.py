"""
PDF Download Models - Pydantic models for PDF download lead capture.

Models:
- PDFDownloadRequest: Request model for capturing lead data on PDF download
- PDFDownloadResponse: Response model after successful lead capture
"""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, EmailStr, field_validator


class PDFDownloadRequest(BaseModel):
    """Request model for capturing lead data when downloading a PDF."""
    
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    email: EmailStr = Field(..., description="Business email address")
    company: str = Field(..., min_length=1, max_length=200, description="Company name")
    job_function: str = Field(..., min_length=1, max_length=100, description="Job function/role")
    country: str = Field(..., min_length=1, max_length=100, description="Country")
    business_phone: str = Field(..., min_length=1, max_length=50, description="Business phone number")
    
    # Resource information
    resource_type: Literal["accelerator", "case_study"] = Field(
        ..., 
        description="Type of resource being downloaded"
    )
    resource_id: str = Field(..., min_length=1, description="ID of the resource")
    resource_title: str = Field(..., min_length=1, max_length=500, description="Title of the resource")

    @field_validator('first_name', 'last_name', 'company', 'job_function', 'country')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip whitespace from string fields."""
        return v.strip()

    @field_validator('business_phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Basic phone validation - strip whitespace."""
        return v.strip()


class PDFDownloadResponse(BaseModel):
    """Response model after successful lead capture."""
    
    id: str = Field(..., description="Unique ID of the download record")
    message: str = Field(default="Download recorded successfully", description="Success message")


class PDFDownloadRecord(BaseModel):
    """Internal model representing a PDF download record in the database."""
    
    id: str = Field(..., description="Unique ID")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    email: str = Field(..., description="Email address")
    company: str = Field(..., description="Company name")
    job_function: str = Field(..., description="Job function/role")
    country: str = Field(..., description="Country")
    business_phone: str = Field(..., description="Business phone")
    resource_type: str = Field(..., description="Type of resource")
    resource_id: str = Field(..., description="Resource ID")
    resource_title: str = Field(..., description="Resource title")
    created_at: datetime = Field(..., description="Record creation timestamp")
