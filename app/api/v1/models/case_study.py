"""
Case Study Pydantic models.
Includes request/response models for case study operations.

Field naming convention: snake_case (matching frontend requirements)
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


# =============================================================================
# NESTED MODELS
# =============================================================================

class Metrics(BaseModel):
    """Metrics object with specific performance indicators."""
    time_reduction: Optional[str] = Field(None, description="Time reduction achieved")
    ingestion_speed: Optional[str] = Field(None, description="Data ingestion speed")
    data_accuracy: Optional[str] = Field(None, description="Data accuracy improvement")


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
    slug: str = Field(..., min_length=1, description="URL-friendly slug (unique)")
    featured: bool = Field(default=False, description="Whether case study is featured")
    status: str = Field(default="draft", description="Status: 'published' or 'draft'")
    industry: str = Field(..., min_length=1, description="Industry sector")
    tech_stack: List[str] = Field(default=[], description="Array of technologies used")
    migration_type: Optional[str] = Field(None, description="Type of migration (nullable)")
    
    # Company Info
    company_name: str = Field(..., min_length=1, description="Client company name")
    company_logo: str = Field(default="", description="Company logo file path/URL")
    
    # Content
    description: str = Field(default="", description="Full description")
    industry_details: Optional[str] = Field(None, description="Detailed industry information (nullable)")
    
    # Problem Statement
    challenges: str = Field(default="", description="Challenges faced (as string)")
    technical_constraints: Optional[str] = Field(None, description="Technical limitations (nullable)")
    
    # Solution & Architecture
    approach: str = Field(default="", description="Solution approach")
    architecture_diagram: Optional[str] = Field(None, description="Architecture diagram file path/URL (nullable)")
    implementation_details: str = Field(default="", description="Details of implementation")
    
    # Value Delivered
    metrics: Metrics = Field(default_factory=Metrics, description="Performance metrics")
    business_outcomes: str = Field(default="", description="Business outcomes (as string)")
    testimonial_quote: Optional[str] = Field(None, description="Client testimonial quote (nullable)")
    testimonial_author: Optional[str] = Field(None, description="Testimonial author name (nullable)")
    testimonial_position: Optional[str] = Field(None, description="Testimonial author position (nullable)")
    
    # Media & Files
    hero_image: str = Field(default="", description="Hero image file path/URL")
    pdf_url: str = Field(default="", description="PDF file path/URL")


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class CaseStudyResponse(BaseModel):
    """
    Response model for case study list items.
    """
    id: str = Field(..., description="Unique case study ID")
    title: str = Field(..., description="Case study title")
    slug: str = Field(..., description="URL-friendly slug")
    featured: bool = Field(default=False, description="Whether case study is featured")
    status: str = Field(default="draft", description="Status: 'published' or 'draft'")
    industry: str = Field(..., description="Industry sector")
    tech_stack: List[str] = Field(default=[], description="Technologies used")
    migration_type: Optional[str] = Field(None, description="Type of migration")
    company_name: str = Field(..., description="Client company name")
    company_logo: str = Field(default="", description="Company logo URL")
    hero_image: str = Field(default="", description="Hero image URL")
    description: str = Field(default="", description="Brief description")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")


class CaseStudyDetailResponse(CaseStudyResponse):
    """
    Response model for full case study detail.
    """
    # Additional Details
    industry_details: Optional[str] = Field(None, description="Industry details")
    
    # Problem Statement
    challenges: str = Field(default="", description="Challenges")
    technical_constraints: Optional[str] = Field(None, description="Technical constraints")
    
    # Solution & Architecture
    approach: str = Field(default="", description="Solution approach")
    architecture_diagram: Optional[str] = Field(None, description="Architecture diagram URL")
    implementation_details: str = Field(default="", description="Implementation details")
    
    # Value Delivered
    metrics: Metrics = Field(default_factory=Metrics, description="Performance metrics")
    business_outcomes: str = Field(default="", description="Business outcomes")
    testimonial_quote: Optional[str] = Field(None)
    testimonial_author: Optional[str] = Field(None)
    testimonial_position: Optional[str] = Field(None)
    
    # Media & Files
    pdf_url: str = Field(default="", description="PDF URL")


class CreateCaseStudyResponse(BaseModel):
    """Response model for successful case study creation."""
    id: str = Field(..., description="Created case study ID")
    slug: str = Field(..., description="Case study slug")
    message: str = Field(..., description="Success message")


class UpdateCaseStudyRequest(BaseModel):
    """
    Request model for updating a case study.
    All fields are optional - only provided fields will be updated.
    """
    # Basic Info
    title: Optional[str] = Field(None, min_length=1, description="Case study title")
    slug: Optional[str] = Field(None, min_length=1, description="URL-friendly slug")
    featured: Optional[bool] = Field(None, description="Whether case study is featured")
    status: Optional[str] = Field(None, description="Status: 'published' or 'draft'")
    industry: Optional[str] = Field(None, min_length=1, description="Industry sector")
    tech_stack: Optional[List[str]] = Field(None, description="Technologies used")
    migration_type: Optional[str] = Field(None, description="Type of migration")
    
    # Company Info
    company_name: Optional[str] = Field(None, min_length=1, description="Client company name")
    company_logo: Optional[str] = Field(None, description="Company logo URL")
    
    # Content
    description: Optional[str] = Field(None, description="Full description")
    industry_details: Optional[str] = Field(None, description="Detailed industry information")
    
    # Problem Statement
    challenges: Optional[str] = Field(None, description="Challenges faced")
    technical_constraints: Optional[str] = Field(None, description="Technical limitations")
    
    # Solution & Architecture
    approach: Optional[str] = Field(None, description="Solution approach")
    architecture_diagram: Optional[str] = Field(None, description="Architecture diagram URL")
    implementation_details: Optional[str] = Field(None, description="Details of implementation")
    
    # Value Delivered
    metrics: Optional[Metrics] = Field(None, description="Performance metrics")
    business_outcomes: Optional[str] = Field(None, description="Business outcomes")
    testimonial_quote: Optional[str] = Field(None, description="Client testimonial quote")
    testimonial_author: Optional[str] = Field(None, description="Testimonial author name")
    testimonial_position: Optional[str] = Field(None, description="Testimonial author position")
    
    # Media & Files
    hero_image: Optional[str] = Field(None, description="Hero image URL")
    pdf_url: Optional[str] = Field(None, description="PDF URL")


class UpdateCaseStudyResponse(BaseModel):
    """Response model for successful case study update."""
    id: str = Field(..., description="Updated case study ID")
    slug: str = Field(..., description="Case study slug")
    message: str = Field(..., description="Success message")


class DeleteCaseStudyResponse(BaseModel):
    """Response model for successful case study deletion."""
    id: str = Field(..., description="Deleted case study ID")
    message: str = Field(..., description="Success message")
