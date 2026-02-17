"""
Auth Service - Handles authentication and JWT token generation.
Updated to support TOTP verification during login.
"""

import jwt
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from app.core.config import settings
from app.api.v1.models.user import (
    SignInRequest,
    SignInResponse,
    VerifyLoginTOTPRequest,
    VerifyLoginTOTPResponse,
)
from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.repositories.totp_repository import TOTPRepository
from app.api.v1.services.totp_service import TOTPService
from app.api.v1.exceptions.user_exceptions import AuthenticationError
import bcrypt


class AuthService:
    """
    Service class for authentication operations.
    Handles user sign-in, JWT token generation, and TOTP verification.
    """
    
    # Temporary session tokens for TOTP login (use Redis in production)
    _temp_sessions: Dict[str, Dict[str, Any]] = {}

    def __init__(
        self,
        repository: UserRepository,
        totp_repository: Optional[TOTPRepository] = None
    ):
        """
        Initialize the service with repositories.
        
        Args:
            repository: UserRepository instance for data access
            totp_repository: TOTPRepository for TOTP verification (optional)
        """
        self._repository = repository
        self._totp_repository = totp_repository
        self._totp_service = TOTPService() if totp_repository else None

    # =========================================================================
    # SESSION TOKEN MANAGEMENT (FOR TOTP LOGIN)
    # =========================================================================
    
    def _generate_temp_session_token(self, user_id: str, user_email: str) -> str:
        """
        Generate temporary session token for TOTP verification.
        
        Args:
            user_id: User's ID
            user_email: User's email
            
        Returns:
            Temporary session token (expires in 5 minutes)
        """
        token = secrets.token_urlsafe(32)
        
        self._temp_sessions[token] = {
            "user_id": user_id,
            "user_email": user_email,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
        }
        
        return token
    
    def _get_temp_session(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get temporary session data.
        
        Args:
            token: Session token
            
        Returns:
            Session data if valid, None if expired or not found
        """
        if token not in self._temp_sessions:
            return None
        
        session = self._temp_sessions[token]
        
        # Check if expired
        if datetime.now(timezone.utc) > session["expires_at"]:
            del self._temp_sessions[token]
            return None
        
        return session
    
    def _delete_temp_session(self, token: str) -> None:
        """
        Delete temporary session token after use.
        
        Args:
            token: Session token to delete
        """
        if token in self._temp_sessions:
            del self._temp_sessions[token]
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain password against a hashed password using bcrypt.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Stored hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except Exception:
            return False

    def create_access_token(
        self,
        data: Dict[str, Any],
        expires_delta: timedelta | None = None,
    ) -> str:
        """
        Generate a JWT access token.
        
        Args:
            data: Payload data to encode in the token
            expires_delta: Optional custom expiration time
            
        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()
        
        # Set expiration time
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        # Add expiration and issued-at claims
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        })
        
        # Encode the JWT
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )
        
        return encoded_jwt

    def decode_token(self, token: str) -> Dict[str, Any]:
        """
        Decode and validate a JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            AuthenticationError: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token has expired")
        except jwt.InvalidTokenError:
            raise AuthenticationError("Invalid token")

    # =========================================================================
    # SERVICE METHODS
    # =========================================================================

    async def sign_in(self, request: SignInRequest) -> SignInResponse:
        """
        UPDATED: Authenticate a user and generate a JWT token.
        NOW checks MFA/registration status before allowing login.
        
        Processing Flow:
        1. Receive request at /sign_in
        2. Validate inputs (handled by Pydantic model)
        3. Look up user_email in Login_creds table
        4. Compare provided password with encrypted password using bcrypt
        5. If authentication fails, raise AuthenticationError
        6. Fetch user details from User table
        7. CHECK MFA STATUS (NEW) - Block if registration incomplete
        8. Generate JWT token with user_email, is_internal, is_admin
        9. Return success response with token
        
        Args:
            request: SignInRequest with email and password
            
        Returns:
            SignInResponse with access_token and user details
            OR
            SignInResponse with registration_incomplete flag if MFA pending
            
        Raises:
            AuthenticationError: If authentication fails
        """
        # Step 1 & 2: Request received and validated by Pydantic

        # Step 3: Look up user_email in Login_creds table
        user = await self._repository.get_user_by_email(request.user_email)
        if not user:
            # User email does not exist → authentication failed
            raise AuthenticationError("Invalid email or password")

        # Step 4: Get login credentials and compare password
        creds = await self._repository.get_login_creds(user["_id"])
        if not creds:
            # No credentials found → authentication failed
            raise AuthenticationError("Invalid email or password")

        # Compare provided password with encrypted password using bcrypt
        if not self.verify_password(request.user_password, creds["user_password"]):
            # Password mismatch → authentication failed
            raise AuthenticationError("Invalid email or password")

        # Step 5 & 6: Authentication successful, fetch user details
        user_email = user["user_email"]
        is_internal = user["is_internal"]
        is_admin = user["is_admin"]
        
        # Step 7: CHECK MFA STATUS (NEW) - Critical security check
        can_login = user.get("can_login", False)  # Default False - must explicitly enable
        registration_status = user.get("registration_status", "pending_mfa")  # Default pending
        account_active = user.get("account_active", False)  # Default False - must explicitly activate
        
        # Check if user is blocked (account not active but registration completed)
        if not account_active and registration_status == "completed":
            raise AuthenticationError("Your account has been blocked by an administrator. Please contact support for assistance.")
        
        # If registration is incomplete, block login and redirect to complete setup
        if not can_login or registration_status == "pending_mfa":
            return SignInResponse(
                success=False,
                registration_incomplete=True,
                registration_status=registration_status,
                redirect_to="/complete-registration",
                user_email=user_email,
                message="Please complete MFA setup to access your account",
            )
        
        # Step 8: CHECK TOTP STATUS (NEW) - Require TOTP verification if enabled
        totp_enabled = user.get("totp_enabled", False)
        
        if totp_enabled:
            # Generate temporary session token (NOT the final JWT)
            session_token = self._generate_temp_session_token(
                user_id=user["_id"],
                user_email=user_email
            )
            
            return SignInResponse(
                success=True,
                requires_totp=True,
                session_token=session_token,
                user_email=user_email,
                message="Enter TOTP code to continue",
            )

        # Step 9: Generate JWT token (for users WITHOUT TOTP)
        # JWT payload must include: id, user_email, is_internal, is_admin
        token_payload = {
            "sub": user_email,  # Subject (standard JWT claim)
            "id": user["_id"],
            "user_email": user_email,
            "is_internal": is_internal,
            "is_admin": is_admin,
        }
        
        access_token = self.create_access_token(data=token_payload)

        # Step 10: Return success response
        return SignInResponse(
            success=True,
            requires_totp=False,
            access_token=access_token,
            token_type="bearer",
            user_email=user_email,
            is_internal=is_internal,
            is_admin=is_admin,
            message="Login successful",
        )
    
    # =========================================================================
    # TOTP LOGIN VERIFICATION (NEW)
    # =========================================================================
    
    async def verify_totp_and_complete_login(
        self,
        session_token: str,
        totp_code: str
    ) -> VerifyLoginTOTPResponse:
        """
        Verify TOTP code and complete login.
        
        Args:
            session_token: Temporary session token from sign_in
            totp_code: 6-digit TOTP code from authenticator app
            
        Returns:
            VerifyLoginTOTPResponse with JWT access token
            
        Raises:
            ValueError: If session invalid or TOTP code wrong
            AuthenticationError: If TOTP not configured
        """
        # Validate repositories
        if not self._totp_repository or not self._totp_service:
            raise AuthenticationError("TOTP service not initialized")
        
        # Get session data
        session = self._get_temp_session(session_token)
        
        if not session:
            raise ValueError("Invalid or expired session")
        
        user_id = session["user_id"]
        user_email = session["user_email"]
        
        # Get user details
        user = await self._repository.get_user_by_id(user_id)
        
        if not user:
            raise AuthenticationError("User not found")
        
        # Get TOTP secret
        totp_secret_doc = await self._totp_repository.get_totp_secret_by_user_id(user_id)
        
        if not totp_secret_doc or not totp_secret_doc.get("is_verified"):
            raise ValueError("TOTP not configured for this user")
        
        # Decrypt secret
        secret = self._totp_service.decrypt_secret(
            totp_secret_doc["secret_encrypted"]
        )
        
        # Validate TOTP code
        if not self._totp_service.validate_totp_code(secret, totp_code):
            # Increment failed attempts
            await self._totp_repository.increment_verification_attempts(user_id)
            raise ValueError("Invalid code")
        
        # Reset verification attempts on success
        await self._totp_repository.reset_verification_attempts(user_id)
        
        # Update last used timestamp
        await self._repository.update_totp_last_used(user_id)
        
        # Delete temporary session token
        self._delete_temp_session(session_token)
        
        # Generate JWT token
        token_payload = {
            "sub": user_email,
            "id": user_id,
            "user_email": user_email,
            "is_internal": user.get("is_internal", False),
            "is_admin": user.get("is_admin", False),
        }
        
        access_token = self.create_access_token(data=token_payload)
        
        # Return response with JWT
        return VerifyLoginTOTPResponse(
            success=True,
            access_token=access_token,
            token_type="bearer",
            user_id=user_id,
            user_email=user_email,
            is_internal=user.get("is_internal", False),
            is_admin=user.get("is_admin", False),
            message="Login successful",
        )

