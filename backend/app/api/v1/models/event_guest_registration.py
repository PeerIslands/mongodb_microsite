"""
Guest event registration model.
Stores form submissions from unauthenticated visitors registering for events.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class GuestEventRegistrationCreate(BaseModel):
    event_id: str
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    company: Optional[str] = Field(None, max_length=200)
    designation: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)


class VerifyGuestAccessRequest(BaseModel):
    event_id: str
    email: EmailStr


class VerifyGuestAccessResponse(BaseModel):
    email: str
    first_name: str


class GuestEventRegistrationResponse(BaseModel):
    id: str
    event_id: str
    first_name: str
    last_name: str
    email: str
    company: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    status: str
    registered_at: str
