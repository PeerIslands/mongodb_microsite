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
from typing import Any, Dict, Optional

from app.api.v1.models.user import (
    UserCreateRequest,
    UserCreateResponse,
    ErrorResponse,
    TOTPVerificationRequest,
    TOTPVerificationResponse,
    BackupCodesAcknowledgeRequest,
    UserProfileResponse,
    UserProfileUpdateRequest,
    UserModel,
)
from app.api.v1.services.user_service import UserService
from app.api.v1.dependencies.services import get_user_service, get_current_active_user
from app.api.v1.exceptions.user_exceptions import (
    UserAlreadyExistsError,
    UserNotFoundError,
    UserValidationError,
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
    except UserValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
    summary="Get all users with filtering",
    description="Returns all registered users with optional filters.",
)
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    is_admin: Optional[bool] = None,
    is_internal: Optional[bool] = None,
    registration_status: Optional[str] = None,
    search: Optional[str] = None,
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Get all users from the User table with optional filters.
    
    Args:
        skip: Number of users to skip (pagination)
        limit: Maximum users to return
        is_admin: Filter by admin status (optional)
        is_internal: Filter by internal status (optional)
        registration_status: Filter by registration status (optional)
        search: Search by name or email (optional)
        user_service: Injected UserService instance
        
    Returns:
        Dictionary with total count, filtered count, and list of users
    """
    filters = {}
    if is_admin is not None:
        filters['is_admin'] = is_admin
    if is_internal is not None:
        filters['is_internal'] = is_internal
    if registration_status is not None:
        filters['registration_status'] = registration_status
    if search is not None:
        filters['search'] = search
        
    return await user_service.get_all_users(skip=skip, limit=limit, filters=filters)


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
    "/register/resend-totp-setup",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "TOTP setup information retrieved"},
        400: {"model": ErrorResponse, "description": "User already completed setup or invalid credentials"},
        401: {"model": ErrorResponse, "description": "Invalid email or password"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Resend TOTP setup information",
    description="Allows users in pending_mfa status to retrieve their TOTP setup QR code again by providing credentials.",
)
async def resend_totp_setup(
    request: Dict[str, str],
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Resend TOTP setup information for users who missed it during registration.
    
    This endpoint allows users who are in 'pending_mfa' status to retrieve
    their TOTP QR code again by providing their email and password.
    
    Args:
        request: Dict with 'user_email' and 'user_password'
        user_service: Injected UserService instance
        
    Returns:
        TOTP setup information with QR code
        
    Raises:
        HTTPException 401: If credentials are invalid
        HTTPException 400: If user already completed setup
        HTTPException 404: If user not found
    """
    try:
        from app.api.v1.services.totp_service import TOTPService
        from app.api.v1.dependencies.services import get_totp_repository
        
        # Authenticate user first
        user_email = request.get('user_email')
        user_password = request.get('user_password')
        
        if not user_email or not user_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )
        
        # Verify credentials
        user_data = await user_service.authenticate_user(user_email, user_password)
        user_id = user_data['_id']
        registration_status = user_data.get('registration_status')
        
        # Check if user is in pending_mfa status
        if registration_status != 'pending_mfa':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="TOTP setup already completed or not required"
            )
        
        # Get TOTP secret
        totp_service = TOTPService()
        totp_repo = get_totp_repository()
        
        totp_secret_doc = await totp_repo.get_totp_secret_by_user_id(user_id)
        if not totp_secret_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="TOTP setup not found. Please contact support."
            )
        
        # Decrypt secret and regenerate QR code
        secret = totp_service.decrypt_secret(totp_secret_doc["secret_encrypted"])
        qr_code = totp_service.generate_qr_code(secret, user_email)
        otpauth_url = totp_service.generate_otpauth_url(secret, user_email)
        
        return {
            "success": True,
            "user_id": user_id,
            "user_email": user_email,
            "totp_setup": {
                "secret": secret,
                "qr_code": qr_code,
                "manual_entry_key": secret,
                "issuer": "MongoDB Microsite",
                "account_name": user_email,
                "otpauth_url": otpauth_url,
            },
            "message": "Scan the QR code with your authenticator app",
            "next_step": "verify_totp"
        }
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve TOTP setup: {str(e)}"
        )


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


# =============================================================================
# PROFILE ENDPOINTS
# =============================================================================

@router.get(
    "/profile",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Profile retrieved successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Get current user profile",
    description="Retrieve the profile of the currently logged-in user.",
)
async def get_profile(
    current_user: UserModel = Depends(get_current_active_user),
) -> UserProfileResponse:
    """
    Get the profile of the currently authenticated user.
    
    Returns:
        UserProfileResponse: User's profile information
    
    Raises:
        HTTPException: If user is not authenticated
    """
    try:
        return UserProfileResponse(
            id=current_user.id,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            user_email=current_user.user_email,
            company=current_user.company,
            job_function=current_user.job_function,
            business_phone=current_user.business_phone,
            country=current_user.country,
            is_admin=current_user.is_admin,
            totp_enabled=current_user.totp_enabled,
            registration_completed_at=current_user.registration_completed_at,
            created_at=current_user.created_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve profile: {str(e)}",
        )


@router.put(
    "/users/{user_id}/admin-status",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Admin status updated successfully"},
        400: {"model": ErrorResponse, "description": "Cannot change admin status for external users"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        403: {"model": ErrorResponse, "description": "Only admins can change admin status"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Toggle admin status for internal user",
    description="Admin can toggle admin status for internal users only.",
)
async def toggle_admin_status(
    user_id: str,
    is_admin: bool,
    current_user: UserModel = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Toggle admin status for a user (internal users only).
    
    Args:
        user_id: ID of the user to update
        is_admin: New admin status
        current_user: Current authenticated user (must be admin)
        user_service: User service instance
    
    Returns:
        Success message and updated user data
    """
    # Check if current user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can change admin status",
        )
    
    try:
        result = await user_service.toggle_admin_status(user_id, is_admin)
        return result
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


@router.delete(
    "/users/{user_id}",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "User deleted successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        403: {"model": ErrorResponse, "description": "Only admins can delete users"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Soft delete a user",
    description="Admin can soft delete a user. This marks the user as deleted and allows their email to be reused.",
)
async def delete_user(
    user_id: str,
    current_user: UserModel = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Soft delete a user (mark as deleted, allowing email reuse).
    
    Args:
        user_id: ID of the user to delete
        current_user: Current authenticated user (must be admin)
        user_service: User service instance
    
    Returns:
        Success message and deleted user data
    """
    # Check if current user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users",
        )
    
    try:
        result = await user_service.soft_delete_user(user_id)
        return result
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/users/{user_id}/block-status",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Block status updated successfully"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        403: {"model": ErrorResponse, "description": "Only admins can block users"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Block or unblock user access",
    description="Admin can block or unblock user access to the system.",
)
async def toggle_block_status(
    user_id: str,
    is_blocked: bool,
    current_user: UserModel = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """
    Block or unblock a user's access.
    
    Args:
        user_id: ID of the user to update
        is_blocked: New block status (True = blocked, False = active)
        current_user: Current authenticated user (must be admin)
        user_service: User service instance
    
    Returns:
        Success message and updated user data
    """
    # Check if current user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can block/unblock users",
        )
    
    try:
        result = await user_service.toggle_block_status(user_id, is_blocked)
        return result
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message,
        )


@router.put(
    "/profile",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Profile updated successfully"},
        400: {"model": ErrorResponse, "description": "Validation error"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Update current user profile",
    description="Update the profile of the currently logged-in user. Email cannot be updated.",
)
async def update_profile(
    profile_data: UserProfileUpdateRequest,
    current_user: UserModel = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    """
    Update the profile of the currently authenticated user.
    
    Only updates fields that are provided (partial update).
    Email field cannot be updated for security reasons.
    
    Args:
        profile_data: Fields to update
        current_user: Current authenticated user
        user_service: User service instance
    
    Returns:
        UserProfileResponse: Updated user profile
    
    Raises:
        HTTPException: If update fails or validation errors occur
    """
    try:
        # Build update data dictionary with only provided fields
        update_data = {}
        if profile_data.first_name is not None:
            update_data["first_name"] = profile_data.first_name
        if profile_data.last_name is not None:
            update_data["last_name"] = profile_data.last_name
        if profile_data.company is not None:
            update_data["company"] = profile_data.company
        if profile_data.job_function is not None:
            update_data["job_function"] = profile_data.job_function
        if profile_data.business_phone is not None:
            update_data["business_phone"] = profile_data.business_phone
        if profile_data.country is not None:
            update_data["country"] = profile_data.country
        
        # If no fields to update, return current profile
        if not update_data:
            return UserProfileResponse(
                id=current_user.id,
                first_name=current_user.first_name,
                last_name=current_user.last_name,
                user_email=current_user.user_email,
                company=current_user.company,
                job_function=current_user.job_function,
                business_phone=current_user.business_phone,
                country=current_user.country,
                is_admin=current_user.is_admin,
                totp_enabled=current_user.totp_enabled,
                registration_completed_at=current_user.registration_completed_at,
                created_at=current_user.created_at,
            )
        
        # Update user profile
        updated_user = await user_service.update_user_profile(
            user_id=current_user.id,
            update_data=update_data
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        return UserProfileResponse(
            id=updated_user.id,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            user_email=updated_user.user_email,
            company=updated_user.company,
            job_function=updated_user.job_function,
            business_phone=updated_user.business_phone,
            country=updated_user.country,
            is_admin=updated_user.is_admin,
            totp_enabled=updated_user.totp_enabled,
            registration_completed_at=updated_user.registration_completed_at,
            created_at=updated_user.created_at,
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )
