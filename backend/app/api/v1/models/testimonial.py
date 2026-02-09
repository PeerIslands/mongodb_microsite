"""
Testimonial Pydantic models.
Includes request/response models for testimonial operations.

Field naming convention: snake_case (matching frontend requirements)
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateTestimonialRequest(BaseModel):
    """
    Request model for creating a new testimonial.
    Uses snake_case field names to match frontend requirements.
    """
    company_name: str = Field(..., min_length=1, description="Company name")
    testimonial_quote: str = Field(..., min_length=1, description="Testimonial quote")
    testimonial_author: str = Field(..., min_length=1, description="Author name")
    testimonial_position: str = Field(..., min_length=1, description="Author position/title")
    status: str = Field(default="draft", description="Status: 'published' or 'draft'")


class UpdateTestimonialRequest(BaseModel):
    """
    Request model for updating a testimonial.
    All fields are optional - only provided fields will be updated.
    """
    company_name: Optional[str] = Field(None, min_length=1, description="Company name")
    testimonial_quote: Optional[str] = Field(None, min_length=1, description="Testimonial quote")
    testimonial_author: Optional[str] = Field(None, min_length=1, description="Author name")
    testimonial_position: Optional[str] = Field(None, min_length=1, description="Author position/title")
    status: Optional[str] = Field(default="draft", description="Status: 'published' or 'draft' , default is draft")


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class TestimonialResponse(BaseModel):
    """Response model for testimonial data."""
    id: str = Field(..., description="Testimonial ID")
    company_name: str = Field(..., description="Company name")
    testimonial_quote: str = Field(..., description="Testimonial quote")
    testimonial_author: str = Field(..., description="Author name")
    testimonial_position: str = Field(..., description="Author position")
    status: str = Field(..., description="Status: 'published' or 'draft'")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")


class CreateTestimonialResponse(BaseModel):
    """Response model for successful testimonial creation."""
    id: str = Field(..., description="Created testimonial ID")
    message: str = Field(..., description="Success message")


class UpdateTestimonialResponse(BaseModel):
    """Response model for successful testimonial update."""
    id: str = Field(..., description="Updated testimonial ID")
    message: str = Field(..., description="Success message")


class DeleteTestimonialResponse(BaseModel):
    """Response model for successful testimonial deletion."""
    id: str = Field(..., description="Deleted testimonial ID")
    message: str = Field(..., description="Success message")
