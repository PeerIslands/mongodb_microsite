"""
User Repository - Data access layer for user operations.
Handles all database operations for User and LoginCreds tables.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.v1.models.user import UserModel, LoginCredsModel
from app.api.v1.exceptions.user_exceptions import UserAlreadyExistsError, UserNotFoundError


class UserRepository:
    """
    Repository for user data operations.
    Uses MongoDB for persistent storage.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize repository with MongoDB database.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.users_collection = db["users"]
        self.login_creds_collection = db["login_creds"]

    def generate_id(self) -> str:
        """Generate a unique user ID."""
        return str(uuid.uuid4())

    async def email_exists(self, email: str) -> bool:
        """
        Check if email already exists in the database (excluding deleted users).
        
        Args:
            email: Email address to check
            
        Returns:
            True if email exists and is not deleted, False otherwise
        """
        result = await self.users_collection.find_one(
            {
                "user_email": {"$regex": f"^{email}$", "$options": "i"},
                "is_deleted": {"$ne": True}  # Exclude deleted users
            }
        )
        return result is not None

    async def create_user(
        self,
        user_id: str,
        first_name: str,
        last_name: str,
        user_email: str,
        company: str,
        job_function: str,
        business_phone: str,
        country: str,
        is_internal: bool,
        encrypted_password: str,
    ) -> str:
        """
        UPDATED: Create a new user with MFA pending status.
        
        Args:
            user_id: Unique user identifier
            first_name: User's first name
            last_name: User's last name
            user_email: User's email address
            company: User's company name
            job_function: User's job function
            business_phone: User's business phone number
            country: User's country
            is_internal: Whether user is internal
            encrypted_password: Bcrypt hashed password
            
        Returns:
            The created user's ID
            
        Raises:
            UserAlreadyExistsError: If email already exists
            
        Note:
            - User starts in "pending_mfa" status
            - account_active and can_login are False
            - Must complete MFA setup to activate account
        """
        # Check for existing email
        if await self.email_exists(user_email):
            raise UserAlreadyExistsError(user_email)

        now = datetime.now(timezone.utc)

        # Create User model with MFA pending status
        user = UserModel(
            _id=user_id,
            first_name=first_name,
            last_name=last_name,
            user_email=user_email,
            company=company,
            job_function=job_function,
            business_phone=business_phone,
            country=country,
            is_internal=is_internal,
            is_admin=False,
            # MFA fields - new user starts with MFA pending
            totp_enabled=False,
            totp_setup_at=None,
            totp_last_used=None,
            # Registration status - pending MFA setup
            registration_status="pending_mfa",
            registration_started_at=now,
            registration_completed_at=None,
            # Account access - blocked until MFA setup
            account_active=False,
            can_login=False,
            # Soft delete - new user is not deleted
            is_deleted=False,
            deleted_at=None,
            original_email=None,
            created_at=now,
        )

        # Create LoginCreds model
        login_creds = LoginCredsModel(
            _id=user_id,
            user_email=user_email,
            user_password=encrypted_password,
            created_at=now,
        )

        # Insert into MongoDB collections
        await self.users_collection.insert_one(user.to_dict())
        await self.login_creds_collection.insert_one(login_creds.to_dict())

        return user_id

    async def create_internal_sso_user(
        self,
        user_id: str,
        first_name: str,
        last_name: str,
        user_email: str,
        company: str,
        job_function: str,
        business_phone: str,
        country: str,
        encrypted_password: str,
    ) -> str:
        """
        JIT provision an internal user who signed in with Azure AD (no password login).

        Account is active with registration completed; TOTP is not used for SSO users.
        """
        if await self.email_exists(user_email):
            raise UserAlreadyExistsError(user_email)

        now = datetime.now(timezone.utc)

        user = UserModel(
            _id=user_id,
            first_name=first_name,
            last_name=last_name,
            user_email=user_email,
            company=company,
            job_function=job_function,
            business_phone=business_phone,
            country=country,
            is_internal=True,
            is_admin=False,
            totp_enabled=False,
            totp_setup_at=None,
            totp_last_used=None,
            registration_status="completed",
            registration_started_at=now,
            registration_completed_at=now,
            account_active=True,
            can_login=True,
            is_deleted=False,
            deleted_at=None,
            original_email=None,
            created_at=now,
        )

        login_creds = LoginCredsModel(
            _id=user_id,
            user_email=user_email,
            user_password=encrypted_password,
            created_at=now,
        )

        await self.users_collection.insert_one(user.to_dict())
        await self.login_creds_collection.insert_one(login_creds.to_dict())

        return user_id

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by their ID.
        
        Args:
            user_id: The user's ID
            
        Returns:
            User data dictionary if found, None otherwise
        """
        return await self.users_collection.find_one({"_id": user_id})

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by their email address (excluding deleted users).
        
        Args:
            email: The user's email address
            
        Returns:
            User data dictionary if found and not deleted, None otherwise
        """
        return await self.users_collection.find_one(
            {
                "user_email": {"$regex": f"^{email}$", "$options": "i"},
                "is_deleted": {"$ne": True}  # Exclude deleted users
            }
        )

    async def get_all_users(
        self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all users with pagination and optional filters.
        
        Args:
            skip: Number of users to skip
            limit: Maximum number of users to return
            filters: Optional filters (is_admin, is_internal, registration_status, search, include_deleted)
            
        Returns:
            List of user data dictionaries
        """
        query = {}
        
        # By default, exclude deleted users unless specifically requested
        include_deleted = filters.get('include_deleted', False) if filters else False
        if not include_deleted:
            query['is_deleted'] = {"$ne": True}
        
        if filters:
            if 'is_admin' in filters:
                query['is_admin'] = filters['is_admin']
            if 'is_internal' in filters:
                query['is_internal'] = filters['is_internal']
            if 'registration_status' in filters:
                query['registration_status'] = filters['registration_status']
            if 'is_deleted' in filters:
                query['is_deleted'] = filters['is_deleted']
            if 'search' in filters and filters['search']:
                # Search in first_name, last_name, user_email
                search_regex = {"$regex": filters['search'], "$options": "i"}
                query['$or'] = [
                    {"first_name": search_regex},
                    {"last_name": search_regex},
                    {"user_email": search_regex},
                    {"company": search_regex},
                ]
        
        cursor = self.users_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_user_count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Get total number of users with optional filters.
        
        Args:
            filters: Optional filters (is_admin, is_internal, registration_status, search, include_deleted)
            
        Returns:
            Count of users matching the filters
        """
        query = {}
        
        # By default, exclude deleted users unless specifically requested
        include_deleted = filters.get('include_deleted', False) if filters else False
        if not include_deleted:
            query['is_deleted'] = {"$ne": True}
        
        if filters:
            if 'is_admin' in filters:
                query['is_admin'] = filters['is_admin']
            if 'is_internal' in filters:
                query['is_internal'] = filters['is_internal']
            if 'registration_status' in filters:
                query['registration_status'] = filters['registration_status']
            if 'is_deleted' in filters:
                query['is_deleted'] = filters['is_deleted']
            if 'search' in filters and filters['search']:
                # Search in first_name, last_name, user_email
                search_regex = {"$regex": filters['search'], "$options": "i"}
                query['$or'] = [
                    {"first_name": search_regex},
                    {"last_name": search_regex},
                    {"user_email": search_regex},
                    {"company": search_regex},
                ]
        
        return await self.users_collection.count_documents(query)

    async def get_login_creds(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get login credentials for a user.
        
        Args:
            user_id: The user's ID
            
        Returns:
            Login credentials if found, None otherwise
        """
        return await self.login_creds_collection.find_one({"_id": user_id})
    
    async def get_login_creds_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get login credentials by email address.
        
        Args:
            email: The user's email address
            
        Returns:
            Login credentials if found, None otherwise
        """
        return await self.login_creds_collection.find_one(
            {"user_email": {"$regex": f"^{email}$", "$options": "i"}}
        )

    async def update_user(
        self, user_id: str, update_data: Dict[str, Any]
    ) -> Optional[UserModel]:
        """
        Update a user's information.
        
        Args:
            user_id: The user's ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated UserModel if successful, None if user not found
        """
        # Remove _id from update data if present
        update_data = {k: v for k, v in update_data.items() if k != "_id"}
        
        result = await self.users_collection.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            # Return the updated user
            updated_user = await self.users_collection.find_one({"_id": user_id})
            if updated_user:
                return UserModel(**updated_user)
        
        return None

    async def delete_user(self, user_id: str) -> bool:
        """
        HARD Delete a user and their login credentials.
        WARNING: This permanently removes the user from the database.
        Use soft_delete_user() for non-destructive deletion.
        
        Args:
            user_id: The user's ID
            
        Returns:
            True if deleted, False if user not found
        """
        # Delete from both collections
        user_result = await self.users_collection.delete_one({"_id": user_id})
        await self.login_creds_collection.delete_one({"_id": user_id})
        
        return user_result.deleted_count > 0
    
    async def soft_delete_user(self, user_id: str) -> bool:
        """
        Soft delete a user (marks as deleted, doesn't remove from database).
        This allows the email to be reused for new registrations.
        
        The user's email is modified to prevent unique constraint violation:
        - Original: user@example.com
        - After deletion: deleted_<timestamp>_user@example.com
        
        Args:
            user_id: The user's ID
            
        Returns:
            True if marked as deleted, False if user not found
        """
        # Get the user first to access their email
        user = await self.users_collection.find_one({"_id": user_id})
        if not user:
            return False
        
        now = datetime.now(timezone.utc)
        timestamp = int(now.timestamp())
        
        # Modify the email to free up the original email for reuse
        # Format: deleted_<timestamp>_<original_email>
        original_email = user.get("user_email", "")
        deleted_email = f"deleted_{timestamp}_{original_email}"
        
        result = await self.users_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "user_email": deleted_email,
                    "original_email": original_email,  # Store original email
                    "is_deleted": True,
                    "deleted_at": now.isoformat(),
                    "account_active": False,
                    "can_login": False,
                }
            }
        )
        
        # Also update the login_creds collection
        await self.login_creds_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "user_email": deleted_email,
                }
            }
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    
    # =========================================================================
    # MFA/TOTP-RELATED METHODS (NEW)
    # =========================================================================
    
    async def activate_user_account(self, user_id: str) -> bool:
        """
        Activate user account after successful MFA setup.
        
        Updates:
        - totp_enabled = True
        - totp_setup_at = now
        - registration_status = "completed"
        - registration_completed_at = now
        - account_active = True
        - can_login = True
        
        Args:
            user_id: The user's ID
            
        Returns:
            True if updated successfully
        """
        now = datetime.now(timezone.utc).isoformat()
        
        result = await self.users_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "totp_enabled": True,
                    "totp_setup_at": now,
                    "registration_status": "completed",
                    "registration_completed_at": now,
                    "account_active": True,
                    "can_login": True,
                }
            }
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    
    async def update_totp_last_used(self, user_id: str) -> bool:
        """
        Update the timestamp when TOTP was last successfully used.
        
        Args:
            user_id: The user's ID
            
        Returns:
            True if updated successfully
        """
        now = datetime.now(timezone.utc).isoformat()
        
        result = await self.users_collection.update_one(
            {"_id": user_id},
            {"$set": {"totp_last_used": now}}
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    
    async def disable_user_totp(self, user_id: str) -> bool:
        """
        Disable TOTP for a user (when user disables MFA).
        
        Args:
            user_id: The user's ID
            
        Returns:
            True if updated successfully
        """
        now = datetime.now(timezone.utc).isoformat()
        
        result = await self.users_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "totp_enabled": False,
                    "totp_setup_at": None,
                    "totp_last_used": None,
                }
            }
        )
        
        return result.modified_count > 0 or result.matched_count > 0
    
    async def get_users_with_pending_mfa(
        self, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get users with pending MFA setup.
        
        Args:
            skip: Number to skip
            limit: Maximum number to return
            
        Returns:
            List of user dictionaries with pending_mfa status
        """
        cursor = self.users_collection.find(
            {"registration_status": "pending_mfa"}
        ).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def get_users_with_mfa_enabled(
        self, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get users with MFA enabled.
        
        Args:
            skip: Number to skip
            limit: Maximum number to return
            
        Returns:
            List of user dictionaries with MFA enabled
        """
        cursor = self.users_collection.find(
            {"totp_enabled": True}
        ).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)

