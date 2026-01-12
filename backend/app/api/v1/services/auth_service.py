"""
Auth Service - Handles authentication and JWT token generation.
"""

import jwt
from datetime import datetime, timezone, timedelta
from typing import Any, Dict

from app.core.config import settings
from app.api.v1.models.user import SignInRequest, SignInResponse
from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.exceptions.user_exceptions import AuthenticationError
import bcrypt


class AuthService:
    """
    Service class for authentication operations.
    Handles user sign-in and JWT token generation.
    """

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
        Authenticate a user and generate a JWT token.
        
        Processing Flow:
        1. Receive request at /sign_in
        2. Validate inputs (handled by Pydantic model)
        3. Look up user_email in Login_creds table
        4. Compare provided password with encrypted password using bcrypt
        5. If authentication fails, raise AuthenticationError
        6. Fetch user details from User table
        7. Generate JWT token with user_email, is_internal, is_admin
        8. Return success response with token
        
        Args:
            request: SignInRequest with email and password
            
        Returns:
            SignInResponse with access_token and user details
            
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
        # Required fields: user_email, is_internal, is_admin
        user_email = user["user_email"]
        is_internal = user["is_internal"]
        is_admin = user["is_admin"]

        # Step 7: Generate JWT token
        # JWT payload must include: user_email, is_internal, is_admin
        token_payload = {
            "sub": user_email,  # Subject (standard JWT claim)
            "user_email": user_email,
            "is_internal": is_internal,
            "is_admin": is_admin,
        }
        
        access_token = self.create_access_token(data=token_payload)

        # Step 8: Return success response
        return SignInResponse(
            access_token=access_token,
            token_type="bearer",
            user_email=user_email,
            is_internal=is_internal,
            is_admin=is_admin,
        )

