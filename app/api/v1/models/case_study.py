"""
Case Study Pydantic models.
Includes request/response models for case study operations.
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


# =============================================================================
# NESTED MODELS
# =============================================================================

class CaseStudyChallenge(BaseModel):
    """A challenge faced by the client."""
    text: str = Field(..., description="Description of the challenge")


class CaseStudyMetric(BaseModel):
    """A metric showing value delivered."""
    label: str = Field(..., description="Metric label (e.g., 'Performance Improvement')")
    value: str = Field(..., description="Metric value (e.g., '40%')")


class CaseStudyOutcome(BaseModel):
    """A business outcome achieved."""
    text: str = Field(..., description="Description of the outcome")


class CaseStudyCodeSnippet(BaseModel):
    """A code snippet showcasing the solution."""
    language: str = Field(..., description="Programming language")
    code: str = Field(..., description="The code content")
    description: Optional[str] = Field(None, description="Description of what the code does")


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateCaseStudyRequest(BaseModel):
    """
    Request model for creating a new case study.
    """
    # Basic Info
    title: str = Field(..., min_length=1, description="Case study title")
    slug: str = Field(..., min_length=1, description="URL-friendly slug")
    industry: str = Field(..., min_length=1, description="Industry sector")
    migrationType: str = Field(..., min_length=1, description="Type of migration")
    techStack: List[str] = Field(default=[], description="Technologies used")
    
    # Company Info
    companyName: str = Field(..., min_length=1, description="Client company name")
    companyLogo: str = Field(default="", description="URL to company logo")
    
    # Content
    summary: str = Field(default="", description="Brief summary")
    description: str = Field(default="", description="Full description of the client")
    industryDetails: Optional[str] = Field(None, description="Detailed industry information")
    
    # Problem Statement
    challenges: List[CaseStudyChallenge] = Field(default=[], description="List of challenges")
    businessImpact: str = Field(default="", description="Impact on business before solution")
    technicalConstraints: Optional[str] = Field(None, description="Technical limitations")
    
    # Solution & Architecture
    solutionApproach: str = Field(default="", description="How the solution was approached")
    architectureDiagram: str = Field(default="", description="URL to architecture diagram")
    implementationDetails: str = Field(default="", description="Details of implementation")
    codeSnippets: Optional[List[CaseStudyCodeSnippet]] = Field(None, description="Code examples")
    
    # Value Delivered
    metrics: List[CaseStudyMetric] = Field(default=[], description="Key metrics")
    businessOutcomes: List[CaseStudyOutcome] = Field(default=[], description="Business outcomes")
    testimonialQuote: Optional[str] = Field(None, description="Client testimonial quote")
    testimonialAuthor: Optional[str] = Field(None, description="Testimonial author name")
    testimonialPosition: Optional[str] = Field(None, description="Testimonial author position")
    
    # Media & Files
    heroImage: str = Field(default="", description="URL to hero image")
    galleryImages: Optional[List[str]] = Field(None, description="Gallery image URLs")
    pdfUrl: Optional[str] = Field(None, description="URL to PDF download")
    
    # Status
    status: str = Field(default="draft", description="Publication status: 'published' or 'draft'")
    featured: bool = Field(default=False, description="Whether case study is featured")


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class CaseStudyResponse(BaseModel):
    """
    Response model for case study list items.
    """
    id: str = Field(..., description="Unique case study ID")
    slug: str = Field(..., description="URL-friendly slug")
    title: str = Field(..., description="Case study title")
    industry: str = Field(..., description="Industry sector")
    migrationType: str = Field(..., description="Type of migration")
    techStack: List[str] = Field(default=[], description="Technologies used")
    status: str = Field(..., description="Publication status")
    featured: bool = Field(default=False, description="Whether case study is featured")
    views: int = Field(default=0, description="View count")
    createdAt: str = Field(..., description="Creation timestamp")
    updatedAt: str = Field(..., description="Last update timestamp")
    companyName: str = Field(..., description="Client company name")
    companyLogo: str = Field(default="", description="URL to company logo")
    heroImage: str = Field(default="", description="URL to hero image")
    summary: str = Field(default="", description="Brief summary")


class CaseStudyDetailResponse(CaseStudyResponse):
    """
    Response model for full case study detail.
    """
    # Client Background
    description: str = Field(default="", description="Full description")
    industryDetails: Optional[str] = Field(None, description="Industry details")

    # Problem Statement
    challenges: List[CaseStudyChallenge] = Field(default=[], description="Challenges")
    businessImpact: str = Field(default="", description="Business impact")
    technicalConstraints: Optional[str] = Field(None, description="Technical constraints")

    # Solution & Architecture
    solutionApproach: str = Field(default="", description="Solution approach")
    architectureDiagram: str = Field(default="", description="Architecture diagram URL")
    implementationDetails: str = Field(default="", description="Implementation details")
    codeSnippets: Optional[List[CaseStudyCodeSnippet]] = Field(None, description="Code snippets")

    # Value Delivered
    metrics: List[CaseStudyMetric] = Field(default=[], description="Metrics")
    businessOutcomes: List[CaseStudyOutcome] = Field(default=[], description="Outcomes")
    testimonialQuote: Optional[str] = Field(None)
    testimonialAuthor: Optional[str] = Field(None)
    testimonialPosition: Optional[str] = Field(None)

    # Media & Files
    galleryImages: Optional[List[str]] = Field(None)
    pdfUrl: Optional[str] = Field(None)


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
    industry: Optional[str] = Field(None, min_length=1, description="Industry sector")
    migrationType: Optional[str] = Field(None, min_length=1, description="Type of migration")
    techStack: Optional[List[str]] = Field(None, description="Technologies used")
    
    # Company Info
    companyName: Optional[str] = Field(None, min_length=1, description="Client company name")
    companyLogo: Optional[str] = Field(None, description="URL to company logo")
    
    # Content
    summary: Optional[str] = Field(None, description="Brief summary")
    description: Optional[str] = Field(None, description="Full description of the client")
    industryDetails: Optional[str] = Field(None, description="Detailed industry information")
    
    # Problem Statement
    challenges: Optional[List[CaseStudyChallenge]] = Field(None, description="List of challenges")
    businessImpact: Optional[str] = Field(None, description="Impact on business before solution")
    technicalConstraints: Optional[str] = Field(None, description="Technical limitations")
    
    # Solution & Architecture
    solutionApproach: Optional[str] = Field(None, description="How the solution was approached")
    architectureDiagram: Optional[str] = Field(None, description="URL to architecture diagram")
    implementationDetails: Optional[str] = Field(None, description="Details of implementation")
    codeSnippets: Optional[List[CaseStudyCodeSnippet]] = Field(None, description="Code examples")
    
    # Value Delivered
    metrics: Optional[List[CaseStudyMetric]] = Field(None, description="Key metrics")
    businessOutcomes: Optional[List[CaseStudyOutcome]] = Field(None, description="Business outcomes")
    testimonialQuote: Optional[str] = Field(None, description="Client testimonial quote")
    testimonialAuthor: Optional[str] = Field(None, description="Testimonial author name")
    testimonialPosition: Optional[str] = Field(None, description="Testimonial author position")
    
    # Media & Files
    heroImage: Optional[str] = Field(None, description="URL to hero image")
    galleryImages: Optional[List[str]] = Field(None, description="Gallery image URLs")
    pdfUrl: Optional[str] = Field(None, description="URL to PDF download")
    
    # Status
    status: Optional[str] = Field(None, description="Publication status: 'published' or 'draft'")
    featured: Optional[bool] = Field(None, description="Whether case study is featured")


class UpdateCaseStudyResponse(BaseModel):
    """Response model for successful case study update."""
    id: str = Field(..., description="Updated case study ID")
    slug: str = Field(..., description="Case study slug")
    message: str = Field(..., description="Success message")

