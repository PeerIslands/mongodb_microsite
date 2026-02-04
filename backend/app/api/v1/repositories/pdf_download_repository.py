"""
PDF Download Repository - Data access layer for PDF download lead capture.

This repository handles all MongoDB operations for PDF download records.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase


class PDFDownloadRepository:
    """Repository for PDF download lead capture CRUD operations in MongoDB."""
    
    COLLECTION_NAME = "pdf_downloads"

    def __init__(self, db: AsyncIOMotorDatabase):
        """Initialize repository with database connection."""
        self._db = db
        self._collection = db[self.COLLECTION_NAME]

    def generate_id(self) -> str:
        """Generate a unique ID for a new download record."""
        return str(uuid.uuid4())

    async def create(self, download_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new PDF download record in the database.
        
        Args:
            download_data: Download record data dictionary
            
        Returns:
            Created download record with ID
        """
        now = datetime.now(timezone.utc)
        download_data["_id"] = download_data.get("id", self.generate_id())
        download_data["id"] = download_data["_id"]
        download_data["created_at"] = now

        await self._collection.insert_one(download_data)
        return download_data

    async def get_all(
        self,
        resource_type: Optional[str] = None,
        email: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all PDF download records with optional filtering.
        
        Args:
            resource_type: Filter by resource type ('accelerator' or 'case_study')
            email: Filter by email address
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of download records
        """
        query: Dict[str, Any] = {}
        if resource_type:
            query["resource_type"] = resource_type
        if email:
            query["email"] = email

        cursor = self._collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_by_id(self, download_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single download record by ID.
        
        Args:
            download_id: Download record ID
            
        Returns:
            Download record or None if not found
        """
        doc = await self._collection.find_one({"_id": download_id})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def get_by_email(self, email: str) -> List[Dict[str, Any]]:
        """
        Get all download records for a specific email.
        
        Args:
            email: Email address
            
        Returns:
            List of download records for the email
        """
        cursor = self._collection.find({"email": email}).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def get_by_resource(
        self, resource_type: str, resource_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all download records for a specific resource.
        
        Args:
            resource_type: Type of resource ('accelerator' or 'case_study')
            resource_id: ID of the resource
            
        Returns:
            List of download records for the resource
        """
        cursor = self._collection.find({
            "resource_type": resource_type,
            "resource_id": resource_id
        }).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def create_indexes(self) -> None:
        """Create database indexes for optimal query performance."""
        await self._collection.create_index("email")
        await self._collection.create_index("resource_type")
        await self._collection.create_index("resource_id")
        await self._collection.create_index("created_at")
        await self._collection.create_index([("resource_type", 1), ("resource_id", 1)])
        print("✅ PDF download indexes created")
