"""
User Repository - Data access layer for user operations.
Handles all database operations for User and LoginCreds tables.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from app.api.v1.models.user import UserModel, LoginCredsModel
from app.api.v1.exceptions.user_exceptions import UserAlreadyExistsError, UserNotFoundError


class UserRepository:
    """
    Repository for user data operations.
    Currently uses in-memory storage. Replace with MongoDB in production.
    """

    def __init__(self):
        """Initialize in-memory storage."""
        # Simulates User Table
        self._user_table: Dict[str, Dict[str, Any]] = {}
        # Simulates Login_creds Table
        self._login_creds_table: Dict[str, Dict[str, Any]] = {}
        # Email index for quick lookup
        self._email_index: Dict[str, str] = {}

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
        return email.lower() in self._email_index

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

        # Store in tables
        self._user_table[user_id] = user.to_dict()
        self._login_creds_table[user_id] = login_creds.to_dict()
        
        # Update email index
        self._email_index[user_email.lower()] = user_id

        return user_id

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by their ID.
        
        Args:
            user_id: The user's ID
            
        Returns:
            User data dictionary if found, None otherwise
        """
        return self._user_table.get(user_id)

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get a user by their email address.
        
        Args:
            email: The user's email address
            
        Returns:
            User data dictionary if found, None otherwise
        """
        user_id = self._email_index.get(email.lower())
        if user_id:
            return self._user_table.get(user_id)
        return None

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
        users = list(self._user_table.values())
        return users[skip : skip + limit]

    async def get_user_count(self) -> int:
        """Get total number of users."""
        return len(self._user_table)

    async def get_login_creds(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get login credentials for a user.
        
        Args:
            user_id: The user's ID
            
        Returns:
            Login credentials if found, None otherwise
        """
        return self._login_creds_table.get(user_id)

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
        if user_id not in self._user_table:
            return False

        for key, value in update_data.items():
            if key != "_id":  # Don't allow ID updates
                self._user_table[user_id][key] = value

        return True

    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user and their login credentials.
        
        Args:
            user_id: The user's ID
            
        Returns:
            True if deleted, False if user not found
        """
        if user_id not in self._user_table:
            return False

        # Get email before deletion for index cleanup
        user_email = self._user_table[user_id].get("user_email", "").lower()

        # Delete from all tables
        del self._user_table[user_id]
        if user_id in self._login_creds_table:
            del self._login_creds_table[user_id]
        if user_email in self._email_index:
            del self._email_index[user_email]

        return True

