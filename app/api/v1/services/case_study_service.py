"""
Case Study Service - Business logic layer for case study operations.
Handles validation, data transformation, and orchestrates repository calls.
"""

import base64
from typing import List, Optional, Dict, Any
import re

from bson import Binary

from app.api.v1.models.case_study import (
    CreateCaseStudyRequest,
    CreateCaseStudyResponse,
    UpdateCaseStudyRequest,
    UpdateCaseStudyResponse,
    CaseStudyResponse,
    CaseStudyDetailResponse,
)
from app.api.v1.repositories.case_study_repository import CaseStudyRepository
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

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _binary_to_data_url(self, file_data: Dict[str, Any]) -> str:
        """
        Convert BSON Binary file data to a base64 data URL for frontend use.
        
        Args:
            file_data: Dict with 'data' (Binary), 'content_type', etc.
            
        Returns:
            Data URL string like: data:image/png;base64,iVBORw0KGgo...
        """
        if not file_data or not isinstance(file_data, dict):
            return ""
        
        binary_data = file_data.get("data")
        content_type = file_data.get("content_type", "application/octet-stream")
        
        if not binary_data:
            return ""
        
        # Convert Binary to bytes, then to base64
        if isinstance(binary_data, Binary):
            raw_bytes = bytes(binary_data)
        elif isinstance(binary_data, bytes):
            raw_bytes = binary_data
        else:
            return ""
        
        base64_content = base64.b64encode(raw_bytes).decode("utf-8")
        return f"data:{content_type};base64,{base64_content}"

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
        Get file field value, converting Binary to data URL if needed.
        
        Handles both:
        - Old format: string (URL or base64)
        - New format: dict with Binary data
        """
        value = doc.get(field, "")
        
        if isinstance(value, dict) and "data" in value:
            # New format: Binary data stored as dict
            return self._binary_to_data_url(value)
        elif isinstance(value, str):
            # Old format: already a string (URL or base64)
            return value
        else:
            return ""

    def _to_response(self, doc: dict) -> CaseStudyResponse:
        """Convert document to CaseStudyResponse."""
        return CaseStudyResponse(
            id=doc.get("id", doc.get("_id", "")),
            slug=doc.get("slug", ""),
            title=doc.get("title", ""),
            industry=doc.get("industry", ""),
            migrationType=doc.get("migrationType", ""),
            techStack=doc.get("techStack", []),
            status=doc.get("status", "draft"),
            featured=doc.get("featured", False),
            views=doc.get("views", 0),
            createdAt=doc.get("createdAt", ""),
            updatedAt=doc.get("updatedAt", ""),
            companyName=doc.get("companyName", ""),
            companyLogo=self._get_file_value(doc, "companyLogo"),
            heroImage=self._get_file_value(doc, "heroImage"),
            summary=doc.get("summary", ""),
        )

    def _to_detail_response(self, doc: dict) -> CaseStudyDetailResponse:
        """Convert document to CaseStudyDetailResponse."""
        return CaseStudyDetailResponse(
            id=doc.get("id", doc.get("_id", "")),
            slug=doc.get("slug", ""),
            title=doc.get("title", ""),
            industry=doc.get("industry", ""),
            migrationType=doc.get("migrationType", ""),
            techStack=doc.get("techStack", []),
            status=doc.get("status", "draft"),
            featured=doc.get("featured", False),
            views=doc.get("views", 0),
            createdAt=doc.get("createdAt", ""),
            updatedAt=doc.get("updatedAt", ""),
            companyName=doc.get("companyName", ""),
            companyLogo=self._get_file_value(doc, "companyLogo"),
            heroImage=self._get_file_value(doc, "heroImage"),
            summary=doc.get("summary", ""),
            description=doc.get("description", ""),
            industryDetails=doc.get("industryDetails"),
            challenges=doc.get("challenges", []),
            businessImpact=doc.get("businessImpact", ""),
            technicalConstraints=doc.get("technicalConstraints"),
            solutionApproach=doc.get("solutionApproach", ""),
            architectureDiagram=self._get_file_value(doc, "architectureDiagram"),
            implementationDetails=doc.get("implementationDetails", ""),
            codeSnippets=doc.get("codeSnippets"),
            metrics=doc.get("metrics", []),
            businessOutcomes=doc.get("businessOutcomes", []),
            testimonialQuote=doc.get("testimonialQuote"),
            testimonialAuthor=doc.get("testimonialAuthor"),
            testimonialPosition=doc.get("testimonialPosition"),
            galleryImages=doc.get("galleryImages"),
            pdfUrl=self._get_file_value(doc, "pdfUrl"),
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

        # Convert nested models to dicts
        case_study_data["challenges"] = [
            c if isinstance(c, dict) else c.model_dump() 
            for c in case_study_data.get("challenges", [])
        ]
        case_study_data["metrics"] = [
            m if isinstance(m, dict) else m.model_dump() 
            for m in case_study_data.get("metrics", [])
        ]
        case_study_data["businessOutcomes"] = [
            o if isinstance(o, dict) else o.model_dump() 
            for o in case_study_data.get("businessOutcomes", [])
        ]
        if case_study_data.get("codeSnippets"):
            case_study_data["codeSnippets"] = [
                s if isinstance(s, dict) else s.model_dump() 
                for s in case_study_data["codeSnippets"]
            ]

        # Create in MongoDB
        created = await self._repository.create(case_study_data)

        return CreateCaseStudyResponse(
            id=created["id"],
            slug=created["slug"],
            message="Case study created successfully",
        )

    async def create_case_study_with_files(
        self,
        request: CreateCaseStudyRequest,
        file_data: Dict[str, Dict[str, Any]]
    ) -> CreateCaseStudyResponse:
        """
        Create a new case study with raw binary file data.
        
        Args:
            request: CreateCaseStudyRequest with case study data
            file_data: Dict mapping field names to file dicts with Binary data
                       e.g., {"heroImage": {"data": Binary(...), "content_type": "image/png", ...}}
            
        Returns:
            CreateCaseStudyResponse with id, slug, and message
        """
        # Validate slug
        normalized_slug = self._validate_slug(request.slug)

        # Convert request to dict for storage
        case_study_data = request.model_dump()
        case_study_data["slug"] = normalized_slug

        # Convert nested models to dicts
        case_study_data["challenges"] = [
            c if isinstance(c, dict) else c.model_dump() 
            for c in case_study_data.get("challenges", [])
        ]
        case_study_data["metrics"] = [
            m if isinstance(m, dict) else m.model_dump() 
            for m in case_study_data.get("metrics", [])
        ]
        case_study_data["businessOutcomes"] = [
            o if isinstance(o, dict) else o.model_dump() 
            for o in case_study_data.get("businessOutcomes", [])
        ]
        if case_study_data.get("codeSnippets"):
            case_study_data["codeSnippets"] = [
                s if isinstance(s, dict) else s.model_dump() 
                for s in case_study_data["codeSnippets"]
            ]

        # Add binary file data directly to the document
        # These will be stored as BSON Binary in MongoDB
        for field_name, file_dict in file_data.items():
            if file_dict:
                case_study_data[field_name] = file_dict

        # Create in MongoDB
        created = await self._repository.create(case_study_data)

        return CreateCaseStudyResponse(
            id=created["id"],
            slug=created["slug"],
            message="Case study created successfully with files",
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
            status: Filter by status
            featured: Filter by featured flag
            
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

    async def increment_views(self, slug: str) -> dict:
        """
        Track a view for a case study.
        
        Args:
            slug: The case study slug
            
        Returns:
            Dict with success status and view count
        """
        new_count = await self._repository.increment_views(slug)
        
        if new_count is None:
            raise CaseStudyNotFoundError(slug)

        return {"success": True, "views": new_count}

    async def update_case_study(
        self,
        case_id: str,
        request: UpdateCaseStudyRequest,
        file_data: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> UpdateCaseStudyResponse:
        """
        Update an existing case study.
        
        Processing Flow:
        1. Check if case study exists
        2. Validate slug if provided
        3. Build update data (only non-None fields)
        4. Add binary file data if provided
        5. Update in MongoDB
        6. Return success response
        
        Args:
            case_id: The case study ID to update
            request: UpdateCaseStudyRequest with fields to update
            file_data: Optional dict mapping field names to file dicts with Binary data
            
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

        # Convert nested models to dicts if present
        if "challenges" in update_data:
            update_data["challenges"] = [
                c if isinstance(c, dict) else c.model_dump() 
                for c in update_data["challenges"]
            ]
        if "metrics" in update_data:
            update_data["metrics"] = [
                m if isinstance(m, dict) else m.model_dump() 
                for m in update_data["metrics"]
            ]
        if "businessOutcomes" in update_data:
            update_data["businessOutcomes"] = [
                o if isinstance(o, dict) else o.model_dump() 
                for o in update_data["businessOutcomes"]
            ]
        if "codeSnippets" in update_data and update_data["codeSnippets"]:
            update_data["codeSnippets"] = [
                s if isinstance(s, dict) else s.model_dump() 
                for s in update_data["codeSnippets"]
            ]

        # Add binary file data if provided
        if file_data:
            for field_name, file_dict in file_data.items():
                if file_dict:
                    update_data[field_name] = file_dict

        # Update in MongoDB
        updated = await self._repository.update(case_id, update_data)

        if not updated:
            raise CaseStudyNotFoundError(case_id)

        return UpdateCaseStudyResponse(
            id=updated["id"],
            slug=updated["slug"],
            message="Case study updated successfully",
        )

