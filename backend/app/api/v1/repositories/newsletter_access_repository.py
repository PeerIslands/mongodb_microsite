"""
Newsletter Access Repository - Data access layer for newsletter access control.
Handles all database operations for newsletter access requests.
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.api.v1.models.newsletter_access import NewsletterAccessRequestModel


class NewsletterAccessRepository:
    """
    Repository for newsletter access request operations.
    Uses MongoDB for persistent storage.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize repository with MongoDB database.
        
        Args:
            db: MongoDB database instance
        """
        self.db = db
        self.collection = db["newsletter_access_requests"]

    def generate_id(self) -> str:
        """Generate a unique request ID."""
        return str(uuid.uuid4())

    def extract_domain(self, email: str) -> str:
        """Extract domain from email address."""
        return email.split('@')[1].lower() if '@' in email else ''

    async def create_request(
        self,
        user_email: str,
        user_id: Optional[str] = None,
        newsletter_id: Optional[str] = None
    ) -> str:
        """
        Create a new newsletter access request.
        
        Args:
            user_email: Email of user requesting access
            user_id: User ID if authenticated (optional)
            newsletter_id: Specific newsletter ID (optional, None = all newsletters)
            
        Returns:
            The created request ID
        """
        request_id = self.generate_id()
        user_domain = self.extract_domain(user_email)
        now = datetime.now(timezone.utc)

        request = NewsletterAccessRequestModel(
            _id=request_id,
            user_email=user_email.lower(),
            user_id=user_id,
            user_domain=user_domain,
            newsletter_id=newsletter_id,
            status="pending",
            requested_at=now,
            resolved_at=None,
            resolved_by=None,
            admin_note=None,
            created_at=now,
            updated_at=now
        )

        await self.collection.insert_one(request.to_dict())
        return request_id

    async def get_request_by_id(self, request_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an access request by ID.
        
        Args:
            request_id: Request ID
            
        Returns:
            Request document or None if not found
        """
        return await self.collection.find_one({"_id": request_id})

    async def check_existing_request(
        self,
        user_email: str,
        newsletter_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Check if user already has a pending or approved request.
        
        Args:
            user_email: User's email
            newsletter_id: Specific newsletter ID (optional)
            
        Returns:
            Existing request or None
        """
        query = {
            "user_email": user_email.lower(),
            "status": {"$in": ["pending", "approved"]},
            "newsletter_id": newsletter_id
        }
        return await self.collection.find_one(query)

    async def has_access(
        self,
        user_email: str,
        newsletter_id: Optional[str] = None
    ) -> bool:
        """
        Check if user has approved access to newsletters.
        
        Args:
            user_email: User's email
            newsletter_id: Specific newsletter ID (optional)
            
        Returns:
            True if user has approved access
        """
        # Check for approved request (either specific newsletter or all newsletters)
        query = {
            "user_email": user_email.lower(),
            "status": "approved",
            "$or": [
                {"newsletter_id": newsletter_id},
                {"newsletter_id": None}  # General access to all newsletters
            ]
        }
        result = await self.collection.find_one(query)
        return result is not None

    async def get_pending_requests(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all pending access requests.
        
        Args:
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            
        Returns:
            List of pending requests
        """
        cursor = self.collection.find(
            {"status": "pending"}
        ).sort("requested_at", -1).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)

    async def get_pending_count(self) -> int:
        """
        Get count of pending access requests.
        
        Returns:
            Number of pending requests
        """
        return await self.collection.count_documents({"status": "pending"})

    async def get_all_requests(
        self,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all access requests with optional status filter.
        
        Args:
            status: Filter by status (pending, approved, denied) or None for all
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of requests
        """
        query = {}
        if status:
            query["status"] = status
        
        cursor = self.collection.find(query).sort("requested_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def approve_request(
        self,
        request_id: str,
        admin_user_id: str,
        admin_note: Optional[str] = None
    ) -> bool:
        """
        Approve an access request.
        
        Args:
            request_id: Request ID to approve
            admin_user_id: Admin user ID who approved
            admin_note: Optional note from admin
            
        Returns:
            True if approved successfully, False otherwise
        """
        now = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"_id": request_id, "status": "pending"},
            {
                "$set": {
                    "status": "approved",
                    "resolved_at": now.isoformat(),
                    "resolved_by": admin_user_id,
                    "admin_note": admin_note,
                    "updated_at": now.isoformat()
                }
            }
        )
        return result.modified_count > 0

    async def deny_request(
        self,
        request_id: str,
        admin_user_id: str,
        admin_note: Optional[str] = None
    ) -> bool:
        """
        Deny an access request.
        
        Args:
            request_id: Request ID to deny
            admin_user_id: Admin user ID who denied
            admin_note: Optional note from admin
            
        Returns:
            True if denied successfully, False otherwise
        """
        now = datetime.now(timezone.utc)
        result = await self.collection.update_one(
            {"_id": request_id, "status": "pending"},
            {
                "$set": {
                    "status": "denied",
                    "resolved_at": now.isoformat(),
                    "resolved_by": admin_user_id,
                    "admin_note": admin_note,
                    "updated_at": now.isoformat()
                }
            }
        )
        return result.modified_count > 0

    async def delete_request(self, request_id: str) -> bool:
        """
        Delete an access request.
        
        Args:
            request_id: Request ID to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        result = await self.collection.delete_one({"_id": request_id})
        return result.deleted_count > 0

    async def get_user_requests(
        self,
        user_email: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get all requests from a specific user.
        
        Args:
            user_email: User's email
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of user's requests
        """
        cursor = self.collection.find(
            {"user_email": user_email.lower()}
        ).sort("requested_at", -1).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)
