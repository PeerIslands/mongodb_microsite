"""
Accelerator Repository - Data access layer for accelerator operations.

This repository handles all MongoDB operations for accelerators.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.exceptions.accelerator_exceptions import AcceleratorAlreadyExistsError


class AcceleratorRepository:
    """Repository for accelerator CRUD operations in MongoDB."""
    
    COLLECTION_NAME = "accelerators"

    def __init__(self, db: AsyncIOMotorDatabase):
        """Initialize repository with database connection."""
        self._db = db
        self._collection = db[self.COLLECTION_NAME]

    def generate_id(self) -> str:
        """Generate a unique ID for a new accelerator."""
        return str(uuid.uuid4())

    async def title_exists(self, title: str, exclude_id: Optional[str] = None) -> bool:
        """Check if an accelerator with the given title exists."""
        query: Dict[str, Any] = {"title": title}
        if exclude_id:
            query["_id"] = {"$ne": exclude_id}
        doc = await self._collection.find_one(query)
        return doc is not None

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

    async def create(self, accelerator_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new accelerator in the database.
        
        Args:
            accelerator_data: Accelerator data dictionary
            
        Returns:
            Created accelerator document with ID
            
        Raises:
            AcceleratorAlreadyExistsError: If accelerator with same title exists
        """
        if await self.title_exists(accelerator_data["title"]):
            raise AcceleratorAlreadyExistsError(accelerator_data["title"])

        now = datetime.now(timezone.utc)
        accelerator_data["_id"] = accelerator_data.get("id", self.generate_id())
        accelerator_data["id"] = accelerator_data["_id"]
        accelerator_data["created_at"] = now
        accelerator_data["updated_at"] = now

        await self._collection.insert_one(accelerator_data)
        return accelerator_data

    async def get_all(
        self,
        status: Optional[str] = None,
        feature_on_homepage: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all accelerators with optional filtering.
        
        Args:
            status: Filter by status ('published' or 'draft')
            feature_on_homepage: Filter by featured status
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of accelerator documents
        """
        query: Dict[str, Any] = {}
        if status:
            query["status"] = status
        if feature_on_homepage is not None:
            query["feature_on_homepage"] = feature_on_homepage

        cursor = self._collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_by_id(self, accelerator_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single accelerator by ID.
        
        Args:
            accelerator_id: Accelerator ID
            
        Returns:
            Accelerator document or None if not found
        """
        doc = await self._collection.find_one({"_id": accelerator_id})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def update(
        self, accelerator_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update an accelerator by ID.
        
        Args:
            accelerator_id: Accelerator ID
            update_data: Fields to update
            
        Returns:
            Updated accelerator document or None if not found
        """
        # Remove immutable fields
        update_data.pop("_id", None)
        update_data.pop("id", None)
        update_data.pop("created_at", None)
        update_data["updated_at"] = datetime.now(timezone.utc)

        result = await self._collection.find_one_and_update(
            {"_id": accelerator_id},
            {"$set": update_data},
            return_document=True,
        )
        if result:
            result["id"] = str(result["_id"])
        return result

    async def delete(self, accelerator_id: str) -> bool:
        """
        Delete an accelerator by ID.
        
        Args:
            accelerator_id: Accelerator ID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self._collection.delete_one({"_id": accelerator_id})
        return result.deleted_count > 0

    async def get_blob_paths(self, accelerator_id: str) -> Dict[str, str]:
        """
        Get blob paths for an accelerator's files.
        
        Args:
            accelerator_id: Accelerator ID
            
        Returns:
            Dictionary with thumbnail_url, video_url and pdf_url blob paths
        """
        doc = await self._collection.find_one(
            {"_id": accelerator_id},
            {"thumbnail_url": 1, "video_url": 1, "pdf_url": 1}
        )
        if doc:
            return {
                "thumbnail_url": doc.get("thumbnail_url", ""),
                "video_url": doc.get("video_url", ""),
                "pdf_url": doc.get("pdf_url", ""),
            }
        return {"thumbnail_url": "", "video_url": "", "pdf_url": ""}

    async def create_indexes(self) -> None:
        """Create database indexes for optimal query performance."""
        await self._collection.create_index("title", unique=True)
        await self._collection.create_index("slug", unique=True)
        await self._collection.create_index("status")
        await self._collection.create_index("feature_on_homepage")
        await self._collection.create_index("created_at")
        print("✅ Accelerator indexes created")

