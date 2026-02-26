"""
Accelerator Service - Business logic for accelerator operations.

This service handles all business logic for accelerators including
CRUD operations and file management.

Note: Blob paths are stored in MongoDB, full Azure URLs are constructed on GET.
"""

import re
from typing import List, Optional, Dict
from datetime import datetime, timezone

from app.api.v1.models.accelerator import (
    CreateAcceleratorRequest,
    CreateAcceleratorResponse,
    UpdateAcceleratorRequest,
    UpdateAcceleratorResponse,
    AcceleratorResponse,
    AcceleratorDetailResponse,
    DeleteAcceleratorResponse,
    MetricItem,
    ReorderItem,
)
from app.api.v1.repositories.accelerator_repository import AcceleratorRepository
from app.api.v1.exceptions.accelerator_exceptions import AcceleratorNotFoundError


class AcceleratorService:
    """Service for accelerator business logic."""

    def __init__(self, repository: AcceleratorRepository):
        """Initialize service with repository."""
        self._repository = repository

    # =========================================================================
    # SLUG HELPERS
    # =========================================================================

    def _slugify(self, text: str) -> str:
        """Convert text to URL-friendly slug."""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text.strip('-')

    async def _generate_unique_slug(self, title: str, exclude_id: Optional[str] = None) -> str:
        """
        Generate a unique slug from title.
        If slug exists, append a counter to make it unique.
        
        Args:
            title: Accelerator title
            exclude_id: Optional ID to exclude (for updates)
            
        Returns:
            Unique slug string
        """
        base_slug = self._slugify(title)
        slug = base_slug

        # Ensure slug is not empty
        if not slug:
            slug = "accelerator"

        counter = 1
        while await self._repository.slug_exists(slug, exclude_id):
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    # =========================================================================
    # RESPONSE HELPERS
    # =========================================================================

    def _to_response(self, doc: dict) -> AcceleratorResponse:
        """Convert MongoDB document to AcceleratorResponse."""
        return AcceleratorResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            slug=doc.get("slug", ""),
            subtitle=doc.get("subtitle", ""),
            description=doc.get("description", ""),
            status=doc.get("status", "draft"),
            feature_on_homepage=doc.get("feature_on_homepage", False),
            display_order=doc.get("display_order", 0),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        )

    def _build_proxy_url(self, accelerator_id: str, file_type: str, blob_path: str) -> str:
        """
        Build a secure proxy URL for file access.
        
        Instead of exposing Azure Blob URLs with SAS tokens, we return
        a backend proxy URL that streams the file securely.
        
        Args:
            accelerator_id: The accelerator ID
            file_type: Type of file (pdf, video, thumbnail)
            blob_path: The blob path (to check if file exists)
            
        Returns:
            Proxy URL like /api/v1/accelerators/{id}/files/{type}
        """
        if not blob_path:
            return ""
        return f"/api/v1/accelerators/{accelerator_id}/files/{file_type}"

    def _to_detail_response(self, doc: dict) -> AcceleratorDetailResponse:
        """Convert MongoDB document to AcceleratorDetailResponse.
        
        Returns secure proxy URLs instead of direct Azure Blob URLs.
        Files are served through /api/v1/accelerators/{id}/files/{type} endpoint.
        """
        # Parse metrics
        metrics_data = doc.get("metrics", [])
        metrics = []
        for m in metrics_data:
            if isinstance(m, dict) and "label" in m and "value" in m:
                metrics.append(MetricItem(label=m["label"], value=m["value"]))

        # Get accelerator ID
        accelerator_id = str(doc.get("id", doc.get("_id", "")))
        
        # Get blob paths (used to check if files exist)
        thumbnail_blob_path = doc.get("thumbnail_url", "")
        video_blob_path = doc.get("video_url", "")
        pdf_blob_path = doc.get("pdf_url", "")
        
        # Build secure proxy URLs instead of direct Azure URLs
        thumbnail_url = self._build_proxy_url(accelerator_id, "thumbnail", thumbnail_blob_path)
        video_url = self._build_proxy_url(accelerator_id, "video", video_blob_path)
        pdf_url = self._build_proxy_url(accelerator_id, "pdf", pdf_blob_path)

        return AcceleratorDetailResponse(
            id=accelerator_id,
            title=doc.get("title", ""),
            slug=doc.get("slug", ""),
            subtitle=doc.get("subtitle", ""),
            description=doc.get("description", ""),
            status=doc.get("status", "draft"),
            feature_on_homepage=doc.get("feature_on_homepage", False),
            display_order=doc.get("display_order", 0),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
            metrics=metrics,
            thumbnail_url=thumbnail_url,
            video_url=video_url,
            pdf_url=pdf_url,
        )

    async def create_accelerator(
        self, request: CreateAcceleratorRequest
    ) -> CreateAcceleratorResponse:
        """
        Create a new accelerator.
        
        Args:
            request: Create accelerator request data
            
        Returns:
            CreateAcceleratorResponse with ID and message
        """
        accelerator_data = request.model_dump()
        
        # Convert metrics to dict format for MongoDB
        accelerator_data["metrics"] = [
            {"label": m.label, "value": m.value} for m in request.metrics
        ]
        
        # Generate unique slug from title
        accelerator_data["slug"] = await self._generate_unique_slug(accelerator_data["title"])
        
        created = await self._repository.create(accelerator_data)
        return CreateAcceleratorResponse(
            id=str(created["id"]),
            message="Accelerator created successfully",
        )

    async def get_all_accelerators(
        self,
        status: Optional[str] = None,
        feature_on_homepage: Optional[bool] = None,
    ) -> List[AcceleratorDetailResponse]:
        """
        Get all accelerators with optional filters.
        
        Args:
            status: Filter by status
            feature_on_homepage: Filter by featured status
            
        Returns:
            List of AcceleratorDetailResponse
        """
        docs = await self._repository.get_all(
            status=status,
            feature_on_homepage=feature_on_homepage,
        )
        return [self._to_detail_response(doc) for doc in docs]

    async def get_accelerator_by_id(self, accelerator_id: str) -> AcceleratorDetailResponse:
        """
        Get a single accelerator by ID.
        
        Args:
            accelerator_id: Accelerator ID
            
        Returns:
            AcceleratorDetailResponse
            
        Raises:
            AcceleratorNotFoundError: If accelerator not found
        """
        doc = await self._repository.get_by_id(accelerator_id)
        if not doc:
            raise AcceleratorNotFoundError(accelerator_id)
        return self._to_detail_response(doc)

    async def update_accelerator(
        self, accelerator_id: str, request: UpdateAcceleratorRequest
    ) -> UpdateAcceleratorResponse:
        """
        Update an existing accelerator.
        
        Args:
            accelerator_id: Accelerator ID
            request: Update request with fields to update
            
        Returns:
            UpdateAcceleratorResponse
            
        Raises:
            AcceleratorNotFoundError: If accelerator not found
        """
        existing = await self._repository.get_by_id(accelerator_id)
        if not existing:
            raise AcceleratorNotFoundError(accelerator_id)

        update_data = request.model_dump(exclude_none=True)
        
        # Convert metrics to dict format if provided
        if "metrics" in update_data and update_data["metrics"]:
            update_data["metrics"] = [
                {"label": m.label, "value": m.value} for m in request.metrics
            ]

        # If title is updated, regenerate slug
        if "title" in update_data:
            update_data["slug"] = await self._generate_unique_slug(
                update_data["title"], exclude_id=accelerator_id
            )

        updated = await self._repository.update(accelerator_id, update_data)
        if not updated:
            raise AcceleratorNotFoundError(accelerator_id)
        
        return UpdateAcceleratorResponse(
            id=str(updated["id"]),
            message="Accelerator updated successfully",
        )

    async def delete_accelerator(self, accelerator_id: str) -> DeleteAcceleratorResponse:
        """
        Delete an accelerator by ID.
        
        Args:
            accelerator_id: Accelerator ID
            
        Returns:
            DeleteAcceleratorResponse
            
        Raises:
            AcceleratorNotFoundError: If accelerator not found
        """
        if not await self._repository.delete(accelerator_id):
            raise AcceleratorNotFoundError(accelerator_id)
        return DeleteAcceleratorResponse(
            id=accelerator_id,
            message="Accelerator deleted successfully",
        )

    async def reorder_accelerators(self, items: List[ReorderItem]) -> None:
        """
        Update display order for multiple accelerators.
        """
        payload = [{"id": item.id, "display_order": item.display_order} for item in items]
        await self._repository.reorder(payload)

    async def get_blob_paths(self, accelerator_id: str) -> Dict[str, str]:
        """
        Get blob paths for an accelerator's files.
        
        Args:
            accelerator_id: Accelerator ID
            
        Returns:
            Dictionary with video_url and pdf_url blob paths
        """
        return await self._repository.get_blob_paths(accelerator_id)

