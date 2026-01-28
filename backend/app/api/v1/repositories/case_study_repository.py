"""
Case Study Repository - Data access layer for case study operations.
Uses MongoDB for persistent storage.

Field naming convention: snake_case (matching frontend requirements)
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.exceptions.case_study_exceptions import CaseStudyAlreadyExistsError


class CaseStudyRepository:
    """
    Repository for case study data operations.
    Uses MongoDB for storage.
    """

    COLLECTION_NAME = "case_studies"

    def __init__(self, db: AsyncIOMotorDatabase):
        """
        Initialize the repository with a database connection.
        
        Args:
            db: AsyncIOMotorDatabase instance
        """
        self._db = db
        self._collection = db[self.COLLECTION_NAME]

    def generate_id(self) -> str:
        """Generate a unique case study ID."""
        return str(uuid.uuid4())

    async def slug_exists(self, slug: str) -> bool:
        """
        Check if a slug already exists.
        
        Args:
            slug: The slug to check
            
        Returns:
            True if exists, False otherwise
        """
        doc = await self._collection.find_one({"slug": slug})
        return doc is not None

    async def create(self, case_study_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new case study in MongoDB.
        
        Args:
            case_study_data: Dictionary containing case study data
            
        Returns:
            The created case study document
            
        Raises:
            CaseStudyAlreadyExistsError: If slug already exists
        """
        # Check if slug already exists
        if await self.slug_exists(case_study_data["slug"]):
            raise CaseStudyAlreadyExistsError(case_study_data["slug"])

        # Add metadata
        now = datetime.now(timezone.utc)
        case_study_data["_id"] = case_study_data.get("id", self.generate_id())
        case_study_data["id"] = case_study_data["_id"]
        case_study_data["created_at"] = now.isoformat()
        case_study_data["updated_at"] = now.isoformat()

        # Insert into MongoDB
        await self._collection.insert_one(case_study_data)

        return case_study_data

    async def get_all(
        self,
        industry: Optional[str] = None,
        status: Optional[str] = None,
        featured: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all case studies with optional filters.
        
        Args:
            industry: Filter by industry
            status: Filter by status ('published' or 'draft')
            featured: Filter by featured status (boolean)
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of case study documents
        """
        # Build filter query
        query: Dict[str, Any] = {}
        
        if industry:
            query["industry"] = {"$regex": industry, "$options": "i"}
        
        if status:
            query["status"] = status
        
        if featured is not None:
            query["featured"] = featured

        # Execute query with sorting (newest first)
        cursor = self._collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            # Convert _id to id for response
            doc["id"] = str(doc["_id"])
            results.append(doc)

        return results

    async def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """
        Get a case study by its slug.
        
        Args:
            slug: The URL-friendly slug
            
        Returns:
            Case study document if found, None otherwise
        """
        doc = await self._collection.find_one({"slug": slug})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def get_by_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a case study by its ID.
        
        Args:
            case_id: The case study ID
            
        Returns:
            Case study document if found, None otherwise
        """
        doc = await self._collection.find_one({"_id": case_id})
        if doc:
            doc["id"] = str(doc["_id"])
        return doc

    async def find_many(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find multiple case studies with a custom query filter.
        
        Args:
            query: MongoDB query filter
            
        Returns:
            List of case study documents matching the query
        """
        cursor = self._collection.find(query)
        
        results = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            results.append(doc)
        
        return results

    async def update(
        self, case_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a case study.
        
        Args:
            case_id: The case study ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated case study if found, None otherwise
        """
        # Don't allow updating _id or id
        update_data.pop("_id", None)
        update_data.pop("id", None)
        
        # Update timestamp
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = await self._collection.find_one_and_update(
            {"_id": case_id},
            {"$set": update_data},
            return_document=True,
        )

        if result:
            result["id"] = str(result["_id"])

        return result

    async def delete(self, case_id: str) -> bool:
        """
        Delete a case study.
        
        Args:
            case_id: The case study ID
            
        Returns:
            True if deleted, False if not found
        """
        result = await self._collection.delete_one({"_id": case_id})
        return result.deleted_count > 0

    async def get_count(self, status: Optional[str] = None) -> int:
        """
        Get total number of case studies.
        
        Args:
            status: Optional filter by status
            
        Returns:
            Count of case studies
        """
        query = {}
        if status:
            query["status"] = status
        return await self._collection.count_documents(query)

    async def get_industries(self) -> List[str]:
        """
        Get list of unique industries.
        
        Returns:
            List of unique industry names
        """
        industries = await self._collection.distinct("industry")
        return sorted(industries)

    async def create_indexes(self) -> None:
        """Create indexes for better query performance."""
        await self._collection.create_index("slug", unique=True)
        await self._collection.create_index("status")
        await self._collection.create_index("industry")
        await self._collection.create_index("featured")
        await self._collection.create_index("created_at")
        print("✅ Case study indexes created")
