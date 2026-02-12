"""
Accelerator Models - Pydantic models for Accelerator data.

Models:
- MetricItem: Individual metric with label and value
- CreateAcceleratorRequest: Request model for creating accelerators
- UpdateAcceleratorRequest: Request model for updating accelerators
- AcceleratorResponse: Response model for accelerator list
- AcceleratorDetailResponse: Response model for single accelerator
- CreateAcceleratorResponse: Response after creating accelerator
- UpdateAcceleratorResponse: Response after updating accelerator
- DeleteAcceleratorResponse: Response after deleting accelerator
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class MetricItem(BaseModel):
    """Individual metric with label and value."""
    label: str = Field(..., min_length=1, description="Metric label (e.g., 'Time Saved')")
    value: str = Field(..., min_length=1, description="Metric value (e.g., '50%')")


class CreateAcceleratorRequest(BaseModel):
    """Request model for creating a new accelerator."""
    title: str = Field(..., min_length=1, description="Accelerator title")
    subtitle: str = Field(..., min_length=1, description="Accelerator subtitle")
    description: str = Field(..., min_length=1, description="Full description")
    metrics: List[MetricItem] = Field(
        ..., 
        min_length=3, 
        max_length=5, 
        description="Performance metrics (min 3, max 5 items)"
    )
    status: str = Field(default="draft", description="Status: 'published' or 'draft'")
    feature_on_homepage: bool = Field(default=False, description="Whether to feature on homepage")
    thumbnail_url: str = Field(default="", description="Thumbnail image path in Azure Blob")
    video_url: str = Field(default="", description="Video file path in Azure Blob")
    pdf_url: str = Field(default="", description="PDF file path in Azure Blob")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ['draft', 'published']:
            raise ValueError("Status must be 'draft' or 'published'")
        return v

    @field_validator('metrics')
    @classmethod
    def validate_metrics(cls, v: List[MetricItem]) -> List[MetricItem]:
        if len(v) < 3:
            raise ValueError('Metrics array must have at least 3 items')
        if len(v) > 5:
            raise ValueError('Metrics array cannot have more than 5 items')
        return v


class UpdateAcceleratorRequest(BaseModel):
    """Request model for updating an accelerator. All fields optional."""
    title: Optional[str] = Field(None, min_length=1, description="Accelerator title")
    subtitle: Optional[str] = Field(None, min_length=1, description="Accelerator subtitle")
    description: Optional[str] = Field(None, min_length=1, description="Full description")
    metrics: Optional[List[MetricItem]] = Field(
        None,
        description="Performance metrics (min 3, max 5 items)"
    )
    status: Optional[str] = Field(None, description="Status: 'published' or 'draft'")
    feature_on_homepage: Optional[bool] = Field(None, description="Whether to feature on homepage")
    thumbnail_url: Optional[str] = Field(None, description="Thumbnail image path in Azure Blob")
    video_url: Optional[str] = Field(None, description="Video file path in Azure Blob")
    pdf_url: Optional[str] = Field(None, description="PDF file path in Azure Blob")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ['draft', 'published']:
            raise ValueError("Status must be 'draft' or 'published'")
        return v

    @field_validator('metrics')
    @classmethod
    def validate_metrics(cls, v: Optional[List[MetricItem]]) -> Optional[List[MetricItem]]:
        if v is not None:
            if len(v) < 3:
                raise ValueError('Metrics array must have at least 3 items')
            if len(v) > 5:
                raise ValueError('Metrics array cannot have more than 5 items')
        return v


class AcceleratorResponse(BaseModel):
    """Response model for accelerator list."""
    id: str = Field(..., description="Unique accelerator ID")
    title: str = Field(..., description="Accelerator title")
    slug: str = Field(default="", description="URL-friendly slug derived from title")
    subtitle: str = Field(..., description="Accelerator subtitle")
    description: str = Field(..., description="Description")
    status: str = Field(..., description="Status: 'published' or 'draft'")
    feature_on_homepage: bool = Field(..., description="Featured on homepage")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class AcceleratorDetailResponse(AcceleratorResponse):
    """Response model for single accelerator with full details."""
    metrics: List[MetricItem] = Field(default=[], description="Performance metrics")
    thumbnail_url: str = Field(default="", description="Thumbnail image URL")
    video_url: str = Field(default="", description="Video URL")
    pdf_url: str = Field(default="", description="PDF URL")


class CreateAcceleratorResponse(BaseModel):
    """Response after creating an accelerator."""
    id: str = Field(..., description="Created accelerator ID")
    message: str = Field(..., description="Success message")


class UpdateAcceleratorResponse(BaseModel):
    """Response after updating an accelerator."""
    id: str = Field(..., description="Updated accelerator ID")
    message: str = Field(..., description="Success message")


class DeleteAcceleratorResponse(BaseModel):
    """Response after deleting an accelerator."""
    id: str = Field(..., description="Deleted accelerator ID")
    message: str = Field(..., description="Success message")

