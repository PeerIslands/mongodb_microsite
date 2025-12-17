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
