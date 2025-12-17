"""
User Service - Business logic layer for user operations.
Handles validation, encryption, and orchestrates repository calls.
"""

import bcrypt
from typing import Any, Dict, List

from app.api.v1.models.user import UserCreateRequest, UserCreateResponse
from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.exceptions.user_exceptions import (
    UserAlreadyExistsError,
    UserNotFoundError,
    UserValidationError,
)


class UserService:
    """
    Service class for user-related business logic.
    Implements the processing flow for user registration.
    """

    # Domain for internal users
    INTERNAL_DOMAIN = "@peerislands.io.in"

    def __init__(self, repository: UserRepository):
        """
        Initialize the service with a repository.
        
        Args:
            repository: UserRepository instance for data access
        """
        self._repository = repository

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def is_internal_user(self, email: str) -> bool:
        """
        Check if user is an internal company user.
        
        Business Rule: Email ending with "@company.com" is considered internal.
        
        Args:
            email: User's email address
            
        Returns:
            True if user is internal, False otherwise
        """
        return email.lower().endswith(self.INTERNAL_DOMAIN)

    def encrypt_password(self, plain_password: str) -> str:
        """
        Encrypt password using bcrypt hashing algorithm.
        
        Args:
            plain_password: Plain text password
            
        Returns:
            Bcrypt hashed password string
        """
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain password against a hashed password.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Stored hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )

    # =========================================================================
    # SERVICE METHODS
    # =========================================================================

    async def create_user(self, request: UserCreateRequest) -> UserCreateResponse:
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
            request: UserCreateRequest with registration data
            
        Returns:
            UserCreateResponse with user_id, is_internal, and message
            
        Raises:
            UserAlreadyExistsError: If email already exists
        """
        # Step 1 & 2: Request received and validated by Pydantic

        # Step 3: Check if email already exists
        if await self._repository.email_exists(request.user_email):
            raise UserAlreadyExistsError(request.user_email)

        # Step 4: Check if user is internal
        is_internal = self.is_internal_user(request.user_email)

        # Step 5: Encrypt password (never store plain text)
        encrypted_password = self.encrypt_password(request.user_password)

        # Step 6: Generate ID and store in database
        user_id = self._repository.generate_id()
        
        await self._repository.create_user(
            user_id=user_id,
            first_name=request.first_name,
            last_name=request.last_name,
            user_email=request.user_email,
            is_internal=is_internal,
            encrypted_password=encrypted_password,
        )

        # Step 7: Return success response
        return UserCreateResponse(
            user_id=user_id,
            is_internal=is_internal,
            message="User registered successfully",
        )

    async def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        """
        Get a user by their ID.
        
        Args:
            user_id: The user's ID
            
        Returns:
            User data dictionary (excludes sensitive data)
            
        Raises:
            UserNotFoundError: If user not found
        """
        user = await self._repository.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)

        # Return user data without sensitive information
        return {
            "_id": user["_id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "user_email": user["user_email"],
            "is_internal": user["is_internal"],
            "is_admin": user["is_admin"],
            "created_at": user["created_at"],
        }

    async def get_all_users(
        self, skip: int = 0, limit: int = 100
    ) -> Dict[str, Any]:
        """
        Get all users with pagination.
        
        Args:
            skip: Number of users to skip
            limit: Maximum number of users to return
            
        Returns:
            Dictionary with total count and list of users
        """
        users = await self._repository.get_all_users(skip=skip, limit=limit)
        total = await self._repository.get_user_count()

        # Exclude sensitive data
        safe_users = [
            {
                "_id": u["_id"],
                "first_name": u["first_name"],
                "last_name": u["last_name"],
                "user_email": u["user_email"],
                "is_internal": u["is_internal"],
                "is_admin": u["is_admin"],
                "created_at": u["created_at"],
            }
            for u in users
        ]

        return {
            "total_users": total,
            "users": safe_users,
        }

    async def authenticate_user(
        self, email: str, password: str
    ) -> Dict[str, Any]:
        """
        Authenticate a user with email and password.
        
        Args:
            email: User's email address
            password: Plain text password
            
        Returns:
            User data if authentication successful
            
        Raises:
            UserNotFoundError: If user not found or password incorrect
        """
        user = await self._repository.get_user_by_email(email)
        if not user:
            raise UserNotFoundError(email)

        creds = await self._repository.get_login_creds(user["_id"])
        if not creds or not self.verify_password(password, creds["user_password"]):
            raise UserNotFoundError(email)  # Don't reveal if email exists

        return {
            "_id": user["_id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "user_email": user["user_email"],
            "is_internal": user["is_internal"],
            "is_admin": user["is_admin"],
        }

