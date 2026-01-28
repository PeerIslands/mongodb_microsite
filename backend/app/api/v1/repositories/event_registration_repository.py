"""
Event Registration Repository - Data access layer for event registration operations.
Uses MongoDB for persistent storage.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase


class EventRegistrationRepository:
    """
    Repository for event registration data operations.
    Uses MongoDB for storage.
    """

    COLLECTION_NAME = "event_registrations"

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the repository with a database connection.
        
        Args:
            db: AsyncIOMotorDatabase instance
        """
        self._db = db
        self._collection = db[self.COLLECTION_NAME]

    def generate_id(self) -> str:
        """Generate a unique registration ID."""
        return str(uuid.uuid4())

    async def create(self, registration_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new event registration in MongoDB.
        
        Args:
            registration_data: Dictionary containing registration data
            
        Returns:
            The created registration document
        """
        # Add metadata
        now = datetime.now(timezone.utc)
        registration_data["_id"] = registration_data.get("id", self.generate_id())
        registration_data["id"] = registration_data["_id"]
        registration_data["registered_at"] = now.isoformat()

        # Insert into MongoDB
        await self._collection.insert_one(registration_data)

        return registration_data

    async def get_by_id(self, registration_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a registration by its ID.
        
        Args:
            registration_id: The registration ID
            
        Returns:
            Registration document if found, None otherwise
        """
        doc = await self._collection.find_one({"_id": registration_id})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def get_by_user_id(
        self,
        user_id: str,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all registrations for a specific user.
        
        Args:
            user_id: The user ID
            status: Optional filter by status
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of registration documents
        """
        query: Dict[str, Any] = {"user_id": user_id}
        
        if status:
            query["status"] = status

        cursor = self._collection.find(query).sort("registered_at", -1).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)

        return results

    async def get_by_event_id(
        self,
        event_id: str,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all registrations for a specific event.
        
        Args:
            event_id: The event ID
            status: Optional filter by status
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of registration documents
        """
        query: Dict[str, Any] = {"event_id": event_id}
        
        if status:
            query["status"] = status

        cursor = self._collection.find(query).sort("registered_at", -1).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)

        return results

    async def get_all(
        self,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all registrations with optional filters.
        
        Args:
            status: Optional filter by status
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of registration documents
        """
        query: Dict[str, Any] = {}
        
        if status:
            query["status"] = status

        cursor = self._collection.find(query).sort("registered_at", -1).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)

        return results

    async def get_by_user_and_event(
        self, user_id: str, event_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a registration by user ID and event ID.
        Used to check for duplicate registrations.
        
        Args:
            user_id: The user ID
            event_id: The event ID
            
        Returns:
            Registration document if found, None otherwise
        """
        doc = await self._collection.find_one({
            "user_id": user_id,
            "event_id": event_id
        })
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def update_status(
        self, registration_id: str, status: str
    ) -> Optional[Dict[str, Any]]:
        """
        Update the status of a registration.
        
        Args:
            registration_id: The registration ID
            status: The new status
            
        Returns:
            Updated registration if found, None otherwise
        """
        result = await self._collection.find_one_and_update(
            {"_id": registration_id},
            {"$set": {"status": status}},
            return_document=True,
        )

        if result:
            result["id"] = str(result["_id"])

        return result

    async def delete(self, registration_id: str) -> bool:
        """
        Delete a registration.
        
        Args:
            registration_id: The registration ID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self._collection.delete_one({"_id": registration_id})
        return result.deleted_count > 0

    async def get_count_by_event(
        self,
        event_id: str,
        status: Optional[str] = None,
    ) -> int:
        """
        Get total number of registrations for an event.
        
        Args:
            event_id: The event ID
            status: Optional filter by status
            
        Returns:
            Count of registrations
        """
        query: Dict[str, Any] = {"event_id": event_id}
        if status:
            query["status"] = status
        return await self._collection.count_documents(query)

    async def get_total_count(
        self,
        status: Optional[str] = None,
    ) -> int:
        """
        Get total number of all registrations.
        
        Args:
            status: Optional filter by status
            
        Returns:
            Count of registrations
        """
        query: Dict[str, Any] = {}
        if status:
            query["status"] = status
        return await self._collection.count_documents(query)

    async def create_indexes(self) -> None:
        """Create indexes for better query performance."""
        # Unique compound index to prevent duplicate registrations
        await self._collection.create_index(
            [("user_id", 1), ("event_id", 1)],
            unique=True
        )
        await self._collection.create_index("user_id")
        await self._collection.create_index("event_id")
        await self._collection.create_index("status")
        await self._collection.create_index("registered_at")
        print("✅ Event registration indexes created")
