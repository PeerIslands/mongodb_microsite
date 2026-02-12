"""
Newsletter Access Request Models
Handles access control for newsletter viewing
"""

from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


# =============================================================================
# REQUEST MODELS
# =============================================================================

class NewsletterAccessRequestCreate(BaseModel):
    """Request model for creating a newsletter access request."""
    user_email: EmailStr = Field(..., description="Email of user requesting access")
    newsletter_id: Optional[str] = Field(None, description="Specific newsletter ID (optional)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_email": "user@example.com",
                "newsletter_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class NewsletterAccessAction(BaseModel):
    """Request model for approving/denying access."""
    request_id: str = Field(..., description="Access request ID")
    action: Literal["approve", "deny"] = Field(..., description="Action to take")
    admin_note: Optional[str] = Field(None, description="Optional note from admin")
    
    class Config:
        json_schema_extra = {
            "example": {
                "request_id": "123e4567-e89b-12d3-a456-426614174000",
                "action": "approve",
                "admin_note": "Approved for internal team"
            }
        }


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class NewsletterAccessRequestResponse(BaseModel):
    """Response model for newsletter access request."""
    id: str = Field(..., alias="_id", description="Request ID")
    user_email: str = Field(..., description="Email of requesting user")
    user_id: Optional[str] = Field(None, description="User ID if authenticated")
    newsletter_id: Optional[str] = Field(None, description="Specific newsletter ID")
    status: str = Field(..., description="Request status: pending, approved, denied")
    requested_at: datetime = Field(..., description="When request was made")
    resolved_at: Optional[datetime] = Field(None, description="When request was resolved")
    resolved_by: Optional[str] = Field(None, description="Admin who resolved the request")
    admin_note: Optional[str] = Field(None, description="Note from admin")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_email": "user@example.com",
                "user_id": "user123",
                "newsletter_id": None,
                "status": "pending",
                "requested_at": "2024-01-01T00:00:00Z",
                "resolved_at": None,
                "resolved_by": None,
                "admin_note": None
            }
        }


class NewsletterAccessCheckResponse(BaseModel):
    """Response for checking if user has access to newsletters."""
    has_access: bool = Field(..., description="Whether user has access")
    user_email: Optional[str] = Field(None, description="User email checked")
    pending_request: bool = Field(default=False, description="Whether there's a pending request")
    message: str = Field(..., description="Status message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "has_access": False,
                "user_email": "user@example.com",
                "pending_request": True,
                "message": "Access request pending admin approval"
            }
        }


class PendingRequestsCountResponse(BaseModel):
    """Response for pending requests count (for notification badge)."""
    count: int = Field(..., description="Number of pending requests")
    
    class Config:
        json_schema_extra = {
            "example": {
                "count": 5
            }
        }


# =============================================================================
# DATABASE MODELS
# =============================================================================

class NewsletterAccessRequestModel(BaseModel):
    """
    Newsletter access request database model.
    
    Schema:
        _id: Primary Key (auto-generated UUID)
        user_email: Email of requesting user (indexed)
        user_id: User ID if authenticated (optional)
        user_domain: Email domain for filtering
        newsletter_id: Specific newsletter ID (optional, None = all newsletters)
        status: pending, approved, denied
        requested_at: Timestamp
        resolved_at: Timestamp (when approved/denied)
        resolved_by: Admin user ID who resolved
        admin_note: Optional note from admin
        created_at: Timestamp
        updated_at: Timestamp
    """
    id: str = Field(..., alias="_id")
    user_email: str
    user_id: Optional[str] = None
    user_domain: str  # Extracted from email for easy filtering
    newsletter_id: Optional[str] = None  # None means access to all newsletters
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
            "user_email": self.user_email,
            "user_id": self.user_id,
            "user_domain": self.user_domain,
            "newsletter_id": self.newsletter_id,
            "status": self.status,
            "requested_at": self.requested_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "admin_note": self.admin_note,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
