"""
User-related Pydantic models.
Includes request/response models and database models.
Updated to support mandatory MFA/TOTP during registration.
"""

from datetime import datetime, timezone
from typing import Optional, List, Literal
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
# TOTP/MFA MODELS (NEW)
# =============================================================================

class TOTPSetupData(BaseModel):
    """TOTP setup information returned during registration."""
    secret: str = Field(..., description="Base32 encoded secret")
    qr_code: str = Field(..., description="QR code data URL")
    manual_entry_key: str = Field(..., description="Secret for manual entry")
    issuer: str = Field(..., description="Issuer name")
    account_name: str = Field(..., description="User's email")
    otpauth_url: str = Field(..., description="Full otpauth:// URL")


class TOTPVerificationRequest(BaseModel):
    """Request to verify TOTP during registration."""
    user_id: str = Field(..., description="User ID from registration")
    totp_code: str = Field(
        ..., 
        min_length=6, 
        max_length=6, 
        description="6-digit TOTP code"
    )
    
    @field_validator("totp_code")
    @classmethod
    def validate_totp_code(cls, v: str) -> str:
        """Validate TOTP code is 6 digits."""
        if not v.isdigit():
            raise ValueError("TOTP code must contain only digits")
        if len(v) != 6:
            raise ValueError("TOTP code must be exactly 6 digits")
        return v


class TOTPVerificationResponse(BaseModel):
    """Response after successful TOTP verification."""
    success: bool = Field(default=True)
    message: str = Field(..., description="Success message")
    
    # User Status (UPDATED)
    user: dict = Field(..., description="Updated user data")
    
    # Backup Codes (MANDATORY)
    backup_codes: List[str] = Field(..., description="10 backup codes")
    
    # Auto-login token (OPTIONAL - for UX)
    access_token: Optional[str] = Field(None, description="JWT token for auto-login")
    
    next_step: str = Field(
        default="save_backup_codes",
        description="Next step"
    )


class BackupCodesAcknowledgeRequest(BaseModel):
    """Acknowledge backup codes have been saved."""
    user_id: str = Field(..., description="User ID")
    acknowledged: bool = Field(..., description="User confirms codes saved")


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class UserCreateResponse(BaseModel):
    """
    UPDATED: Response model for user registration.
    NOW includes TOTP setup data (mandatory).
    """
    user_id: str = Field(..., description="Generated unique user identifier")
    user_email: str = Field(..., description="User's email")
    is_internal: bool = Field(..., description="Whether user is internal")
    
    # Account Status (NEW)
    registration_status: Literal["pending_mfa", "completed"] = Field(
        default="pending_mfa",
        description="Registration status"
    )
    account_active: bool = Field(
        default=False,
        description="Account is active and can login"
    )
    
    # TOTP Setup Data (NEW - REQUIRED)
    totp_setup: TOTPSetupData = Field(..., description="TOTP setup information")
    
    # Metadata
    message: str = Field(..., description="Success message")
    next_step: str = Field(
        default="verify_totp",
        description="Next required step"
    )


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


class VerifyLoginTOTPRequest(BaseModel):
    """
    Request model for TOTP verification during login.
    """
    session_token: str = Field(..., description="Temporary session token from sign-in")
    totp_code: str = Field(
        ..., 
        min_length=6, 
        max_length=6, 
        description="6-digit TOTP code"
    )
    
    @field_validator("totp_code")
    @classmethod
    def validate_totp_code(cls, v: str) -> str:
        """Validate TOTP code is 6 digits."""
        if not v.isdigit():
            raise ValueError("TOTP code must contain only digits")
        if len(v) != 6:
            raise ValueError("TOTP code must be exactly 6 digits")
        return v


class VerifyLoginTOTPResponse(BaseModel):
    """
    Response model after successful TOTP verification during login.
    """
    success: bool = Field(default=True)
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user_email: str = Field(..., description="User's email address")
    is_internal: bool = Field(..., description="Whether user is internal")
    is_admin: bool = Field(..., description="Whether user is admin")
    message: str = Field(default="Login successful", description="Success message")


class SignInResponse(BaseModel):
    """
    UPDATED: Response model for authentication.
    NOW checks if registration is complete.
    
    Attributes:
        success: Whether authentication was successful
        access_token: JWT token (if authentication complete)
        token_type: Token type (always "bearer")
        user_email: Authenticated user's email
        is_internal: Whether user is internal
        is_admin: Whether user is admin
        registration_incomplete: If true, registration needs completion
        registration_status: Current registration status
        redirect_to: URL to redirect for incomplete registration
        requires_totp: If TOTP code is required for login
        message: Response message
    """
    success: bool = Field(default=True)
    
    # If registration incomplete
    registration_incomplete: Optional[bool] = Field(None)
    registration_status: Optional[str] = Field(None)
    redirect_to: Optional[str] = Field(None)
    
    # If registration complete
    requires_totp: Optional[bool] = Field(None)
    session_token: Optional[str] = Field(None)
    access_token: Optional[str] = Field(None)
    token_type: Optional[str] = Field(default="bearer")
    
    # User data
    user_email: Optional[str] = Field(None)
    is_internal: Optional[bool] = Field(None)
    is_admin: Optional[bool] = Field(None)
    
    message: str = Field(..., description="Response message")


# =============================================================================
# DATABASE MODELS
# =============================================================================

class UserModel(BaseModel):
    """
    UPDATED: User table model with MFA fields.
    
    Schema:
        _id: Primary Key (auto-generated UUID)
        first_name: char
        last_name: char
        user_email: char (indexed for match/like)
        is_internal: boolean
        is_admin: boolean (default false)
        totp_enabled: boolean (NEW - MFA status)
        totp_setup_at: timestamp (NEW)
        totp_last_used: timestamp (NEW)
        registration_status: str (NEW - pending_mfa or completed)
        registration_started_at: timestamp (NEW)
        registration_completed_at: timestamp (NEW)
        account_active: boolean (NEW)
        can_login: boolean (NEW)
        created_at: timestamp
    """
    id: str = Field(..., alias="_id")
    first_name: str
    last_name: str
    user_email: str
    is_internal: bool = False
    is_admin: bool = False  # Always defaults to False per business rule
    
    # MFA Fields (NEW - MANDATORY)
    totp_enabled: bool = Field(default=False)
    totp_setup_at: Optional[datetime] = None
    totp_last_used: Optional[datetime] = None
    
    # Registration Status (NEW)
    registration_status: Literal["pending_mfa", "completed"] = Field(
        default="pending_mfa"
    )
    registration_started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    registration_completed_at: Optional[datetime] = None
    
    # Account Access (NEW)
    account_active: bool = Field(default=False)
    can_login: bool = Field(default=False)
    
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
            
            # MFA fields
            "totp_enabled": self.totp_enabled,
            "totp_setup_at": self.totp_setup_at.isoformat() if self.totp_setup_at else None,
            "totp_last_used": self.totp_last_used.isoformat() if self.totp_last_used else None,
            
            # Registration status
            "registration_status": self.registration_status,
            "registration_started_at": self.registration_started_at.isoformat(),
            "registration_completed_at": self.registration_completed_at.isoformat() if self.registration_completed_at else None,
            
            # Account access
            "account_active": self.account_active,
            "can_login": self.can_login,
            
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


class TOTPSecretModel(BaseModel):
    """
    Model for TOTP secrets collection (NEW).
    
    Schema:
        _id: Primary Key (auto-generated UUID)
        user_id: Foreign key to users._id (UNIQUE)
        user_email: Denormalized for queries
        secret_encrypted: AES-256 encrypted Base32 secret
        encryption_key_id: Which encryption key was used
        is_verified: Has user verified the setup
        setup_initiated_at: When setup started
        setup_completed_at: When verification succeeded
        verification_attempts: Failed verification count
        backup_codes: List of hashed backup codes
        backup_codes_acknowledged: User confirmed saving codes
        created_at: timestamp
        updated_at: timestamp
    """
    id: str = Field(..., alias="_id")
    user_id: str
    user_email: str
    
    # Secret (encrypted)
    secret_encrypted: str
    encryption_key_id: str = "key-v1"
    
    # Status
    is_verified: bool = False
    setup_initiated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    setup_completed_at: Optional[datetime] = None
    verification_attempts: int = 0
    
    # Backup codes - List of dicts: {code_hash: str, is_used: bool, used_at: Optional[datetime]}
    backup_codes: List[dict] = Field(default_factory=list)
    backup_codes_acknowledged: bool = False
    backup_codes_downloaded: bool = False
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    
    class Config:
        populate_by_name = True
    
    def to_dict(self) -> dict:
        """Convert model to dictionary for database storage."""
        return {
            "_id": self.id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "secret_encrypted": self.secret_encrypted,
            "encryption_key_id": self.encryption_key_id,
            "is_verified": self.is_verified,
            "setup_initiated_at": self.setup_initiated_at.isoformat(),
            "setup_completed_at": self.setup_completed_at.isoformat() if self.setup_completed_at else None,
            "verification_attempts": self.verification_attempts,
            "backup_codes": self.backup_codes,
            "backup_codes_acknowledged": self.backup_codes_acknowledged,
            "backup_codes_downloaded": self.backup_codes_downloaded,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

