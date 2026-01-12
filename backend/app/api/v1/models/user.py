"""
User-related Pydantic models.
Includes request/response models and database models.
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# =============================================================================
# REQUEST MODELS
# =============================================================================

class UserCreateRequest(BaseModel):
    """
    Request model for user registration.
    
    Attributes:
        first_name: User's first name (required, non-empty)
        last_name: User's last name (required, non-empty)
        user_email: User's email address (required, valid email format)
        user_password: User's password (required, min 6 characters)
    """
    first_name: str = Field(..., min_length=1, description="User's first name")
    last_name: str = Field(..., min_length=1, description="User's last name")
    user_email: EmailStr = Field(..., description="User's email address")
    user_password: str = Field(..., min_length=6, description="User's password")

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, v: str) -> str:
        """Validate names are not empty or whitespace only."""
        if not v or not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()

    @field_validator("user_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password meets minimum length requirement."""
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class UserCreateResponse(BaseModel):
    """
    Response model for successful user registration.
    """
    user_id: str = Field(..., description="Generated unique user identifier")
    is_internal: bool = Field(..., description="Whether user is internal")
    message: str = Field(..., description="Success message")


class UserResponse(BaseModel):
    """
    Response model for user data (excludes sensitive info).
    """
    id: str = Field(..., alias="_id", description="User ID")
    first_name: str
    last_name: str
    user_email: str
    is_internal: bool
    is_admin: bool
    created_at: str

    class Config:
        populate_by_name = True


class ErrorResponse(BaseModel):
    """Standard error response model."""
    detail: str


# =============================================================================
# AUTHENTICATION MODELS
# =============================================================================

class SignInRequest(BaseModel):
    """
    Request model for user sign-in/authentication.
    
    Attributes:
        user_email: User's email address (required)
        user_password: User's password (required)
    """
    user_email: EmailStr = Field(..., description="User's email address")
    user_password: str = Field(..., min_length=1, description="User's password")


class SignInResponse(BaseModel):
    """
    Response model for successful authentication.
    
    Attributes:
        access_token: JWT token for authentication
        token_type: Token type (always "bearer")
        user_email: Authenticated user's email
        is_internal: Whether user is internal
        is_admin: Whether user is admin
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user_email: str = Field(..., description="User's email address")
    is_internal: bool = Field(..., description="Whether user is internal")
    is_admin: bool = Field(..., description="Whether user is admin")


# =============================================================================
# DATABASE MODELS
# =============================================================================

class UserModel(BaseModel):
    """
    User table model.
    
    Schema:
        _id: Primary Key (auto-generated UUID)
        first_name: char
        last_name: char
        user_email: char (indexed for match/like)
        is_internal: boolean
        is_admin: boolean (default false)
        created_at: timestamp
    """
    id: str = Field(..., alias="_id")
    first_name: str
    last_name: str
    user_email: str
    is_internal: bool = False
    is_admin: bool = False  # Always defaults to False per business rule
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

    def to_dict(self) -> dict:
        """Convert model to dictionary for database storage."""
        return {
            "_id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "user_email": self.user_email,
            "is_internal": self.is_internal,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat(),
        }


class LoginCredsModel(BaseModel):
    """
    Login credentials table model.
    
    Schema:
        _id: Primary Key (same as user table)
        user_email: char (indexed for match/like)
        user_password: encrypted char
        created_at: timestamp
    """
    id: str = Field(..., alias="_id")
    user_email: str
    user_password: str  # Encrypted password, never plain text
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

    def to_dict(self) -> dict:
        """Convert model to dictionary for database storage."""
        return {
            "_id": self.id,
            "user_email": self.user_email,
            "user_password": self.user_password,
            "created_at": self.created_at.isoformat(),
        }

