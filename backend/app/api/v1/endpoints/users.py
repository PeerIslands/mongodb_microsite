"""
User Registration Endpoints
===========================
Handles user registration and retrieval operations.

Endpoints:
- POST /saveuser - Register a new user
- GET /users - Get all users (debug)
- GET /users/{user_id} - Get user by ID
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict

from app.api.v1.models.user import (
    UserCreateRequest,
    UserCreateResponse,
    ErrorResponse,
    TOTPVerificationRequest,
    TOTPVerificationResponse,
    BackupCodesAcknowledgeRequest,
)
from app.api.v1.services.user_service import UserService
from app.api.v1.dependencies.services import get_user_service
from app.api.v1.exceptions.user_exceptions import (
    UserAlreadyExistsError,
    UserNotFoundError,
)


router = APIRouter()


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/saveuser",
    response_model=UserCreateResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "User successfully created"},
        400: {"model": ErrorResponse, "description": "Validation error"},
        409: {"model": ErrorResponse, "description": "Email already exists"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Register a new user",
    description="Creates a new user with encrypted password storage.",
)
async def save_user(
    request: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
) -> UserCreateResponse:
    """
    Register a new user.
    
    Processing Flow:
    1. Registration layer receives the request
    2. Validate inputs (handled by Pydantic model)
    3. Check if email already exists
    4. Determine if user is internal (@company.com)
    5. Encrypt password using bcrypt
    6. Store data in User and Login_creds tables
    7. Return success response
    
    Args:
        request: UserCreateRequest containing user registration data
        user_service: Injected UserService instance
        
    Returns:
        UserCreateResponse with user_id, is_internal flag, and success message
        
    Raises:
        HTTPException 409: If email already exists
        HTTPException 500: If storage operation fails
    """
    try:
        return await user_service.create_user(request)
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}",
        )


@router.get(
    "/users",
    response_model=Dict[str, Any],
    summary="Get all users (Debug only)",
    description="Returns all registered users. Remove in production.",
)
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Get all users from the User table.
    
    Args:
        skip: Number of users to skip (pagination)
        limit: Maximum users to return
        user_service: Injected UserService instance
        
    Returns:
        Dictionary with total count and list of users
    """
    return await user_service.get_all_users(skip=skip, limit=limit)


@router.get(
    "/users/{user_id}",
    response_model=Dict[str, Any],
    summary="Get user by ID",
    description="Returns a specific user by their ID.",
    responses={
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
async def get_user_by_id(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Get a specific user by their ID.
    
    Args:
        user_id: The user's unique identifier
        user_service: Injected UserService instance
        
    Returns:
        User data dictionary
        
    Raises:
        HTTPException 404: If user not found
    """
    try:
        return await user_service.get_user_by_id(user_id)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


# =============================================================================
# MFA/TOTP ENDPOINTS (NEW)
# =============================================================================

@router.post(
    "/register/verify-mfa",
    response_model=TOTPVerificationResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "TOTP verified, account activated"},
        400: {"model": ErrorResponse, "description": "Invalid TOTP code"},
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Verify TOTP and complete registration",
    description="Verify TOTP code during registration to activate account. This MUST be called after /saveuser to activate the account.",
)
async def verify_totp_registration(
    request: TOTPVerificationRequest,
    user_service: UserService = Depends(get_user_service),
) -> TOTPVerificationResponse:
    """
    Verify TOTP code and complete user registration.
    
    This endpoint completes the mandatory MFA setup process:
    1. Validates the TOTP code from user's authenticator app
    2. Activates the user account
    3. Generates and returns backup codes
    4. Marks registration as complete
    
    Args:
        request: TOTPVerificationRequest with user_id and totp_code
        user_service: Injected UserService instance
        
    Returns:
        TOTPVerificationResponse with backup codes and user status
        
    Raises:
        HTTPException 400: If TOTP code is invalid
        HTTPException 404: If user not found
        HTTPException 500: If internal error occurs
    """
    try:
        return await user_service.verify_totp_and_complete_registration(
            user_id=request.user_id,
            totp_code=request.totp_code,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify TOTP: {str(e)}",
        )


@router.get(
    "/register/totp-debug/{user_id}",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Debug TOTP setup (Development only)",
    description="Get current valid TOTP code for debugging. Remove in production!",
)
async def debug_totp(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Get current valid TOTP code for debugging.
    WARNING: This should be removed in production!
    """
    try:
        from app.api.v1.services.totp_service import TOTPService
        from app.api.v1.dependencies.services import get_totp_repository
        
        totp_service = TOTPService()
        totp_repo = get_totp_repository()
        
        totp_secret_doc = await totp_repo.get_totp_secret_by_user_id(user_id)
        if not totp_secret_doc:
            return {"error": "TOTP secret not found for user"}
        
        secret = totp_service.decrypt_secret(totp_secret_doc["secret_encrypted"])
        current_code = totp_service.get_current_code(secret)
        
        return {
            "user_id": user_id,
            "current_valid_code": current_code,
            "message": "Enter this code in your app to test",
            "note": "Remove this endpoint in production!"
        }
    except Exception as e:
        return {"error": str(e)}


@router.post(
    "/register/acknowledge-backup-codes",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Backup codes acknowledged"},
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    summary="Acknowledge backup codes saved",
    description="User confirms they have saved their backup codes securely.",
)
async def acknowledge_backup_codes(
    request: BackupCodesAcknowledgeRequest,
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    User acknowledges they have saved backup codes.
    
    This is the final step of registration, confirming that the user
    has safely stored their backup recovery codes.
    
    Args:
        request: BackupCodesAcknowledgeRequest with user_id
        user_service: Injected UserService instance
        
    Returns:
        Success response with redirect information
        
    Raises:
        HTTPException 404: If user not found
        HTTPException 500: If internal error occurs
    """
    try:
        await user_service.acknowledge_backup_codes(request.user_id)
        return {
            "success": True,
            "message": "Registration fully complete",
            "redirect_to": "/dashboard"
        }
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to acknowledge backup codes: {str(e)}",
        )
