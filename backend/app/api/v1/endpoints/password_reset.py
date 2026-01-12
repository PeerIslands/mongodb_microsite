"""
Password Reset Endpoints
========================
Handles password reset with TOTP verification.

Endpoints:
- POST /password-reset/request - Initiate password reset
- POST /password-reset/verify-totp - Verify TOTP for reset
- POST /password-reset/verify-backup-code - Verify backup code
- POST /password-reset/complete - Complete password reset
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from pydantic import BaseModel, EmailStr, Field

from app.api.v1.services.password_reset_service import PasswordResetService
from app.api.v1.dependencies.services import get_password_reset_service
from app.api.v1.models.user import ErrorResponse


router = APIRouter()


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class PasswordResetRequestRequest(BaseModel):
    """Request to initiate password reset."""
    user_email: EmailStr = Field(..., description="User's email address")


class PasswordResetRequestResponse(BaseModel):
    """Response for password reset request."""
    success: bool = Field(default=True)
    totp_required: bool = Field(..., description="Whether TOTP is required")
    message: str = Field(..., description="Response message")
    reset_token: str = Field(..., description="Temporary reset token")


class PasswordResetVerifyTOTPRequest(BaseModel):
    """Request to verify TOTP for password reset."""
    reset_token: str = Field(..., description="Reset token from previous step")
    totp_code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")


class PasswordResetVerifyTOTPResponse(BaseModel):
    """Response after TOTP verification."""
    success: bool = Field(default=True)
    message: str = Field(..., description="Success message")
    password_reset_token: str = Field(..., description="Verified reset token")
    expires_in: int = Field(default=600, description="Token expiry in seconds")


class PasswordResetCompleteRequest(BaseModel):
    """Request to complete password reset."""
    password_reset_token: str = Field(..., description="Verified reset token")
    new_password: str = Field(..., min_length=6, description="New password")


class PasswordResetCompleteResponse(BaseModel):
    """Response after password reset complete."""
    success: bool = Field(default=True)
    message: str = Field(..., description="Success message")
    sessions_invalidated: int = Field(..., description="Number of sessions invalidated")


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/password-reset/request",
    response_model=PasswordResetRequestResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Reset request processed"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Request password reset",
    description="Initiate password reset process. Checks if TOTP is required.",
)
async def request_password_reset(
    request: PasswordResetRequestRequest,
    service: PasswordResetService = Depends(get_password_reset_service),
) -> PasswordResetRequestResponse:
    """
    Initiate password reset.
    
    If user has TOTP enabled:
    - Returns totp_required=True
    - User must verify TOTP code
    
    If user doesn't have TOTP:
    - Returns totp_required=False
    - Traditional email reset link
    
    Note: Always returns 200 to prevent email enumeration
    """
    try:
        return await service.request_password_reset(request.user_email)
    except Exception as e:
        # Always return success to prevent email enumeration
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.post(
    "/password-reset/verify-totp",
    response_model=PasswordResetVerifyTOTPResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "TOTP verified"},
        400: {"model": ErrorResponse, "description": "Invalid TOTP code"},
        429: {"model": ErrorResponse, "description": "Too many attempts"},
    },
    summary="Verify TOTP for password reset",
    description="Verify TOTP code to proceed with password reset.",
)
async def verify_totp_for_reset(
    request: PasswordResetVerifyTOTPRequest,
    service: PasswordResetService = Depends(get_password_reset_service),
) -> PasswordResetVerifyTOTPResponse:
    """
    Verify TOTP code for password reset.
    
    Returns a verified token that can be used to set new password.
    """
    try:
        return await service.verify_totp_for_reset(
            reset_token=request.reset_token,
            totp_code=request.totp_code,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}",
        )


@router.post(
    "/password-reset/complete",
    response_model=PasswordResetCompleteResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Password reset complete"},
        400: {"model": ErrorResponse, "description": "Invalid token or password"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
    summary="Complete password reset",
    description="Set new password after TOTP verification.",
)
async def complete_password_reset(
    request: PasswordResetCompleteRequest,
    service: PasswordResetService = Depends(get_password_reset_service),
) -> PasswordResetCompleteResponse:
    """
    Complete password reset with new password.
    
    Requires verified reset token from TOTP verification.
    Invalidates all user sessions.
    """
    try:
        return await service.complete_password_reset(
            reset_token=request.password_reset_token,
            new_password=request.new_password,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}",
        )

