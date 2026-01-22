"""
User Service - Business logic layer for user operations.
Handles validation, encryption, and orchestrates repository calls.
Updated to support mandatory MFA/TOTP during registration.
"""

import bcrypt
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from app.api.v1.models.user import (
    UserCreateRequest,
    UserCreateResponse,
    TOTPSetupData,
    TOTPVerificationRequest,
    TOTPVerificationResponse,
)
from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.repositories.totp_repository import TOTPRepository
from app.api.v1.services.totp_service import TOTPService
from app.api.v1.exceptions.user_exceptions import (
    UserAlreadyExistsError,
    UserNotFoundError,
    UserValidationError,
)


class UserService:
    """
    Service class for user-related business logic.
    Implements the processing flow for user registration with mandatory MFA.
    """

    # Domain for internal users
    INTERNAL_DOMAIN = "@peerislands.io"

    def __init__(
        self,
        repository: UserRepository,
        totp_repository: Optional[TOTPRepository] = None
    ):
        """
        Initialize the service with repositories and TOTP service.
        
        Args:
            repository: UserRepository instance for data access
            totp_repository: TOTPRepository for TOTP secrets (optional for backwards compat)
        """
        self._repository = repository
        self._totp_repository = totp_repository
        self._totp_service = TOTPService()

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
        UPDATED: Register a new user with mandatory MFA setup.
        
        New Processing Flow:
        1. Validate inputs (Pydantic)
        2. Check if email exists
        3. Determine internal status
        4. Encrypt password
        5. Generate TOTP secret (NEW)
        6. Generate QR code (NEW)
        7. Create user (pending_mfa status)
        8. Store TOTP secret (encrypted)
        9. Return response with TOTP setup data
        
        Args:
            request: UserCreateRequest with registration data
            
        Returns:
            UserCreateResponse with TOTP setup information
            
        Raises:
            UserAlreadyExistsError: If email already exists
            ValueError: If TOTP repository not initialized
        """
        # Validate TOTP repository is available
        if not self._totp_repository:
            raise ValueError("TOTP repository not initialized")
        
        # Steps 1-2: Validate and check email
        if await self._repository.email_exists(request.user_email):
            raise UserAlreadyExistsError(request.user_email)

        # Step 3: Check if internal
        is_internal = self.is_internal_user(request.user_email)

        # Step 4: Encrypt password
        encrypted_password = self.encrypt_password(request.user_password)

        # Step 5: Generate TOTP secret (NEW)
        totp_secret = self._totp_service.generate_secret()

        # Step 6: Generate QR code (NEW)
        qr_code = self._totp_service.generate_qr_code(
            totp_secret,
            request.user_email
        )
        otpauth_url = self._totp_service.generate_otpauth_url(
            totp_secret,
            request.user_email
        )

        # Step 7: Create user (pending_mfa status)
        user_id = self._repository.generate_id()
        
        await self._repository.create_user(
            user_id=user_id,
            first_name=request.first_name,
            last_name=request.last_name,
            user_email=request.user_email,
            company=request.company,
            job_function=request.job_function,
            business_phone=request.business_phone,
            country=request.country,
            is_internal=is_internal,
            encrypted_password=encrypted_password,
        )

        # Step 8: Store TOTP secret (encrypted)
        encrypted_secret = self._totp_service.encrypt_secret(totp_secret)
        
        await self._totp_repository.create_totp_secret(
            user_id=user_id,
            user_email=request.user_email,
            encrypted_secret=encrypted_secret,
        )

        # Step 9: Return response with TOTP setup
        return UserCreateResponse(
            user_id=user_id,
            user_email=request.user_email,
            is_internal=is_internal,
            registration_status="pending_mfa",
            account_active=False,
            totp_setup=TOTPSetupData(
                secret=totp_secret,  # Return plain for initial setup
                qr_code=qr_code,
                manual_entry_key=totp_secret,
                issuer="MongoDB Microsite",
                account_name=request.user_email,
                otpauth_url=otpauth_url,
            ),
            message="Account created. Complete MFA setup to activate account.",
            next_step="verify_totp",
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
            "company": user.get("company", ""),
            "job_function": user.get("job_function", ""),
            "business_phone": user.get("business_phone", ""),
            "country": user.get("country", ""),
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
        UPDATED: Authenticate a user with email and password.
        NOW includes registration status and MFA fields.
        
        Args:
            email: User's email address
            password: Plain text password
            
        Returns:
            User data if authentication successful (includes MFA status)
            
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
            # MFA fields (NEW)
            "totp_enabled": user.get("totp_enabled", False),
            "registration_status": user.get("registration_status", "completed"),
            "can_login": user.get("can_login", True),
            "account_active": user.get("account_active", True),
        }
    
    # =========================================================================
    # MFA/TOTP METHODS (NEW)
    # =========================================================================
    
    async def verify_totp_and_complete_registration(
        self,
        user_id: str,
        totp_code: str
    ) -> TOTPVerificationResponse:
        """
        Verify TOTP code and complete user registration.
        
        Args:
            user_id: User ID
            totp_code: 6-digit TOTP code from authenticator app
            
        Returns:
            TOTPVerificationResponse with backup codes
            
        Raises:
            UserNotFoundError: If user not found
            ValueError: If TOTP code is invalid or repository not initialized
        """
        # Validate TOTP repository
        if not self._totp_repository:
            raise ValueError("TOTP repository not initialized")
        
        # Get user and TOTP secret
        user = await self._repository.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        
        totp_secret_doc = await self._totp_repository.get_totp_secret_by_user_id(user_id)
        if not totp_secret_doc:
            raise ValueError("TOTP secret not found")
        
        # Decrypt secret
        secret = self._totp_service.decrypt_secret(
            totp_secret_doc["secret_encrypted"]
        )
        
        # Debug logging
        print(f"[DEBUG] TOTP Verification - User ID: {user_id}")
        print(f"[DEBUG] Code provided: {totp_code}")
        print(f"[DEBUG] Code length: {len(totp_code)}")
        print(f"[DEBUG] Code is digits: {totp_code.isdigit()}")
        print(f"[DEBUG] Current valid code: {self._totp_service.get_current_code(secret)}")
        
        # Validate TOTP code
        is_valid = self._totp_service.validate_totp_code(secret, totp_code)
        print(f"[DEBUG] Validation result: {is_valid}")
        
        if not is_valid:
            # Increment failed attempts
            await self._totp_repository.increment_verification_attempts(user_id)
            raise ValueError(f"Invalid TOTP code. Please ensure your device time is synchronized and try again.")
        
        # Generate backup codes
        backup_codes = self._totp_service.generate_backup_codes()
        backup_codes_hashed = [
            {
                "code_hash": self._totp_service.hash_backup_code(code),
                "is_used": False,
                "used_at": None
            }
            for code in backup_codes
        ]
        
        # Update user: activate account
        await self._repository.activate_user_account(user_id)
        
        # Update TOTP secret: mark as verified, store backup codes
        await self._totp_repository.complete_totp_setup(
            user_id=user_id,
            backup_codes_hashed=backup_codes_hashed
        )
        
        # Get updated user data
        updated_user = await self._repository.get_user_by_id(user_id)
        
        # Return response
        return TOTPVerificationResponse(
            success=True,
            message="MFA setup complete! Your account is now active.",
            user={
                "user_id": user_id,
                "email": updated_user["user_email"],
                "registration_status": "completed",
                "account_active": True,
                "can_login": True,
                "totp_enabled": True,
            },
            backup_codes=backup_codes,  # Plain codes for user to save
            next_step="save_backup_codes",
        )
    
    async def acknowledge_backup_codes(
        self,
        user_id: str,
        downloaded: bool = False
    ) -> bool:
        """
        Mark that user has acknowledged/saved backup codes.
        
        Args:
            user_id: User ID
            downloaded: Whether codes were downloaded
            
        Returns:
            True if successful
            
        Raises:
            ValueError: If TOTP repository not initialized
        """
        if not self._totp_repository:
            raise ValueError("TOTP repository not initialized")
        
        await self._totp_repository.acknowledge_backup_codes(
            user_id=user_id,
            downloaded=downloaded
        )
        
        return True
    
    async def update_user_profile(
        self,
        user_id: str,
        update_data: Dict[str, Any]
    ) -> Optional[Any]:
        """
        Update user profile information.
        
        Args:
            user_id: ID of the user to update
            update_data: Dictionary of fields to update
        
        Returns:
            Updated user object or None if user not found
        
        Raises:
            UserNotFoundError: If user doesn't exist
            ValueError: If update_data contains invalid fields
        """
        # Prevent updating email through this method
        if "user_email" in update_data:
            raise ValueError("Email cannot be updated through profile update")
        
        # Prevent updating security/system fields
        protected_fields = [
            "_id", "id", "user_password", "totp_secret", 
            "is_admin", "is_internal", "totp_enabled",
            "registration_status", "account_active", "can_login",
            "created_at", "totp_setup_at", "registration_completed_at"
        ]
        
        for field in protected_fields:
            if field in update_data:
                raise ValueError(f"Field '{field}' cannot be updated")
        
        # Update user in repository
        updated_user = await self._repository.update_user(
            user_id=user_id,
            update_data=update_data
        )
        
        if not updated_user:
            raise UserNotFoundError(f"User with ID {user_id} not found")
        
        return updated_user

