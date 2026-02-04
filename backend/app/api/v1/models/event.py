"""
Event Pydantic models.
Includes request/response models for event operations.

Field naming convention: snake_case (matching frontend requirements)
"""

import re
from datetime import datetime, date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# ENUMS
# =============================================================================

class EventStatus(str, Enum):
    """Event status enum."""
    draft = "draft"
    published = "published"
    archived = "archived"


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateEventRequest(BaseModel):
    """
    Request model for creating a new event.
    """
    # Required fields
    title: str = Field(..., min_length=1, description="Event title")
    subtitle: str = Field(..., min_length=1, description="Event subtitle")
    date: str = Field(..., description="Event date (YYYY-MM-DD)")
    time: str = Field(..., description="Event time (HH:mm, 24-hour format)")
    timezone: str = Field(..., min_length=1, description="IANA timezone (e.g., Asia/Kolkata)")
    duration_minutes: int = Field(..., gt=0, description="Event duration in minutes")
    description: str = Field(..., min_length=1, description="Event description")
    attendee_value: str = Field(..., min_length=1, description="Value for attendees")
    category: str = Field(..., min_length=1, description="Event category")
    featured: bool = Field(default=False, description="Whether event is featured")
    status: EventStatus = Field(default=EventStatus.draft, description="Event status: 'draft', 'published', or 'archived'")
    # Location fields
    event_type: str = Field(default="online", description="Event type: 'online', 'in-person', or 'hybrid'")
    location: str = Field(..., min_length=1, description="Meeting link for online, physical address for in-person, or both for hybrid events")

    @field_validator("date")
    @classmethod
    def validate_date_format_and_future(cls, v: str) -> str:
        """Validate date format (YYYY-MM-DD) and ensure it's in the future."""
        try:
            event_date = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        
        if event_date < date.today():
            raise ValueError("Event date must be in the future")
        
        return v

    @field_validator("time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        """Validate time format (HH:mm, 24-hour)."""
        pattern = r"^([01]\d|2[0-3]):([0-5]\d)$"
        if not re.match(pattern, v):
            raise ValueError("Time must be in HH:mm format (24-hour, e.g., 14:30)")
        return v


class UpdateEventRequest(BaseModel):
    """
    Request model for updating an event.
    All fields are optional - only provided fields will be updated.
    """
    title: Optional[str] = Field(None, min_length=1, description="Event title")
    subtitle: Optional[str] = Field(None, min_length=1, description="Event subtitle")
    date: Optional[str] = Field(None, description="Event date (YYYY-MM-DD)")
    time: Optional[str] = Field(None, description="Event time (HH:mm, 24-hour format)")
    timezone: Optional[str] = Field(None, min_length=1, description="IANA timezone (e.g., Asia/Kolkata)")
    duration_minutes: Optional[int] = Field(None, gt=0, description="Event duration in minutes")
    description: Optional[str] = Field(None, min_length=1, description="Event description")
    attendee_value: Optional[str] = Field(None, min_length=1, description="Value for attendees")
    category: Optional[str] = Field(None, min_length=1, description="Event category")
    featured: Optional[bool] = Field(None, description="Whether event is featured")
    status: Optional[EventStatus] = Field(None, description="Event status: 'draft', 'published', or 'archived'")
    # Location fields
    event_type: Optional[str] = Field(None, description="Event type: 'online', 'in-person', or 'hybrid'")
    location: Optional[str] = Field(None, description="Meeting link for online, physical address for in-person, or both for hybrid events")

    @field_validator("date")
    @classmethod
    def validate_date_format_and_future(cls, v: Optional[str]) -> Optional[str]:
        """Validate date format (YYYY-MM-DD) and ensure it's in the future."""
        if v is None:
            return None
        try:
            event_date = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        
        if event_date < date.today():
            raise ValueError("Event date must be in the future")
        
        return v

    @field_validator("time")
    @classmethod
    def validate_time_format(cls, v: Optional[str]) -> Optional[str]:
        """Validate time format (HH:mm, 24-hour)."""
        if v is None:
            return None
        pattern = r"^([01]\d|2[0-3]):([0-5]\d)$"
        if not re.match(pattern, v):
            raise ValueError("Time must be in HH:mm format (24-hour, e.g., 14:30)")
        return v


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class EventResponse(BaseModel):
    """
    Response model for event list items.
    """
    id: str = Field(..., description="Unique event ID")
    title: str = Field(..., description="Event title")
    subtitle: str = Field(..., description="Event subtitle")
    date: str = Field(..., description="Event date (YYYY-MM-DD)")
    time: str = Field(..., description="Event time (HH:mm)")
    timezone: str = Field(..., description="IANA timezone")
    duration_minutes: int = Field(..., description="Event duration in minutes")
    description: str = Field(..., description="Event description")
    attendee_value: str = Field(..., description="Value for attendees")
    category: str = Field(..., description="Event category")
    featured: bool = Field(..., description="Whether event is featured")
    status: str = Field(..., description="Event status")
    event_type: str = Field(default="online", description="Event type: 'online', 'in-person', or 'hybrid'")
    location: str = Field(..., description="Meeting link or physical address")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")


class EventDetailResponse(EventResponse):
    """
    Response model for full event detail.
    Same as EventResponse for now, can be extended later.
    """
    pass


class CreateEventResponse(BaseModel):
    """Response model for successful event creation."""
    id: str = Field(..., description="Created event ID")
    message: str = Field(..., description="Success message")


class UpdateEventResponse(BaseModel):
    """Response model for successful event update."""
    id: str = Field(..., description="Updated event ID")
    message: str = Field(..., description="Success message")


class DeleteEventResponse(BaseModel):
    """Response model for successful event deletion."""
    id: str = Field(..., description="Deleted event ID")
    message: str = Field(..., description="Success message")
