"""
Blog Repository - Data access layer for blog operations.
Uses MongoDB for persistent storage.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.exceptions.blog_exceptions import BlogAlreadyExistsError


class BlogRepository:
    """
    Repository for blog data operations.
    Uses MongoDB for storage.
    """

    COLLECTION_NAME = "blogs"

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the repository with a database connection.
        
        Args:
            db: AsyncIOMotorDatabase instance
        """
        self._db = db
        self._collection = db[self.COLLECTION_NAME]

    def generate_id(self) -> str:
        """Generate a unique blog ID."""
        return str(uuid.uuid4())

    async def url_exists(self, url: str, exclude_id: Optional[str] = None) -> bool:
        """
        Check if a URL already exists.
        
        Args:
            url: The URL to check
            exclude_id: Optional ID to exclude (for updates)
            
        Returns:
            True if exists, False otherwise
        """
        query = {"url": url}
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
        query = {"slug": slug}
        if exclude_id:
            query["_id"] = {"$ne": exclude_id}
        doc = await self._collection.find_one(query)
        return doc is not None

    async def create(self, blog_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new blog in MongoDB.
        
        Args:
            blog_data: Dictionary containing blog data
            
        Returns:
            The created blog document
            
        Raises:
            BlogAlreadyExistsError: If URL already exists
        """
        # Check if URL already exists
        if await self.url_exists(blog_data.get("url", "")):
            raise BlogAlreadyExistsError(blog_data.get("url", ""))

        # Add metadata
        now = datetime.now(timezone.utc)
        blog_data["_id"] = blog_data.get("id", self.generate_id())
        blog_data["id"] = blog_data["_id"]
        blog_data["created_at"] = now.isoformat()
        blog_data["updated_at"] = now.isoformat()

        # Insert into MongoDB
        await self._collection.insert_one(blog_data)

        return blog_data

    async def get_all(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all blogs with optional filters.
        
        Args:
            category: Filter by category
            status: Filter by status ('published' or 'draft')
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of blog documents
        """
        # Build filter query
        query: Dict[str, Any] = {}
        
        if category:
            query["category"] = {"$regex": category, "$options": "i"}
        
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

    async def get_by_id(self, blog_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a blog by its ID.
        
        Args:
            blog_id: The blog ID
            
        Returns:
            Blog document if found, None otherwise
        """
        doc = await self._collection.find_one({"_id": blog_id})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def update(
        self, blog_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a blog.
        
        Args:
            blog_id: The blog ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated blog if found, None otherwise
        """
        # Don't allow updating _id or id
        update_data.pop("_id", None)
        update_data.pop("id", None)
        
        # Update timestamp
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = await self._collection.find_one_and_update(
            {"_id": blog_id},
            {"$set": update_data},
            return_document=True,
        )

        if result:
            result["id"] = str(result["_id"])

        return result

    async def delete(self, blog_id: str) -> bool:
        """
        Delete a blog.
        
        Args:
            blog_id: The blog ID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self._collection.delete_one({"_id": blog_id})
        return result.deleted_count > 0

    async def get_count(self, status: Optional[str] = None) -> int:
        """
        Get total number of blogs.
        
        Args:
            status: Optional filter by status
            
        Returns:
            Count of blogs
        """
        query = {}
        if status:
            query["status"] = status
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
        await self._collection.create_index("url", unique=True)
        await self._collection.create_index("status")
        await self._collection.create_index("category")
        await self._collection.create_index("created_at")
        print("✅ Blog indexes created")

