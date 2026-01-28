"""
TOTP Repository - Data access layer for TOTP secrets.

Handles database operations for TOTP secrets and backup codes.
"""

import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.database import get_database
from app.api.v1.models.user import TOTPSecretModel


class TOTPRepository:
    """Repository for TOTP secrets and backup codes."""
    
    COLLECTION_NAME = "totp_secrets"
    
    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize repository with database connection.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.collection = db[self.COLLECTION_NAME]
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def generate_id(self) -> str:
        """Generate a unique ID for TOTP secret."""
        return str(uuid.uuid4())
    
    # =========================================================================
    # CREATE OPERATIONS
    # =========================================================================
    
    async def create_totp_secret(
        self,
        user_id: str,
        user_email: str,
        encrypted_secret: str,
        encryption_key_id: str = "key-v1"
    ) -> str:
        """
        Create a new TOTP secret record.
        
        Args:
            user_id: User's ID
            user_email: User's email
            encrypted_secret: Encrypted Base32 secret
            encryption_key_id: Which encryption key was used
            
        Returns:
            Created TOTP secret ID
            
        Note:
            - Secret should already be encrypted before calling this
            - is_verified starts as False
            - backup_codes starts as empty list
        """
        secret_id = self.generate_id()
        
        model = TOTPSecretModel(
            id=secret_id,
            user_id=user_id,
            user_email=user_email,
            secret_encrypted=encrypted_secret,
            encryption_key_id=encryption_key_id,
            is_verified=False,
            verification_attempts=0,
            backup_codes=[],
        )
        
        await self.collection.insert_one(model.to_dict())
        
        return secret_id
    
    # =========================================================================
    # READ OPERATIONS
    # =========================================================================
    
    async def get_totp_secret_by_user_id(
        self,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get TOTP secret by user ID.
        
        Args:
            user_id: User's ID
            
        Returns:
            TOTP secret document or None if not found
        """
        return await self.collection.find_one({"user_id": user_id})
    
    async def get_totp_secret_by_email(
        self,
        user_email: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get TOTP secret by email.
        
        Args:
            user_email: User's email
            
        Returns:
            TOTP secret document or None if not found
        """
        return await self.collection.find_one({"user_email": user_email})
    
    async def totp_exists_for_user(self, user_id: str) -> bool:
        """
        Check if TOTP secret exists for user.
        
        Args:
            user_id: User's ID
            
        Returns:
            True if TOTP secret exists, False otherwise
        """
        count = await self.collection.count_documents({"user_id": user_id})
        return count > 0
    
    # =========================================================================
    # UPDATE OPERATIONS
    # =========================================================================
    
    async def increment_verification_attempts(self, user_id: str) -> None:
        """
        Increment failed verification attempt counter.
        
        Args:
            user_id: User's ID
        """
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$inc": {"verification_attempts": 1},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
    
    async def reset_verification_attempts(self, user_id: str) -> None:
        """
        Reset verification attempts counter (after successful verification).
        
        Args:
            user_id: User's ID
        """
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "verification_attempts": 0,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    async def complete_totp_setup(
        self,
        user_id: str,
        backup_codes_hashed: List[Dict[str, Any]]
    ) -> None:
        """
        Mark TOTP setup as complete and store backup codes.
        
        Args:
            user_id: User's ID
            backup_codes_hashed: List of backup code dicts with hashes
                Format: [{"code_hash": "...", "is_used": False, "used_at": None}, ...]
        """
        now = datetime.now(timezone.utc).isoformat()
        
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "is_verified": True,
                    "setup_completed_at": now,
                    "backup_codes": backup_codes_hashed,
                    "verification_attempts": 0,  # Reset on success
                    "updated_at": now
                }
            }
        )
    
    async def acknowledge_backup_codes(
        self,
        user_id: str,
        downloaded: bool = False
    ) -> None:
        """
        Mark that user has acknowledged/saved backup codes.
        
        Args:
            user_id: User's ID
            downloaded: Whether codes were downloaded
        """
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "backup_codes_acknowledged": True,
                    "backup_codes_downloaded": downloaded,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    async def use_backup_code(
        self,
        user_id: str,
        code_index: int
    ) -> None:
        """
        Mark a backup code as used.
        
        Args:
            user_id: User's ID
            code_index: Index of the backup code in the array
        """
        now = datetime.now(timezone.utc).isoformat()
        
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"backup_codes.{code_index}.is_used": True,
                    f"backup_codes.{code_index}.used_at": now,
                    "updated_at": now
                }
            }
        )
    
    async def regenerate_backup_codes(
        self,
        user_id: str,
        new_backup_codes_hashed: List[Dict[str, Any]]
    ) -> None:
        """
        Replace all backup codes with new ones.
        
        Args:
            user_id: User's ID
            new_backup_codes_hashed: List of new backup code dicts
        """
        await self.collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "backup_codes": new_backup_codes_hashed,
                    "backup_codes_acknowledged": False,  # User needs to save new ones
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    # =========================================================================
    # DELETE OPERATIONS
    # =========================================================================
    
    async def delete_totp_secret(self, user_id: str) -> bool:
        """
        Delete TOTP secret for user (when disabling MFA).
        
        Args:
            user_id: User's ID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self.collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0
    
    # =========================================================================
    # VALIDATION HELPERS
    # =========================================================================
    
    async def get_unused_backup_codes(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all unused backup codes for a user.
        
        Args:
            user_id: User's ID
            
        Returns:
            List of unused backup code dicts
        """
        secret_doc = await self.get_totp_secret_by_user_id(user_id)
        
        if not secret_doc or "backup_codes" not in secret_doc:
            return []
        
        # Filter for unused codes
        return [
            code for code in secret_doc["backup_codes"]
            if not code.get("is_used", False)
        ]
    
    async def get_remaining_backup_code_count(self, user_id: str) -> int:
        """
        Get count of remaining (unused) backup codes.
        
        Args:
            user_id: User's ID
            
        Returns:
            Number of unused backup codes
        """
        unused_codes = await self.get_unused_backup_codes(user_id)
        return len(unused_codes)
    
    # =========================================================================
    # STATISTICS
    # =========================================================================
    
    async def get_total_totp_users(self) -> int:
        """Get total number of users with TOTP enabled."""
        return await self.collection.count_documents({"is_verified": True})
    
    async def get_pending_setup_count(self) -> int:
        """Get number of users with pending TOTP setup."""
        return await self.collection.count_documents({"is_verified": False})

