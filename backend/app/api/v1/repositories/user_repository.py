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
        Check if email already exists in the database.
        
        Args:
            email: Email address to check
            
        Returns:
            True if email exists, False otherwise
        """
        result = await self.users_collection.find_one(
            {"user_email": {"$regex": f"^{email}$", "$options": "i"}}
        )
        return result is not None

    async def create_user(
        self,
        user_id: str,
        first_name: str,
        last_name: str,
        user_email: str,
        is_internal: bool,
        encrypted_password: str,
    ) -> str:
        """
        Create a new user and their login credentials.
        
        Args:
            user_id: Unique user identifier
            first_name: User's first name
            last_name: User's last name
            user_email: User's email address
            is_internal: Whether user is internal
            encrypted_password: Bcrypt hashed password
            
        Returns:
            The created user's ID
            
        Raises:
            UserAlreadyExistsError: If email already exists
        """
        # Check for existing email
        if await self.email_exists(user_email):
            raise UserAlreadyExistsError(user_email)

        now = datetime.now(timezone.utc)

        # Create User model
        user = UserModel(
            _id=user_id,
            first_name=first_name,
            last_name=last_name,
            user_email=user_email,
            is_internal=is_internal,
            is_admin=False,
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
        Get a user by their email address.
        
        Args:
            email: The user's email address
            
        Returns:
            User data dictionary if found, None otherwise
        """
        return await self.users_collection.find_one(
            {"user_email": {"$regex": f"^{email}$", "$options": "i"}}
        )

    async def get_all_users(
        self, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all users with pagination.
        
        Args:
            skip: Number of users to skip
            limit: Maximum number of users to return
            
        Returns:
            List of user data dictionaries
        """
        cursor = self.users_collection.find().skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_user_count(self) -> int:
        """Get total number of users."""
        return await self.users_collection.count_documents({})

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
    ) -> bool:
        """
        Update a user's information.
        
        Args:
            user_id: The user's ID
            update_data: Dictionary of fields to update
            
        Returns:
            True if updated, False if user not found
        """
        # Remove _id from update data if present
        update_data = {k: v for k, v in update_data.items() if k != "_id"}
        
        result = await self.users_collection.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0 or result.matched_count > 0

    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user and their login credentials.
        
        Args:
            user_id: The user's ID
            
        Returns:
            True if deleted, False if user not found
        """
        # Delete from both collections
        user_result = await self.users_collection.delete_one({"_id": user_id})
        await self.login_creds_collection.delete_one({"_id": user_id})
        
        return user_result.deleted_count > 0

