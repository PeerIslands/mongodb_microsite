"""
Accelerator Service - Business logic for accelerator operations.

This service handles all business logic for accelerators including
CRUD operations and file management.

Note: Blob paths are stored in MongoDB, full Azure URLs are constructed on GET.
"""

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
)
from app.api.v1.repositories.accelerator_repository import AcceleratorRepository
from app.api.v1.exceptions.accelerator_exceptions import AcceleratorNotFoundError
from app.api.v1.services.azure_blob_service import get_azure_blob_service


class AcceleratorService:
    """Service for accelerator business logic."""

    def __init__(self, repository: AcceleratorRepository):
        """Initialize service with repository."""
        self._repository = repository

    def _to_response(self, doc: dict) -> AcceleratorResponse:
        """Convert MongoDB document to AcceleratorResponse."""
        return AcceleratorResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            subtitle=doc.get("subtitle", ""),
            description=doc.get("description", ""),
            status=doc.get("status", "draft"),
            feature_on_homepage=doc.get("feature_on_homepage", False),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        )

    def _to_detail_response(self, doc: dict) -> AcceleratorDetailResponse:
        """Convert MongoDB document to AcceleratorDetailResponse.
        
        Constructs full Azure URLs from blob paths for thumbnail_url, video_url and pdf_url.
        """
        # Parse metrics
        metrics_data = doc.get("metrics", [])
        metrics = []
        for m in metrics_data:
            if isinstance(m, dict) and "label" in m and "value" in m:
                metrics.append(MetricItem(label=m["label"], value=m["value"]))

        # Get Azure Blob Service to construct full URLs
        blob_service = get_azure_blob_service()
        
        # Convert blob paths to full Azure URLs
        thumbnail_blob_path = doc.get("thumbnail_url", "")
        video_blob_path = doc.get("video_url", "")
        pdf_blob_path = doc.get("pdf_url", "")
        
        thumbnail_url = blob_service.get_full_url(thumbnail_blob_path) if thumbnail_blob_path else ""
        video_url = blob_service.get_full_url(video_blob_path) if video_blob_path else ""
        pdf_url = blob_service.get_full_url(pdf_blob_path) if pdf_blob_path else ""

        return AcceleratorDetailResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            subtitle=doc.get("subtitle", ""),
            description=doc.get("description", ""),
            status=doc.get("status", "draft"),
            feature_on_homepage=doc.get("feature_on_homepage", False),
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

    async def get_blob_paths(self, accelerator_id: str) -> Dict[str, str]:
        """
        Get blob paths for an accelerator's files.
        
        Args:
            accelerator_id: Accelerator ID
            
        Returns:
            Dictionary with video_url and pdf_url blob paths
        """
        return await self._repository.get_blob_paths(accelerator_id)

