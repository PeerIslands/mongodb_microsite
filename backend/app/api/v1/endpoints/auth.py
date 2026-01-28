"""
Authentication Endpoints
========================
Handles user authentication and token generation.

Endpoints:
- POST /sign_in - Authenticate user and generate JWT token
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.models.user import (
    SignInRequest,
    SignInResponse,
    VerifyLoginTOTPRequest,
    VerifyLoginTOTPResponse,
    ErrorResponse,
)
from app.api.v1.services.auth_service import AuthService
from app.api.v1.dependencies.services import get_auth_service
from app.api.v1.exceptions.user_exceptions import AuthenticationError


router = APIRouter()


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/sign_in",
    response_model=SignInResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Authentication successful"},
        401: {"model": ErrorResponse, "description": "Invalid email or password"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
    summary="Sign in user",
    description="Authenticates a user and returns a JWT access token.",
)
async def sign_in(
    request: SignInRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> SignInResponse:
    """
    Authenticate a user and generate a JWT token.
    
    Processing Flow:
    1. Receive request at /sign_in
    2. Validate inputs (user_email and user_password must be present)
    3. Look up user_email in Login_creds table
    4. If user_email does not exist → authentication failed (401)
    5. Compare provided password with encrypted password using bcrypt
    6. If password mismatch → authentication failed (401)
    7. Fetch user details from User table (user_email, is_internal, is_admin)
    8. Generate JWT token with payload containing user_email, is_internal, is_admin
    9. Return success response with access_token, token_type, user details
    
    Args:
        request: SignInRequest containing user_email and user_password
        auth_service: Injected AuthService instance
        
    Returns:
        SignInResponse with:
        - access_token: JWT token
        - token_type: "bearer"
        - user_email: User's email
        - is_internal: Whether user is internal
        - is_admin: Whether user is admin
        
    Raises:
        HTTPException 401: If authentication fails (invalid email or password)
    """
    try:
        # Delegate authentication to the service layer
        return await auth_service.sign_in(request)
    except AuthenticationError as e:
        # Return 401 Unauthorized with message: "Invalid email or password"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/verify-login-totp",
    response_model=VerifyLoginTOTPResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "TOTP verified, login complete"},
        400: {"model": ErrorResponse, "description": "Invalid TOTP code or session"},
        401: {"model": ErrorResponse, "description": "Authentication failed"},
    },
    summary="Verify TOTP code for login",
    description="Verifies TOTP code and completes login by issuing JWT token.",
)
async def verify_login_totp(
    request: VerifyLoginTOTPRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> VerifyLoginTOTPResponse:
    """
    Verify TOTP code and complete login.
    
    This endpoint is called after /sign_in returns requires_totp=true.
    User must provide the 6-digit code from their authenticator app.
    
    Processing Flow:
    1. Validate temporary session token
    2. Get user's TOTP secret from database
    3. Decrypt TOTP secret
    4. Validate provided TOTP code
    5. Generate JWT access token
    6. Return JWT to complete login
    
    Args:
        request: VerifyLoginTOTPRequest with session_token and totp_code
        auth_service: Injected AuthService instance
        
    Returns:
        VerifyLoginTOTPResponse with JWT access token
        
    Raises:
        HTTPException 400: If TOTP code invalid or session expired
        HTTPException 401: If authentication fails
    """
    try:
        return await auth_service.verify_totp_and_complete_login(
            session_token=request.session_token,
            totp_code=request.totp_code,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )

