"""
Testimonial Repository - Data access layer for testimonial operations.
Uses MongoDB for persistent storage.

Field naming convention: snake_case (matching frontend requirements)
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase


class TestimonialRepository:
    """
    Repository for testimonial data operations.
    Uses MongoDB for storage.
    """

    COLLECTION_NAME = "testimonials"

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the repository with a database connection.
        
        Args:
            db: AsyncIOMotorDatabase instance
        """
        self._db = db
        self._collection = db[self.COLLECTION_NAME]

    def generate_id(self) -> str:
        """Generate a unique testimonial ID."""
        return str(uuid.uuid4())

    async def create(self, testimonial_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new testimonial in MongoDB.
        
        Args:
            testimonial_data: Dictionary containing testimonial data
            
        Returns:
            The created testimonial document
        """
        # Add metadata
        now = datetime.now(timezone.utc)
        testimonial_data["_id"] = testimonial_data.get("id", self.generate_id())
        testimonial_data["id"] = testimonial_data["_id"]
        testimonial_data["created_at"] = now.isoformat()
        testimonial_data["updated_at"] = now.isoformat()

        # Insert into MongoDB
        await self._collection.insert_one(testimonial_data)

        return testimonial_data

    async def get_all(
        self,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all testimonials with optional filters.
        
        Args:
            status: Filter by status ('published' or 'draft')
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of testimonial documents
        """
        # Build filter query
        query: Dict[str, Any] = {}
        
        if status:
            query["status"] = status

        # Execute query with sorting (newest first)
        cursor = self._collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            # Convert _id to id for response
            doc["id"] = str(doc["_id"])
            results.append(doc)

        return results

    async def get_by_id(self, testimonial_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a testimonial by its ID.
        
        Args:
            testimonial_id: The testimonial ID
            
        Returns:
            Testimonial document if found, None otherwise
        """
        doc = await self._collection.find_one({"_id": testimonial_id})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def find_many(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find multiple testimonials with a custom query filter.
        
        Args:
            query: MongoDB query filter
            
        Returns:
            List of testimonial documents matching the query
        """
        cursor = self._collection.find(query)
        
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)
        
        return results

    async def update(
        self, testimonial_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a testimonial.
        
        Args:
            testimonial_id: The testimonial ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated testimonial if found, None otherwise
        """
        # Don't allow updating _id or id
        update_data.pop("_id", None)
        update_data.pop("id", None)
        
        # Update timestamp
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = await self._collection.find_one_and_update(
            {"_id": testimonial_id},
            {"$set": update_data},
            return_document=True,
        )

        if result:
            result["id"] = str(result["_id"])

        return result

    async def delete(self, testimonial_id: str) -> bool:
        """
        Delete a testimonial.
        
        Args:
            testimonial_id: The testimonial ID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self._collection.delete_one({"_id": testimonial_id})
        return result.deleted_count > 0

    async def get_count(self, status: Optional[str] = None) -> int:
        """
        Get total number of testimonials.
        
        Args:
            status: Optional filter by status
            
        Returns:
            Count of testimonials
        """
        query = {}
        if status:
            query["status"] = status
        return await self._collection.count_documents(query)

    async def create_indexes(self) -> None:
        """Create indexes for better query performance."""
        await self._collection.create_index("status")
        await self._collection.create_index("created_at")
        print("✅ Testimonial indexes created")
