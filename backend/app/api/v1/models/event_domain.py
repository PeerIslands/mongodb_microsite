"""
Event domain whitelist models.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class WhitelistedDomainResponse(BaseModel):
    domain: str
    added_at: str


class AddDomainRequest(BaseModel):
    domain: str = Field(..., min_length=1, max_length=253, description="e.g. mongodb.com")


class DomainRequestResponse(BaseModel):
    domain: str
    first_requested_at: str
    last_requested_at: str
    request_count: int
    status: str  # pending | approved | rejected


class DomainRequestCountResponse(BaseModel):
    pending_count: int
