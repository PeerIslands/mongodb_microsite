"""
Event Repository - Data access layer for event operations.
Uses MongoDB for persistent storage.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase


class EventRepository:
    """
    Repository for event data operations.
    Uses MongoDB for storage.
    """

    COLLECTION_NAME = "events"

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the repository with a database connection.
        
        Args:
            db: AsyncIOMotorDatabase instance
        """
        self._db = db
        self._collection = db[self.COLLECTION_NAME]

    def generate_id(self) -> str:
        """Generate a unique event ID."""
        return str(uuid.uuid4())

    async def slug_exists(self, slug: str, exclude_id: Optional[str] = None) -> bool:
        """
        Check if a slug already exists.
        
        Args:
            slug: The slug to check
            exclude_id: Optional ID to exclude (for updates)
            
        Returns:
            True if exists, False otherwise
        """
        query: Dict[str, Any] = {"slug": slug}
        if exclude_id:
            query["_id"] = {"$ne": exclude_id}
        doc = await self._collection.find_one(query)
        return doc is not None

    async def create(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new event in MongoDB.
        
        Args:
            event_data: Dictionary containing event data
            
        Returns:
            The created event document
        """
        # Add metadata
        now = datetime.now(timezone.utc)
        event_data["_id"] = event_data.get("id", self.generate_id())
        event_data["id"] = event_data["_id"]
        event_data["created_at"] = now.isoformat()
        event_data["updated_at"] = now.isoformat()

        # Insert into MongoDB
        await self._collection.insert_one(event_data)

        return event_data

    async def get_all(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        featured: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all events with optional filters.
        
        Args:
            category: Filter by category
            status: Filter by status ('draft', 'published', or 'archived')
            featured: Filter by featured status
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of event documents
        """
        # Build filter query
        query: Dict[str, Any] = {}
        
        if category:
            query["category"] = {"$regex": category, "$options": "i"}
        
        if status:
            query["status"] = status
        
        if featured is not None:
            query["featured"] = featured

        # Execute query with sorting (by date, then time - upcoming events first)
        cursor = self._collection.find(query).sort([("date", 1), ("time", 1)]).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            # Convert _id to id for response
            doc["id"] = str(doc["_id"])
            results.append(doc)

        return results

    async def get_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an event by its ID.
        
        Args:
            event_id: The event ID
            
        Returns:
            Event document if found, None otherwise
        """
        doc = await self._collection.find_one({"_id": event_id})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def update(
        self, event_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update an event.
        
        Args:
            event_id: The event ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated event if found, None otherwise
        """
        # Don't allow updating _id or id
        update_data.pop("_id", None)
        update_data.pop("id", None)
        
        # Update timestamp
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = await self._collection.find_one_and_update(
            {"_id": event_id},
            {"$set": update_data},
            return_document=True,
        )

        if result:
            result["id"] = str(result["_id"])

        return result

    async def delete(self, event_id: str) -> bool:
        """
        Delete an event.
        
        Args:
            event_id: The event ID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self._collection.delete_one({"_id": event_id})
        return result.deleted_count > 0

    async def get_count(
        self,
        status: Optional[str] = None,
        featured: Optional[bool] = None,
    ) -> int:
        """
        Get total number of events.
        
        Args:
            status: Optional filter by status
            featured: Optional filter by featured
            
        Returns:
            Count of events
        """
        query: Dict[str, Any] = {}
        if status:
            query["status"] = status
        if featured is not None:
            query["featured"] = featured
        return await self._collection.count_documents(query)

    async def get_categories(self) -> List[str]:
        """
        Get list of unique categories.
        
        Returns:
            List of unique category names
        """
        categories = await self._collection.distinct("category")
        return sorted(categories)

    async def create_indexes(self) -> None:
        """Create indexes for better query performance."""
        await self._collection.create_index("slug", unique=True)
        await self._collection.create_index("status")
        await self._collection.create_index("category")
        await self._collection.create_index("featured")
        await self._collection.create_index("date")
        await self._collection.create_index([("date", 1), ("time", 1)])
        await self._collection.create_index("created_at")
        print("✅ Event indexes created")
