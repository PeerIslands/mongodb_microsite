"""
Case Study Service - Business logic layer for case study operations.
Handles validation, data transformation, and orchestrates repository calls.

Field naming convention: snake_case (matching frontend requirements)

File Storage:
- Images and PDFs are stored in Azure Blob Storage
- MongoDB stores blob paths (e.g., "my-case-study/hero_image.png")
- Full URLs are constructed at retrieval time using the Azure Blob Service
"""

from typing import List, Optional, Dict, Any
import re

from app.api.v1.models.case_study import (
    CreateCaseStudyRequest,
    CreateCaseStudyResponse,
    UpdateCaseStudyRequest,
    UpdateCaseStudyResponse,
    CaseStudyResponse,
    CaseStudyDetailResponse,
    DeleteCaseStudyResponse,
    Metrics,
)
from app.api.v1.repositories.case_study_repository import CaseStudyRepository
from app.api.v1.services.azure_blob_service import get_azure_blob_service
from app.api.v1.exceptions.case_study_exceptions import (
    CaseStudyNotFoundError,
    CaseStudyValidationError,
)


class CaseStudyService:
    """
    Service class for case study business logic.
    """

    def __init__(self, repository: CaseStudyRepository):
        """
        Initialize the service with a repository.
        
        Args:
            repository: CaseStudyRepository instance
        """
        self._repository = repository
        self._blob_service = get_azure_blob_service()

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _validate_slug(self, slug: str) -> str:
        """
        Validate and normalize slug format.
        
        Args:
            slug: The slug to validate
            
        Returns:
            Normalized slug
            
        Raises:
            CaseStudyValidationError: If slug format is invalid
        """
        # Normalize: lowercase, replace spaces with hyphens
        slug = slug.lower().strip()
        slug = re.sub(r'\s+', '-', slug)
        slug = re.sub(r'[^a-z0-9-]', '', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')

        if not slug:
            raise CaseStudyValidationError("Slug cannot be empty")

        if len(slug) < 3:
            raise CaseStudyValidationError("Slug must be at least 3 characters")

        return slug

    def _get_file_value(self, doc: dict, field: str) -> str:
        """
        Get file field value, constructing full Azure Blob URL from blob path.
        
        Args:
            doc: MongoDB document
            field: Field name (hero_image, company_logo, etc.)
            
        Returns:
            Full Azure Blob URL if blob path exists, otherwise empty string
        """
        value = doc.get(field, "")
        
        if isinstance(value, str) and value:
            # Value is a blob path - construct full URL
            return self._blob_service.get_full_url(value)
        else:
            return ""
    
    def _get_blob_path(self, doc: dict, field: str) -> str:
        """
        Get raw blob path from document (without URL construction).
        Used internally when we need the path for deletion.
        
        Args:
            doc: MongoDB document
            field: Field name
            
        Returns:
            Blob path string or empty string
        """
        value = doc.get(field, "")
        return value if isinstance(value, str) else ""

    def _get_metrics(self, doc: dict) -> Metrics:
        """
        Get metrics object from document.
        """
        metrics_data = doc.get("metrics", {})
        if isinstance(metrics_data, dict):
            return Metrics(
                time_reduction=metrics_data.get("time_reduction"),
                ingestion_speed=metrics_data.get("ingestion_speed"),
                data_accuracy=metrics_data.get("data_accuracy"),
            )
        return Metrics()

    def _to_response(self, doc: dict) -> CaseStudyResponse:
        """Convert document to CaseStudyResponse."""
        return CaseStudyResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            slug=doc.get("slug", ""),
            featured=doc.get("featured", False),
            status=doc.get("status", "draft"),
            industry=doc.get("industry", ""),
            tech_stack=doc.get("tech_stack", []),
            migration_type=doc.get("migration_type"),
            company_name=doc.get("company_name", ""),
            company_logo=self._get_file_value(doc, "company_logo"),
            hero_image=self._get_file_value(doc, "hero_image"),
            description=doc.get("description", ""),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    def _to_detail_response(self, doc: dict) -> CaseStudyDetailResponse:
        """Convert document to CaseStudyDetailResponse."""
        return CaseStudyDetailResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            slug=doc.get("slug", ""),
            featured=doc.get("featured", False),
            status=doc.get("status", "draft"),
            industry=doc.get("industry", ""),
            tech_stack=doc.get("tech_stack", []),
            migration_type=doc.get("migration_type"),
            company_name=doc.get("company_name", ""),
            company_logo=self._get_file_value(doc, "company_logo"),
            hero_image=self._get_file_value(doc, "hero_image"),
            description=doc.get("description", ""),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
            industry_details=doc.get("industry_details"),
            challenges=doc.get("challenges", ""),
            technical_constraints=doc.get("technical_constraints"),
            approach=doc.get("approach", ""),
            architecture_diagram=self._get_file_value(doc, "architecture_diagram"),
            implementation_details=doc.get("implementation_details", ""),
            metrics=self._get_metrics(doc),
            business_outcomes=doc.get("business_outcomes", ""),
            testimonial_quote=doc.get("testimonial_quote"),
            testimonial_author=doc.get("testimonial_author"),
            testimonial_position=doc.get("testimonial_position"),
            pdf_url=self._get_file_value(doc, "pdf_url"),
        )

    # =========================================================================
    # SERVICE METHODS
    # =========================================================================

    async def create_case_study(
        self, request: CreateCaseStudyRequest
    ) -> CreateCaseStudyResponse:
        """
        Create a new case study.
        
        Processing Flow:
        1. Validate and normalize slug
        2. Convert request to dictionary
        3. Store in MongoDB
        4. Return success response
        
        Args:
            request: CreateCaseStudyRequest with case study data
            
        Returns:
            CreateCaseStudyResponse with id, slug, and message
        """
        # Validate slug
        normalized_slug = self._validate_slug(request.slug)

        # Convert request to dict for storage
        case_study_data = request.model_dump()
        case_study_data["slug"] = normalized_slug

        # Convert metrics model to dict
        if case_study_data.get("metrics"):
            if hasattr(case_study_data["metrics"], "model_dump"):
                case_study_data["metrics"] = case_study_data["metrics"].model_dump()

        # Create in MongoDB
        created = await self._repository.create(case_study_data)

        return CreateCaseStudyResponse(
            id=str(created["id"]),
            slug=created["slug"],
            message="Case study created successfully",
        )


    async def get_all_case_studies(
        self,
        industry: Optional[str] = None,
        status: Optional[str] = None,
        featured: Optional[bool] = None,
    ) -> List[CaseStudyResponse]:
        """
        Get all case studies with optional filters.
        
        Args:
            industry: Filter by industry
            status: Filter by status ('published' or 'draft')
            featured: Filter by featured flag (boolean)
            
        Returns:
            List of CaseStudyResponse objects
        """
        docs = await self._repository.get_all(
            industry=industry,
            status=status,
            featured=featured,
        )
        
        return [self._to_response(doc) for doc in docs]

    async def get_case_study_by_slug(self, slug: str) -> CaseStudyDetailResponse:
        """
        Get a case study by slug.
        
        Args:
            slug: The case study slug
            
        Returns:
            CaseStudyDetailResponse
            
        Raises:
            CaseStudyNotFoundError: If not found
        """
        doc = await self._repository.get_by_slug(slug)
        
        if not doc:
            raise CaseStudyNotFoundError(slug)

        return self._to_detail_response(doc)

    async def get_case_study_by_id(self, case_id: str) -> CaseStudyDetailResponse:
        """
        Get a case study by its unique ID.
        
        Args:
            case_id: The case study ID
            
        Returns:
            CaseStudyDetailResponse with full case study details
            
        Raises:
            CaseStudyNotFoundError: If not found
        """
        doc = await self._repository.get_by_id(case_id)
        
        if not doc:
            raise CaseStudyNotFoundError(case_id)

        return self._to_detail_response(doc)

    async def get_blob_paths(self, case_id: str) -> Dict[str, str]:
        """
        Get raw blob paths for a case study (without URL construction).
        Used for file deletion operations.
        
        Args:
            case_id: The case study ID
            
        Returns:
            Dict with field names as keys and blob paths as values
            
        Raises:
            CaseStudyNotFoundError: If not found
        """
        doc = await self._repository.get_by_id(case_id)
        
        if not doc:
            raise CaseStudyNotFoundError(case_id)

        file_fields = ["hero_image", "company_logo", "architecture_diagram", "pdf_url"]
        return {field: self._get_blob_path(doc, field) for field in file_fields}

    async def update_case_study(
        self,
        case_id: str,
        request: UpdateCaseStudyRequest,
    ) -> UpdateCaseStudyResponse:
        """
        Update an existing case study.
        
        Processing Flow:
        1. Check if case study exists
        2. Validate slug if provided
        3. Build update data (only non-None fields)
        4. Update in MongoDB
        5. Return success response
        
        Args:
            case_id: The case study ID to update
            request: UpdateCaseStudyRequest with fields to update
                     (blob paths for files are already included in request)
            
        Returns:
            UpdateCaseStudyResponse with id, slug, and message
            
        Raises:
            CaseStudyNotFoundError: If case study not found
        """
        # Check if case study exists
        existing = await self._repository.get_by_id(case_id)
        if not existing:
            raise CaseStudyNotFoundError(case_id)

        # Build update data - only include non-None fields
        update_data = request.model_dump(exclude_none=True)

        # Validate and normalize slug if provided
        if "slug" in update_data:
            update_data["slug"] = self._validate_slug(update_data["slug"])

        # Convert metrics model to dict if present
        if "metrics" in update_data and update_data["metrics"]:
            if hasattr(update_data["metrics"], "model_dump"):
                update_data["metrics"] = update_data["metrics"].model_dump()

        # Update in MongoDB
        updated = await self._repository.update(case_id, update_data)

        if not updated:
            raise CaseStudyNotFoundError(case_id)

        return UpdateCaseStudyResponse(
            id=str(updated["id"]),
            slug=updated["slug"],
            message="Case study updated successfully",
        )

    async def delete_case_study(self, case_id: str) -> DeleteCaseStudyResponse:
        """
        Delete a case study by its ID.
        
        Also deletes associated files from Azure Blob Storage.
        
        Args:
            case_id: The case study ID to delete
            
        Returns:
            DeleteCaseStudyResponse with id and message
            
        Raises:
            CaseStudyNotFoundError: If case study not found
        """
        # Check if case study exists
        existing = await self._repository.get_by_id(case_id)
        if not existing:
            raise CaseStudyNotFoundError(case_id)

        # Delete associated files from Azure Blob Storage
        file_fields = ["hero_image", "company_logo", "architecture_diagram", "pdf_url"]
        for field in file_fields:
            blob_path = self._get_blob_path(existing, field)
            if blob_path:
                await self._blob_service.delete_file(blob_path)

        # Delete from MongoDB
        deleted = await self._repository.delete(case_id)
        
        if not deleted:
            raise CaseStudyNotFoundError(case_id)

        return DeleteCaseStudyResponse(
            id=case_id,
            message="Case study deleted successfully",
        )
