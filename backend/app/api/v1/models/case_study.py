"""
Case Study Pydantic models.
Includes request/response models for case study operations.

Field naming convention: snake_case (matching frontend requirements)
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# NESTED MODELS
# =============================================================================

class MetricItem(BaseModel):
    """Single metric with label and value."""
    label: str = Field(..., min_length=1, description="Metric label (e.g., 'Time Reduction')")
    value: str = Field(..., min_length=1, description="Metric value (e.g., '50%')")


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateCaseStudyRequest(BaseModel):
    """
    Request model for creating a new case study.
    Uses snake_case field names to match frontend requirements.
    """
    # Basic Info
    title: str = Field(..., min_length=1, description="Case study title")
    slug: str = Field(..., min_length=1, description="URL-friendly slug derived from title")
    featured: bool = Field(default=False, description="Whether case study is featured")
    status: str = Field(default="draft", description="Status: 'published' or 'draft'")
    industry: str = Field(..., min_length=1, description="Industry sector")
    tech_stack: List[str] = Field(default=[], description="Array of technologies used")
    migration_type: Optional[str] = Field(None, description="Type of migration (nullable)")
    
    # Company Info
    company_name: str = Field(..., min_length=1, description="Client company name")
    
    # Content
    description: str = Field(default="", description="Full description")
    
    # Problem Statement
    challenges: str = Field(..., min_length=1, description="Challenges faced (as string)")
    
    # Solution & Architecture
    approach: str = Field(..., min_length=1, description="Solution approach")
    
    # Value Delivered
    metrics: List[MetricItem] = Field(default=[], description="Performance metrics (max 5 items)")
    business_outcomes: str = Field(..., min_length=1, description="Business outcomes (as string)")
    testimonial_quote: Optional[str] = Field(None, description="Client testimonial quote (nullable)")
    testimonial_author: Optional[str] = Field(None, description="Testimonial author name (nullable)")
    testimonial_position: Optional[str] = Field(None, description="Testimonial author position (nullable)")
    
    # Media & Files
    pdf_url: str = Field(default="", description="PDF file path/URL")

    @field_validator('metrics')
    @classmethod
    def validate_metrics_max_5(cls, v: List[MetricItem]) -> List[MetricItem]:
        """Validate that metrics array has maximum 5 items."""
        if len(v) > 5:
            raise ValueError('Metrics array cannot have more than 5 items')
        return v


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class CaseStudyResponse(BaseModel):
    """
    Response model for case study list items.
    """
    id: str = Field(..., description="Unique case study ID")
    title: str = Field(..., description="Case study title")
    featured: bool = Field(default=False, description="Whether case study is featured")
    status: str = Field(default="draft", description="Status: 'published' or 'draft'")
    industry: str = Field(..., description="Industry sector")
    tech_stack: List[str] = Field(default=[], description="Technologies used")
    migration_type: Optional[str] = Field(None, description="Type of migration")
    company_name: str = Field(..., description="Client company name")
    description: str = Field(default="", description="Brief description")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")


class CaseStudyDetailResponse(CaseStudyResponse):
    """
    Response model for full case study detail.
    """
    # Problem Statement
    challenges: str = Field(..., description="Challenges")
    
    # Solution & Architecture
    approach: str = Field(..., description="Solution approach")
    
    # Value Delivered
    metrics: List[MetricItem] = Field(default=[], description="Performance metrics (max 5 items)")
    business_outcomes: str = Field(..., description="Business outcomes")
    testimonial_quote: Optional[str] = Field(None)
    testimonial_author: Optional[str] = Field(None)
    testimonial_position: Optional[str] = Field(None)
    
    # Media & Files
    pdf_url: str = Field(default="", description="PDF URL")


class CreateCaseStudyResponse(BaseModel):
    """Response model for successful case study creation."""
    id: str = Field(..., description="Created case study ID")
    message: str = Field(..., description="Success message")


class UpdateCaseStudyRequest(BaseModel):
    """
    Request model for updating a case study.
    All fields are optional - only provided fields will be updated.
    """
    # Basic Info
    title: Optional[str] = Field(None, min_length=1, description="Case study title")
    slug: Optional[str] = Field(None, min_length=1, description="URL-friendly slug derived from title")
    featured: Optional[bool] = Field(None, description="Whether case study is featured")
    status: Optional[str] = Field(None, description="Status: 'published' or 'draft'")
    industry: Optional[str] = Field(None, min_length=1, description="Industry sector")
    tech_stack: Optional[List[str]] = Field(None, description="Technologies used")
    migration_type: Optional[str] = Field(None, description="Type of migration")
    
    # Company Info
    company_name: Optional[str] = Field(None, min_length=1, description="Client company name")
    
    # Content
    description: Optional[str] = Field(None, description="Full description")
    
    # Problem Statement
    challenges: Optional[str] = Field(None, min_length=1, description="Challenges faced")
    
    # Solution & Architecture
    approach: Optional[str] = Field(None, min_length=1, description="Solution approach")
    
    # Value Delivered
    metrics: Optional[List[MetricItem]] = Field(None, description="Performance metrics (max 5 items)")
    business_outcomes: Optional[str] = Field(None, min_length=1, description="Business outcomes")
    testimonial_quote: Optional[str] = Field(None, description="Client testimonial quote")
    testimonial_author: Optional[str] = Field(None, description="Testimonial author name")
    testimonial_position: Optional[str] = Field(None, description="Testimonial author position")
    
    # Media & Files
    pdf_url: Optional[str] = Field(None, description="PDF URL")

    @field_validator('metrics')
    @classmethod
    def validate_metrics_max_5(cls, v: Optional[List[MetricItem]]) -> Optional[List[MetricItem]]:
        """Validate that metrics array has maximum 5 items."""
        if v is not None and len(v) > 5:
            raise ValueError('Metrics array cannot have more than 5 items')
        return v


class UpdateCaseStudyResponse(BaseModel):
    """Response model for successful case study update."""
    id: str = Field(..., description="Updated case study ID")
    message: str = Field(..., description="Success message")


class DeleteCaseStudyResponse(BaseModel):
    """Response model for successful case study deletion."""
    id: str = Field(..., description="Deleted case study ID")
    message: str = Field(..., description="Success message")


class TestimonialResponse(BaseModel):
    """Response model for testimonial data only."""
    id: str = Field(..., description="Case study ID")
    company_name: str = Field(..., description="Company name")
    testimonial_quote: str = Field(..., description="Testimonial quote")
    testimonial_author: str = Field(..., description="Author name")
    testimonial_position: str = Field(..., description="Author position")
