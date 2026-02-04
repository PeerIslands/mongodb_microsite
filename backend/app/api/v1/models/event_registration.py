"""
Event Registration Pydantic models.
Includes request/response models for event registration operations.

Field naming convention: snake_case (matching frontend requirements)
"""

from enum import Enum
from pydantic import BaseModel, Field


# =============================================================================
# ENUMS
# =============================================================================

class RegistrationStatus(str, Enum):
    """Event registration status enum."""
    REGISTERED = "REGISTERED"
    CANCELLED = "CANCELLED"


# =============================================================================
# REQUEST MODELS
# =============================================================================

class CreateEventRegistrationRequest(BaseModel):
    """
    Request model for creating a new event registration.
    User ID is extracted from JWT token, only event_id is required.
    """
    event_id: str = Field(..., min_length=1, description="Event ID to register for")


class UpdateRegistrationStatusRequest(BaseModel):
    """
    Request model for updating registration status.
    """
    status: RegistrationStatus = Field(..., description="New registration status: REGISTERED or CANCELLED")


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class EventRegistrationResponse(BaseModel):
    """
    Response model for event registration.
    """
    id: str = Field(..., description="Unique registration ID")
    user_id: str = Field(..., description="User ID")
    event_id: str = Field(..., description="Event ID")
    status: str = Field(..., description="Registration status")
    registered_at: str = Field(..., description="Registration timestamp")


class CreateEventRegistrationResponse(BaseModel):
    """Response model for successful event registration creation."""
    id: str = Field(..., description="Created registration ID")
    message: str = Field(..., description="Success message")


class UpdateEventRegistrationResponse(BaseModel):
    """Response model for successful registration status update."""
    id: str = Field(..., description="Updated registration ID")
    message: str = Field(..., description="Success message")


class DeleteEventRegistrationResponse(BaseModel):
    """Response model for successful registration deletion."""
    id: str = Field(..., description="Deleted registration ID")
    message: str = Field(..., description="Success message")


class EventRegistrationCountResponse(BaseModel):
    """Response model for registration count."""
    event_id: str = Field(..., description="Event ID")
    count: int = Field(..., description="Number of registrations")


class SendRegistrationConfirmationRequest(BaseModel):
    """
    Request model for sending registration confirmation email.
    """
    receiver_email: str = Field(..., min_length=1, description="Recipient email address")
    event_id: str = Field(..., min_length=1, description="Event ID to fetch details from")


class SendRegistrationConfirmationResponse(BaseModel):
    """Response model for send confirmation email."""
    success: bool = Field(..., description="Whether the email was sent successfully")
    message: str = Field(..., description="Status message")
