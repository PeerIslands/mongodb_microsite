"""
Home popup config model.
Single config for the home page popup (image, title, CTA).
"""

from typing import Optional
from pydantic import BaseModel, Field


class HomePopupConfig(BaseModel):
    """Stored config for the home page popup."""

    image_url: Optional[str] = Field(None, description="Blob path for background image")
    title_text: str = Field(default="On-Demand webinar", description="Overlay title text")
    cta_text: str = Field(default="Click here to visit our On-Demand Webinars", description="CTA button text")
    cta_link: str = Field(default="/events/on-demand", description="Link URL when popup is clicked")
    enabled: bool = Field(default=True, description="Whether the popup is shown on the home page")


class HomePopupPublicResponse(BaseModel):
    """Response for public GET: only include if enabled and has image."""

    image_url: str = Field(..., description="Blob path for background image (use /api/v1/home-popup/image to load)")
    title_text: str
    cta_text: str
    cta_link: str


class HomePopupAdminResponse(BaseModel):
    """Response for admin GET: full config."""

    image_url: Optional[str] = None
    title_text: str
    cta_text: str
    cta_link: str
    enabled: bool


class HomePopupUpdateRequest(BaseModel):
    """Request body for admin PUT."""

    image_url: Optional[str] = None
    title_text: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    enabled: Optional[bool] = None
