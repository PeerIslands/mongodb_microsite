"""
Case Study Service - Business logic layer for case study operations.
Handles validation, data transformation, and orchestrates repository calls.

Field naming convention: snake_case (matching frontend requirements)

File Storage:
- PDFs are stored in Azure Blob Storage
- MongoDB stores blob paths (e.g., "casestudies/abc123/pdf_url.pdf")
- Secure proxy URLs are returned instead of direct Azure URLs
"""

from typing import List, Optional, Dict, Any

from app.api.v1.models.case_study import (
    CreateCaseStudyRequest,
    CreateCaseStudyResponse,
    UpdateCaseStudyRequest,
    UpdateCaseStudyResponse,
    CaseStudyResponse,
    CaseStudyDetailResponse,
    DeleteCaseStudyResponse,
    MetricItem,
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

    def _build_proxy_url(self, case_id: str, file_type: str, blob_path: str) -> str:
        """
        Build a secure proxy URL for file access.
        
        Instead of exposing Azure Blob URLs with SAS tokens, we return
        a backend proxy URL that streams the file securely.
        
        Args:
            case_id: The case study ID
            file_type: Type of file (pdf)
            blob_path: The blob path (to check if file exists)
            
        Returns:
            Proxy URL like /api/v1/case-studies/{id}/files/{type}
        """
        if not blob_path:
            return ""
        return f"/api/v1/case-studies/{case_id}/files/{file_type}"

    def _get_file_value(self, doc: dict, field: str, case_id: str) -> str:
        """
        Get file field value as a secure proxy URL.
        
        Args:
            doc: MongoDB document
            field: Field name (pdf_url, etc.)
            case_id: The case study ID for building proxy URL
            
        Returns:
            Proxy URL if blob path exists, otherwise empty string
        """
        value = doc.get(field, "")
        
        if isinstance(value, str) and value:
            # Map field name to file type
            file_type_map = {"pdf_url": "pdf"}
            file_type = file_type_map.get(field, "pdf")
            return self._build_proxy_url(case_id, file_type, value)
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

    def _process_challenges(self, challenges_data):
        """
        Process challenges field - handles both string and list formats.
        MongoDB might have: string OR [{'text': '...'}, ...]
        """
        if isinstance(challenges_data, str):
            return challenges_data
        elif isinstance(challenges_data, list):
            # Extract 'text' from list of dicts and join with newlines
            texts = [item.get('text', '') if isinstance(item, dict) else str(item) for item in challenges_data]
            return '\n'.join(filter(None, texts))
        return ""

    def _get_metrics(self, doc: dict) -> List[MetricItem]:
        """
        Get metrics list from document.
        Metrics is an array of {label, value} objects.
        """
        metrics_data = doc.get("metrics", [])
        if isinstance(metrics_data, list):
            metrics = []
            for item in metrics_data[:5]:  # Limit to 5 items
                if isinstance(item, dict) and "label" in item and "value" in item:
                    metrics.append(MetricItem(
                        label=str(item["label"]),
                        value=str(item["value"]),
                    ))
            return metrics
        return []

    def _to_response(self, doc: dict) -> CaseStudyResponse:
        """Convert document to CaseStudyResponse."""
        return CaseStudyResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            featured=doc.get("featured", False),
            status=doc.get("status", "draft"),
            industry=doc.get("industry", ""),
            tech_stack=doc.get("tech_stack", []),
            migration_type=doc.get("migration_type"),
            company_name=doc.get("company_name", ""),
            description=doc.get("description", ""),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    def _to_detail_response(self, doc: dict) -> CaseStudyDetailResponse:
        """Convert document to CaseStudyDetailResponse.
        
        Returns secure proxy URLs instead of direct Azure Blob URLs.
        Files are served through /api/v1/case-studies/{id}/files/{type} endpoint.
        """
        case_id = str(doc.get("id", doc.get("_id", "")))
        
        return CaseStudyDetailResponse(
            id=case_id,
            title=doc.get("title", ""),
            featured=doc.get("featured", False),
            status=doc.get("status", "draft"),
            industry=doc.get("industry", ""),
            tech_stack=doc.get("tech_stack", []),
            migration_type=doc.get("migration_type"),
            company_name=doc.get("company_name", ""),
            description=doc.get("description", ""),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
            challenges=self._process_challenges(doc.get("challenges", "")),
            approach=doc.get("approach", ""),
            metrics=self._get_metrics(doc),
            business_outcomes=doc.get("business_outcomes", ""),
            testimonial_quote=doc.get("testimonial_quote"),
            testimonial_author=doc.get("testimonial_author"),
            testimonial_position=doc.get("testimonial_position"),
            pdf_url=self._get_file_value(doc, "pdf_url", case_id),
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
        1. Convert request to dictionary
        2. Store in MongoDB
        3. Return success response
        
        Args:
            request: CreateCaseStudyRequest with case study data
            
        Returns:
            CreateCaseStudyResponse with id and message
        """
        # Convert request to dict for storage
        case_study_data = request.model_dump()

        # Convert metrics models to dicts
        if case_study_data.get("metrics"):
            case_study_data["metrics"] = [
                m.model_dump() if hasattr(m, "model_dump") else m 
                for m in case_study_data["metrics"]
            ]

        # Create in MongoDB
        created = await self._repository.create(case_study_data)

        return CreateCaseStudyResponse(
            id=str(created["id"]),
            message="Case study created successfully",
        )


    async def get_all_case_studies(
        self,
        industry: Optional[str] = None,
        status: Optional[str] = None,
        featured: Optional[bool] = None,
    ) -> List[CaseStudyDetailResponse]:
        """
        Get all case studies with optional filters.
        
        Args:
            industry: Filter by industry
            status: Filter by status ('published' or 'draft')
            featured: Filter by featured flag (boolean)
            
        Returns:
            List of CaseStudyDetailResponse objects (includes metrics)
        """
        docs = await self._repository.get_all(
            industry=industry,
            status=status,
            featured=featured,
        )
        
        return [self._to_detail_response(doc) for doc in docs]

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

        # Only pdf_url remains as file field
        file_fields = ["pdf_url"]
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
        2. Build update data (only non-None fields)
        3. Update in MongoDB
        4. Return success response
        
        Args:
            case_id: The case study ID to update
            request: UpdateCaseStudyRequest with fields to update
                     (blob paths for files are already included in request)
            
        Returns:
            UpdateCaseStudyResponse with id and message
            
        Raises:
            CaseStudyNotFoundError: If case study not found
        """
        # Check if case study exists
        existing = await self._repository.get_by_id(case_id)
        if not existing:
            raise CaseStudyNotFoundError(case_id)

        # Build update data - only include non-None fields
        update_data = request.model_dump(exclude_none=True)

        # Convert metrics models to dicts if present
        if "metrics" in update_data and update_data["metrics"]:
            update_data["metrics"] = [
                m.model_dump() if hasattr(m, "model_dump") else m 
                for m in update_data["metrics"]
            ]

        # Update in MongoDB
        updated = await self._repository.update(case_id, update_data)

        if not updated:
            raise CaseStudyNotFoundError(case_id)

        return UpdateCaseStudyResponse(
            id=str(updated["id"]),
            message="Case study updated successfully",
        )

    async def get_testimonials(self) -> List[Dict[str, Any]]:
        """
        Get all testimonials from case studies that have testimonial data.
        
        Returns:
            List of testimonials with company info
        """
        # Get all published case studies with testimonials
        docs = await self._repository.find_many({
            'status': 'published',
            'testimonial_quote': {'$exists': True, '$nin': ['', None]},
            'testimonial_author': {'$exists': True, '$nin': ['', None]}
        })
        
        print(f"🔍 Found {len(docs)} case studies with testimonial data")
        
        testimonials = []
        for doc in docs:
            testimonial_quote = doc.get('testimonial_quote', '')
            testimonial_author = doc.get('testimonial_author', '')
            testimonial_position = doc.get('testimonial_position', '')
            
            print(f"📝 Processing: {doc.get('company_name')} - Author: '{testimonial_author}', Quote: '{testimonial_quote[:50]}...'")
            
            # Only include if we have both quote and author
            if testimonial_quote and testimonial_author:
                testimonials.append({
                    'id': str(doc['_id']),
                    'company_name': doc.get('company_name', ''),
                    'testimonial_quote': testimonial_quote,
                    'testimonial_author': testimonial_author,
                    'testimonial_position': testimonial_position or ''
                })
        
        print(f"✅ Returning {len(testimonials)} testimonials")
        return testimonials

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
        # Only pdf_url remains as file field
        file_fields = ["pdf_url"]
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
