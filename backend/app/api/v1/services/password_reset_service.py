"""
Password Reset Service - Handles password reset with TOTP verification.
"""

import secrets
import bcrypt
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta

from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.repositories.totp_repository import TOTPRepository
from app.api.v1.services.totp_service import TOTPService
from app.api.v1.exceptions.user_exceptions import UserNotFoundError


class PasswordResetService:
    """Service for password reset with TOTP verification."""
    
    # Reset tokens stored in memory (in production, use Redis)
    # Format: {token: {user_id, email, expires_at, verified}}
    _reset_tokens: Dict[str, Dict[str, Any]] = {}
    
    def __init__(
        self,
        user_repository: UserRepository,
        totp_repository: TOTPRepository
    ):
        """Initialize service with repositories."""
        self._user_repo = user_repository
        self._totp_repo = totp_repository
        self._totp_service = TOTPService()
    
    # =========================================================================
    # TOKEN MANAGEMENT
    # =========================================================================
    
    def _generate_reset_token(self) -> str:
        """Generate a secure random reset token."""
        return secrets.token_urlsafe(32)
    
    def _store_reset_token(
        self,
        token: str,
        user_id: str,
        user_email: str,
        verified: bool = False,
        expires_minutes: int = 60
    ) -> None:
        """Store reset token with metadata."""
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
        
        self._reset_tokens[token] = {
            "user_id": user_id,
            "user_email": user_email,
            "verified": verified,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        }
    
    def _get_reset_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get reset token data."""
        token_data = self._reset_tokens.get(token)
        
        if not token_data:
            return None
        
        # Check if expired
        if datetime.now(timezone.utc) > token_data["expires_at"]:
            del self._reset_tokens[token]
            return None
        
        return token_data
    
    def _mark_token_verified(self, token: str) -> None:
        """Mark reset token as verified."""
        if token in self._reset_tokens:
            self._reset_tokens[token]["verified"] = True
    
    def _delete_reset_token(self, token: str) -> None:
        """Delete reset token after use."""
        if token in self._reset_tokens:
            del self._reset_tokens[token]
    
    # =========================================================================
    # PASSWORD RESET FLOW
    # =========================================================================
    
    async def request_password_reset(self, user_email: str) -> Dict[str, Any]:
        """
        Initiate password reset request.
        
        Args:
            user_email: User's email address
            
        Returns:
            Response with totp_required flag and reset_token
        """
        # Get user by email
        user = await self._user_repo.get_user_by_email(user_email)
        
        # If user not found, return generic success (prevent email enumeration)
        if not user:
            # Generate fake token to prevent timing attacks
            fake_token = self._generate_reset_token()
            return {
                "success": True,
                "totp_required": False,
                "message": "If an account exists, reset instructions have been sent",
                "reset_token": fake_token,
            }
        
        user_id = user["_id"]
        totp_enabled = user.get("totp_enabled", False)
        
        # Generate reset token
        reset_token = self._generate_reset_token()
        
        # Store token
        self._store_reset_token(
            token=reset_token,
            user_id=user_id,
            user_email=user_email,
            verified=False,
            expires_minutes=60
        )
        
        if totp_enabled:
            # User has TOTP enabled - require TOTP verification
            return {
                "success": True,
                "totp_required": True,
                "message": "TOTP verification required for password reset",
                "reset_token": reset_token,
            }
        else:
            # User doesn't have TOTP - traditional email reset
            # TODO: Send email with reset link
            return {
                "success": True,
                "totp_required": False,
                "message": "Password reset link sent to email",
                "reset_token": reset_token,
            }
    
    async def verify_totp_for_reset(
        self,
        reset_token: str,
        totp_code: str
    ) -> Dict[str, Any]:
        """
        Verify TOTP code for password reset.
        
        Args:
            reset_token: Reset token from request step
            totp_code: 6-digit TOTP code
            
        Returns:
            Response with verified token
            
        Raises:
            ValueError: If token invalid or TOTP code wrong
        """
        # Get token data
        token_data = self._get_reset_token(reset_token)
        
        if not token_data:
            raise ValueError("Invalid or expired reset token")
        
        user_id = token_data["user_id"]
        
        # Get TOTP secret
        totp_secret_doc = await self._totp_repo.get_totp_secret_by_user_id(user_id)
        
        if not totp_secret_doc:
            raise ValueError("TOTP not configured for this user")
        
        # Decrypt secret
        secret = self._totp_service.decrypt_secret(
            totp_secret_doc["secret_encrypted"]
        )
        
        # Validate TOTP code
        if not self._totp_service.validate_totp_code(secret, totp_code):
            # Increment failed attempts
            await self._totp_repo.increment_verification_attempts(user_id)
            raise ValueError("Invalid code")
        
        # Mark token as verified
        self._mark_token_verified(reset_token)
        
        # Update last used timestamp
        await self._user_repo.update_totp_last_used(user_id)
        
        return {
            "success": True,
            "message": "TOTP verified successfully",
            "password_reset_token": reset_token,
            "expires_in": 600,  # 10 minutes to set new password
        }
    
    async def complete_password_reset(
        self,
        reset_token: str,
        new_password: str
    ) -> Dict[str, Any]:
        """
        Complete password reset with new password.
        
        Args:
            reset_token: Verified reset token
            new_password: New password
            
        Returns:
            Success response
            
        Raises:
            ValueError: If token invalid or not verified
        """
        # Get token data
        token_data = self._get_reset_token(reset_token)
        
        if not token_data:
            raise ValueError("Invalid or expired reset token")
        
        if not token_data.get("verified", False):
            raise ValueError("Token not verified. Please verify TOTP first.")
        
        user_id = token_data["user_id"]
        
        # Validate password
        if len(new_password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        
        # Hash new password
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(new_password.encode("utf-8"), salt)
        hashed_password = hashed.decode("utf-8")
        
        # Update password in login_creds collection
        await self._user_repo.db["login_creds"].update_one(
            {"_id": user_id},
            {"$set": {"user_password": hashed_password}}
        )
        
        # Delete the reset token
        self._delete_reset_token(reset_token)
        
        # TODO: Invalidate all user sessions (implement session management)
        sessions_invalidated = 0
        
        # TODO: Send email notification of password change
        
        return {
            "success": True,
            "message": "Password reset successfully",
            "sessions_invalidated": sessions_invalidated,
        }

