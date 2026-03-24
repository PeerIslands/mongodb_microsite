"""
Event Resource Request Models
Request access to event PDF resource (name + email sent to admin, same as newsletter access).
"""

from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


# =============================================================================
# REQUEST MODELS
# =============================================================================

class EventResourceRequestCreate(BaseModel):
    """Request model for creating an event resource request."""
    event_id: str = Field(..., description="Event ID for which resource is requested")
    user_email: EmailStr = Field(..., description="Email of user requesting the resource")
    user_name: Optional[str] = Field(None, description="Full name of the user (optional; backend derives authoritative value)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "event_id": "evt-123",
                "user_email": "user@example.com",
                "user_name": "Jane Doe"
            }
        }


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class EventResourceRequestResponse(BaseModel):
    """Response model for event resource request."""
    id: str = Field(..., alias="_id", description="Request ID")
    event_id: str = Field(..., description="Event ID")
    event_title: Optional[str] = Field(None, description="Event title at time of request")
    requester_type: Optional[Literal["authenticated", "guest"]] = Field(
        None, description="Whether the requester came from an authenticated account or guest registration"
    )
    user_email: str = Field(..., description="Email of requesting user")
    user_name: Optional[str] = Field(None, description="Full name of user")
    user_id: Optional[str] = Field(None, description="User ID if authenticated")
    guest_registration_id: Optional[str] = Field(None, description="Guest registration ID if requester is a guest")
    company: Optional[str] = Field(None, description="Company captured at request time")
    designation: Optional[str] = Field(None, description="Designation captured at request time")
    phone: Optional[str] = Field(None, description="Phone captured at request time")
    status: str = Field(..., description="Request status: pending, approved, denied")
    requested_at: datetime = Field(..., description="When request was made")
    resolved_at: Optional[datetime] = Field(None, description="When request was resolved")
    resolved_by: Optional[str] = Field(None, description="Admin who resolved the request")
    admin_note: Optional[str] = Field(None, description="Note from admin")
    
    class Config:
        populate_by_name = True


# =============================================================================
# DATABASE MODELS
# =============================================================================

class EventResourceRequestModel(BaseModel):
    """
    Event resource request database model.
    """
    id: str = Field(..., alias="_id")
    event_id: str
    event_title: Optional[str] = None
    requester_type: Literal["authenticated", "guest"]
    user_email: str
    user_name: Optional[str] = None
    user_id: Optional[str] = None
    guest_registration_id: Optional[str] = None
    company: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    status: Literal["pending", "approved", "denied"] = "pending"
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    admin_note: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True
    
    def to_dict(self) -> dict:
        """Convert model to dictionary for database storage."""
        return {
            "_id": self.id,
            "event_id": self.event_id,
            "event_title": self.event_title,
            "requester_type": self.requester_type,
            "user_email": self.user_email,
            "user_name": self.user_name,
            "user_id": self.user_id,
            "guest_registration_id": self.guest_registration_id,
            "company": self.company,
            "designation": self.designation,
            "phone": self.phone,
            "status": self.status,
            "requested_at": self.requested_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "admin_note": self.admin_note,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
