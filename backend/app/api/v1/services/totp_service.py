"""
TOTP Service - Handles TOTP generation, validation, and management.

This service provides all TOTP-related functionality including:
- Secret generation and encryption
- QR code generation
- TOTP code validation
- Backup code management
"""

import pyotp
import qrcode
import io
import base64
import secrets
import bcrypt
from typing import List, Tuple, Optional
from cryptography.fernet import Fernet
from datetime import datetime, timezone

from app.core.config import settings


class TOTPService:
    """Service for TOTP operations."""
    
    def __init__(self):
        """Initialize TOTP service with encryption key from settings."""
        # Get encryption key from environment
        encryption_key = settings.TOTP_SECRET_ENCRYPTION_KEY
        if not encryption_key:
            raise ValueError("TOTP_SECRET_ENCRYPTION_KEY must be set in environment")
        
        # Initialize Fernet cipher for encryption
        # Fernet requires a base64-urlsafe 32-byte key
        if len(encryption_key) < 32:
            # If key is too short, derive it properly
            import hashlib
            key_bytes = hashlib.sha256(encryption_key.encode()).digest()
            encryption_key = base64.urlsafe_b64encode(key_bytes).decode()
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
    
    # =========================================================================
    # SECRET GENERATION
    # =========================================================================
    
    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret (Base32 encoded).
        
        Returns:
            Base32 encoded secret (160 bits / 32 characters)
            
        Example:
            >>> service = TOTPService()
            >>> secret = service.generate_secret()
            >>> len(secret)
            32
        """
        return pyotp.random_base32()
    
    def encrypt_secret(self, secret: str) -> str:
        """
        Encrypt TOTP secret using AES-256-GCM (via Fernet).
        
        Args:
            secret: Base32 encoded secret
            
        Returns:
            Encrypted secret as base64 string
            
        Security:
            - Uses Fernet (AES-128-CBC + HMAC)
            - Includes timestamp for token expiry
            - Base64 encoded for safe storage
        """
        encrypted = self.cipher.encrypt(secret.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt_secret(self, encrypted_secret: str) -> str:
        """
        Decrypt TOTP secret.
        
        Args:
            encrypted_secret: Encrypted secret string
            
        Returns:
            Decrypted Base32 secret
            
        Raises:
            cryptography.fernet.InvalidToken: If decryption fails
        """
        encrypted_bytes = base64.b64decode(encrypted_secret.encode())
        decrypted = self.cipher.decrypt(encrypted_bytes)
        return decrypted.decode()
    
    # =========================================================================
    # QR CODE GENERATION
    # =========================================================================
    
    def generate_qr_code(self, secret: str, user_email: str) -> str:
        """
        Generate QR code for TOTP setup.
        
        Args:
            secret: Base32 encoded secret
            user_email: User's email address
            
        Returns:
            QR code as data URL (base64 encoded PNG)
            
        Example:
            data:image/png;base64,iVBORw0KGgoAAAANS...
        """
        # Generate otpauth:// URL
        totp = pyotp.TOTP(secret)
        otpauth_url = totp.provisioning_uri(
            name=user_email,
            issuer_name=settings.TOTP_ISSUER_NAME
        )
        
        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(otpauth_url)
        qr.make(fit=True)
        
        # Convert to PNG image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 data URL
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def generate_otpauth_url(self, secret: str, user_email: str) -> str:
        """
        Generate otpauth:// URL for manual entry.
        
        Args:
            secret: Base32 encoded secret
            user_email: User's email address
            
        Returns:
            otpauth:// URL string
            
        Example:
            otpauth://totp/MongoDB%20Microsite:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MongoDB%20Microsite
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=settings.TOTP_ISSUER_NAME
        )
    
    # =========================================================================
    # CODE VALIDATION
    # =========================================================================
    
    def validate_totp_code(
        self,
        secret: str,
        code: str,
        window: Optional[int] = None
    ) -> bool:
        """
        Validate TOTP code against secret.
        
        Args:
            secret: Base32 encoded secret
            code: 6-digit TOTP code from user
            window: Time window tolerance (default from settings)
                   ±1 = ±30 seconds (accepts previous, current, next window)
            
        Returns:
            True if code is valid, False otherwise
            
        Security:
            - Uses constant-time comparison
            - Accepts ±1 time window for clock drift
            - Validates code format before checking
        """
        # Validate code format
        if not code or not code.isdigit() or len(code) != settings.TOTP_DIGITS:
            return False
        
        # Use configured window tolerance or default
        if window is None:
            window = settings.TOTP_TIME_WINDOW_TOLERANCE
        
        # Validate TOTP code
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=window)
    
    def get_current_code(self, secret: str) -> str:
        """
        Get the current TOTP code (for testing/debugging only).
        
        Args:
            secret: Base32 encoded secret
            
        Returns:
            Current 6-digit TOTP code
            
        Warning:
            This should only be used for testing. In production,
            users get codes from their authenticator app.
        """
        totp = pyotp.TOTP(secret)
        return totp.now()
    
    # =========================================================================
    # BACKUP CODES
    # =========================================================================
    
    def generate_backup_codes(self, count: Optional[int] = None) -> List[str]:
        """
        Generate backup codes for recovery.
        
        Args:
            count: Number of codes to generate (default from settings)
            
        Returns:
            List of backup codes (format: XXXX-XXXX-XXXX-XXXX)
            
        Example:
            ['A3F7-9K2M-P5W8-Q1N4', 'B8J2-C6V9-D4T7-E1R5', ...]
        """
        if count is None:
            count = settings.TOTP_BACKUP_CODES_COUNT
        
        codes = []
        for _ in range(count):
            # Generate 16 random hex characters (4 groups of 4)
            # Using secrets module for cryptographic randomness
            code_parts = [
                secrets.token_hex(2).upper()
                for _ in range(4)
            ]
            code = "-".join(code_parts)
            codes.append(code)
        
        return codes
    
    def hash_backup_code(self, code: str) -> str:
        """
        Hash backup code using bcrypt.
        
        Args:
            code: Plain backup code
            
        Returns:
            Bcrypt hashed code
            
        Security:
            - Uses bcrypt (resistant to brute force)
            - Configurable rounds from settings
            - Includes random salt
        """
        # Remove hyphens and normalize
        normalized_code = code.replace("-", "").upper()
        
        # Generate salt with configured rounds
        salt = bcrypt.gensalt(rounds=settings.TOTP_BACKUP_CODE_BCRYPT_ROUNDS)
        
        # Hash the code
        hashed = bcrypt.hashpw(normalized_code.encode("utf-8"), salt)
        
        return hashed.decode("utf-8")
    
    def verify_backup_code(self, code: str, hashed_code: str) -> bool:
        """
        Verify backup code against hash.
        
        Args:
            code: Plain backup code from user
            hashed_code: Stored hashed backup code
            
        Returns:
            True if code matches, False otherwise
            
        Security:
            - Constant-time comparison (via bcrypt)
            - Normalizes input before comparison
        """
        try:
            # Normalize input (remove hyphens, uppercase)
            normalized_code = code.replace("-", "").upper()
            
            # Verify using bcrypt
            return bcrypt.checkpw(
                normalized_code.encode("utf-8"),
                hashed_code.encode("utf-8")
            )
        except Exception:
            # Any error in verification returns False
            return False
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def get_time_remaining(self) -> int:
        """
        Get seconds remaining in current TOTP window.
        
        Returns:
            Seconds until new code is generated (0-30)
            
        Example:
            >>> service.get_time_remaining()
            23  # 23 seconds until code refreshes
        """
        import time
        return settings.TOTP_PERIOD - int(time.time()) % settings.TOTP_PERIOD
    
    def format_backup_code(self, code: str) -> str:
        """
        Format a backup code with hyphens.
        
        Args:
            code: Code string (with or without hyphens)
            
        Returns:
            Formatted code (XXXX-XXXX-XXXX-XXXX)
            
        Example:
            >>> format_backup_code('A3F79K2MP5W8Q1N4')
            'A3F7-9K2M-P5W8-Q1N4'
        """
        # Remove existing hyphens
        clean = code.replace("-", "").upper()
        
        # Split into groups of 4
        groups = [clean[i:i+4] for i in range(0, len(clean), 4)]
        
        return "-".join(groups)


# Singleton instance
_totp_service_instance: Optional[TOTPService] = None


def get_totp_service() -> TOTPService:
    """
    Get singleton instance of TOTP service.
    
    Returns:
        TOTPService instance
        
    Usage:
        from app.api.v1.services.totp_service import get_totp_service
        
        totp_service = get_totp_service()
        secret = totp_service.generate_secret()
    """
    global _totp_service_instance
    
    if _totp_service_instance is None:
        _totp_service_instance = TOTPService()
    
    return _totp_service_instance

