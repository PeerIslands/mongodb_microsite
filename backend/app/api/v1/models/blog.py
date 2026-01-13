"""
Blog Pydantic models.
Includes request/response models for blog operations.

Field naming convention: snake_case (matching frontend requirements)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# ENUMS
# =============================================================================

class BlogStatus(str, Enum):
    """Blog status enum."""
    draft = "draft"
    published = "published"


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateBlogRequest(BaseModel):
    """
    Request model for creating a new blog.
    """
    # Required fields
    title: str = Field(..., min_length=1, description="Blog title")
    description: str = Field(..., min_length=1, description="Blog description/content")
    category: str = Field(..., min_length=1, description="Blog category")
    url: str = Field(..., min_length=1, description="External blog URL")
    
    # Optional fields
    author: Optional[str] = Field(None, description="Author name")
    published_date: Optional[str] = Field(None, description="Publication date (YYYY-MM-DD)")
    tags: List[str] = Field(default=[], description="Blog tags")
    status: BlogStatus = Field(default=BlogStatus.draft, description="Blog status: 'draft' or 'published'")

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        """Parse tags from comma-separated string or list."""
        if isinstance(v, str):
            return [tag.strip() for tag in v.split(",") if tag.strip()]
        return v if v else []


class UpdateBlogRequest(BaseModel):
    """
    Request model for updating a blog.
    All fields are optional - only provided fields will be updated.
    """
    title: Optional[str] = Field(None, min_length=1, description="Blog title")
    description: Optional[str] = Field(None, min_length=1, description="Blog description/content")
    category: Optional[str] = Field(None, min_length=1, description="Blog category")
    url: Optional[str] = Field(None, min_length=1, description="External blog URL")
    author: Optional[str] = Field(None, description="Author name")
    published_date: Optional[str] = Field(None, description="Publication date (YYYY-MM-DD)")
    tags: Optional[List[str]] = Field(None, description="Blog tags")
    status: Optional[BlogStatus] = Field(None, description="Blog status: 'draft' or 'published'")

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        """Parse tags from comma-separated string or list."""
        if v is None:
            return None
        if isinstance(v, str):
            return [tag.strip() for tag in v.split(",") if tag.strip()]
        return v


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class BlogResponse(BaseModel):
    """
    Response model for blog list items.
    """
    id: str = Field(..., description="Unique blog ID")
    title: str = Field(..., description="Blog title")
    description: str = Field(..., description="Blog description")
    category: str = Field(..., description="Blog category")
    author: Optional[str] = Field(None, description="Author name")
    url: str = Field(..., description="External blog URL")
    published_date: Optional[str] = Field(None, description="Publication date")
    tags: List[str] = Field(default=[], description="Blog tags")
    status: str = Field(..., description="Blog status")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")


class BlogDetailResponse(BlogResponse):
    """
    Response model for full blog detail.
    Same as BlogResponse for now, can be extended later.
    """
    pass


class CreateBlogResponse(BaseModel):
    """Response model for successful blog creation."""
    id: str = Field(..., description="Created blog ID")
    message: str = Field(..., description="Success message")


class UpdateBlogResponse(BaseModel):
    """Response model for successful blog update."""
    id: str = Field(..., description="Updated blog ID")
    message: str = Field(..., description="Success message")


class DeleteBlogResponse(BaseModel):
    """Response model for successful blog deletion."""
    id: str = Field(..., description="Deleted blog ID")
    message: str = Field(..., description="Success message")

