"""
Blog Service - Business logic layer for blog operations.
Handles validation, data transformation, and orchestrates repository calls.
"""

from typing import List, Optional, Dict, Any

from app.api.v1.models.blog import (
    CreateBlogRequest,
    CreateBlogResponse,
    UpdateBlogRequest,
    UpdateBlogResponse,
    BlogResponse,
    BlogDetailResponse,
    DeleteBlogResponse,
)
from app.api.v1.repositories.blog_repository import BlogRepository
from app.api.v1.exceptions.blog_exceptions import (
    BlogNotFoundError,
    BlogValidationError,
)


class BlogService:
    """
    Service class for blog business logic.
    """

    def __init__(self, repository: BlogRepository):
        """
        Initialize the service with a repository.
        
        Args:
            repository: BlogRepository instance
        """
        self._repository = repository

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _to_response(self, doc: dict) -> BlogResponse:
        """Convert document to BlogResponse."""
        return BlogResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            description=doc.get("description", ""),
            category=doc.get("category", ""),
            author=doc.get("author"),
            url=doc.get("url", ""),
            published_date=doc.get("published_date"),
            tags=doc.get("tags", []),
            status=doc.get("status", "draft"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    def _to_detail_response(self, doc: dict) -> BlogDetailResponse:
        """Convert document to BlogDetailResponse."""
        return BlogDetailResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            description=doc.get("description", ""),
            category=doc.get("category", ""),
            author=doc.get("author"),
            url=doc.get("url", ""),
            published_date=doc.get("published_date"),
            tags=doc.get("tags", []),
            status=doc.get("status", "draft"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    # =========================================================================
    # SERVICE METHODS
    # =========================================================================

    async def create_blog(
        self, request: CreateBlogRequest
    ) -> CreateBlogResponse:
        """
        Create a new blog.
        
        Args:
            request: CreateBlogRequest with blog data
            
        Returns:
            CreateBlogResponse with id and message
        """
        # Convert request to dict for storage
        blog_data = request.model_dump()
        
        # Convert enum to string
        if blog_data.get("status"):
            blog_data["status"] = blog_data["status"].value if hasattr(blog_data["status"], "value") else blog_data["status"]

        # Create in MongoDB
        created = await self._repository.create(blog_data)

        return CreateBlogResponse(
            id=str(created["id"]),
            message="Blog created successfully",
        )

    async def get_all_blogs(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[BlogResponse]:
        """
        Get all blogs with optional filters.
        
        Args:
            category: Filter by category
            status: Filter by status ('published' or 'draft')
            
        Returns:
            List of BlogResponse objects
        """
        docs = await self._repository.get_all(
            category=category,
            status=status,
        )
        
        return [self._to_response(doc) for doc in docs]

    async def get_blog_by_id(self, blog_id: str) -> BlogDetailResponse:
        """
        Get a blog by its unique ID.
        
        Args:
            blog_id: The blog ID
            
        Returns:
            BlogDetailResponse with full blog details
            
        Raises:
            BlogNotFoundError: If not found
        """
        doc = await self._repository.get_by_id(blog_id)
        
        if not doc:
            raise BlogNotFoundError(blog_id)

        return self._to_detail_response(doc)

    async def update_blog(
        self,
        blog_id: str,
        request: UpdateBlogRequest,
    ) -> UpdateBlogResponse:
        """
        Update an existing blog.
        
        Args:
            blog_id: The blog ID to update
            request: UpdateBlogRequest with fields to update
            
        Returns:
            UpdateBlogResponse with id and message
            
        Raises:
            BlogNotFoundError: If blog not found
        """
        # Check if blog exists
        existing = await self._repository.get_by_id(blog_id)
        if not existing:
            raise BlogNotFoundError(blog_id)

        # Build update data - only include non-None fields
        update_data = request.model_dump(exclude_none=True)

        # Convert enum to string if present
        if update_data.get("status"):
            update_data["status"] = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]

        # Update in MongoDB
        updated = await self._repository.update(blog_id, update_data)

        if not updated:
            raise BlogNotFoundError(blog_id)

        return UpdateBlogResponse(
            id=str(updated["id"]),
            message="Blog updated successfully",
        )

    async def delete_blog(self, blog_id: str) -> DeleteBlogResponse:
        """
        Delete a blog by its ID.
        
        Args:
            blog_id: The blog ID to delete
            
        Returns:
            DeleteBlogResponse with id and message
            
        Raises:
            BlogNotFoundError: If blog not found
        """
        # Check if blog exists
        existing = await self._repository.get_by_id(blog_id)
        if not existing:
            raise BlogNotFoundError(blog_id)

        # Delete from MongoDB
        deleted = await self._repository.delete(blog_id)
        
        if not deleted:
            raise BlogNotFoundError(blog_id)

        return DeleteBlogResponse(
            id=blog_id,
            message="Blog deleted successfully",
        )

    async def get_categories(self) -> List[str]:
        """
        Get all unique blog categories.
        
        Returns:
            List of category names
        """
        return await self._repository.get_categories()

