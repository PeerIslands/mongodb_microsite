"""
Testimonial Service - Business logic layer for testimonial operations.
Handles validation, data transformation, and orchestrates repository calls.

Field naming convention: snake_case (matching frontend requirements)
"""

from typing import List, Optional, Dict, Any

from app.api.v1.models.testimonial import (
    CreateTestimonialRequest,
    CreateTestimonialResponse,
    UpdateTestimonialRequest,
    UpdateTestimonialResponse,
    TestimonialResponse,
    DeleteTestimonialResponse,
)
from app.api.v1.repositories.testimonial_repository import TestimonialRepository
from app.api.v1.repositories.case_study_repository import CaseStudyRepository
from app.api.v1.exceptions.testimonial_exceptions import (
    TestimonialNotFoundError,
    TestimonialValidationError,
)


class TestimonialService:
    """
    Service class for testimonial business logic.
    """

    def __init__(self, repository: TestimonialRepository, case_study_repository: CaseStudyRepository):
        """
        Initialize the service with repositories.
        
        Args:
            repository: TestimonialRepository instance
            case_study_repository: CaseStudyRepository instance for combined queries
        """
        self._repository = repository
        self._case_study_repository = case_study_repository

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _to_response(self, doc: dict) -> TestimonialResponse:
        """Convert document to TestimonialResponse."""
        return TestimonialResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            company_name=doc.get("company_name", ""),
            testimonial_quote=doc.get("testimonial_quote", ""),
            testimonial_author=doc.get("testimonial_author", ""),
            testimonial_position=doc.get("testimonial_position", ""),
            status=doc.get("status", "draft"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    # =========================================================================
    # SERVICE METHODS
    # =========================================================================

    async def create_testimonial(
        self, request: CreateTestimonialRequest
    ) -> CreateTestimonialResponse:
        """
        Create a new testimonial.
        
        Args:
            request: CreateTestimonialRequest with testimonial data
            
        Returns:
            CreateTestimonialResponse with id and message
        """
        # Convert request to dict for storage
        testimonial_data = request.model_dump()

        # Create in MongoDB
        created = await self._repository.create(testimonial_data)

        return CreateTestimonialResponse(
            id=str(created["id"]),
            message="Testimonial created successfully",
        )

    async def get_all_testimonials(
        self,
        status: Optional[str] = None,
    ) -> List[TestimonialResponse]:
        """
        Get all standalone testimonials with optional filters.
        
        Args:
            status: Filter by status ('published' or 'draft')
            
        Returns:
            List of TestimonialResponse objects
        """
        docs = await self._repository.get_all(status=status)
        
        return [self._to_response(doc) for doc in docs]

    async def get_combined_testimonials(self) -> List[Dict[str, Any]]:
        """
        Get all testimonials - combines standalone testimonials with case study testimonials.
        Returns published testimonials from both collections.
        
        Returns:
            List of testimonials with company information (Dict format matching case study endpoint)
        """
        testimonials = []
        
        # Get standalone testimonials (published only)
        standalone_docs = await self._repository.find_many({
            'status': 'published'
        })
        
        for doc in standalone_docs:
            testimonials.append({
                'id': str(doc['_id']),
                'company_name': doc.get('company_name', ''),
                'testimonial_quote': doc.get('testimonial_quote', ''),
                'testimonial_author': doc.get('testimonial_author', ''),
                'testimonial_position': doc.get('testimonial_position', ''),
                'source': 'testimonials'  # Indicate this is from standalone collection
            })
        
        # Get case study testimonials (published only, with both quote and author)
        case_study_docs = await self._case_study_repository.find_many({
            'status': 'published',
            'testimonial_quote': {'$exists': True, '$nin': ['', None]},
            'testimonial_author': {'$exists': True, '$nin': ['', None]}
        })
        
        for doc in case_study_docs:
            testimonial_quote = doc.get('testimonial_quote', '')
            testimonial_author = doc.get('testimonial_author', '')
            
            # Only include if we have both quote and author
            if testimonial_quote and testimonial_author:
                testimonials.append({
                    'id': str(doc['_id']),
                    'company_name': doc.get('company_name', ''),
                    'testimonial_quote': testimonial_quote,
                    'testimonial_author': testimonial_author,
                    'testimonial_position': doc.get('testimonial_position', ''),
                    'source': 'case_studies'  # Indicate this is from case studies
                })
        
        return testimonials

    async def get_testimonial_by_id(self, testimonial_id: str) -> TestimonialResponse:
        """
        Get a testimonial by its unique ID.
        
        Args:
            testimonial_id: The testimonial ID
            
        Returns:
            TestimonialResponse with full testimonial details
            
        Raises:
            TestimonialNotFoundError: If not found
        """
        doc = await self._repository.get_by_id(testimonial_id)
        
        if not doc:
            raise TestimonialNotFoundError(testimonial_id)

        return self._to_response(doc)

    async def update_testimonial(
        self,
        testimonial_id: str,
        request: UpdateTestimonialRequest,
    ) -> UpdateTestimonialResponse:
        """
        Update an existing testimonial.
        
        Args:
            testimonial_id: The testimonial ID to update
            request: UpdateTestimonialRequest with fields to update
            
        Returns:
            UpdateTestimonialResponse with id and message
            
        Raises:
            TestimonialNotFoundError: If testimonial not found
        """
        # Check if testimonial exists
        existing = await self._repository.get_by_id(testimonial_id)
        if not existing:
            raise TestimonialNotFoundError(testimonial_id)

        # Build update data
        update_data = request.model_dump(exclude_unset=True)

        # Update in MongoDB
        updated = await self._repository.update(testimonial_id, update_data)

        if not updated:
            raise TestimonialNotFoundError(testimonial_id)

        return UpdateTestimonialResponse(
            id=str(updated["id"]),
            message="Testimonial updated successfully",
        )

    async def delete_testimonial(self, testimonial_id: str) -> DeleteTestimonialResponse:
        """
        Delete a testimonial by its ID.
        
        Args:
            testimonial_id: The testimonial ID to delete
            
        Returns:
            DeleteTestimonialResponse with id and message
            
        Raises:
            TestimonialNotFoundError: If testimonial not found
        """
        # Check if testimonial exists
        existing = await self._repository.get_by_id(testimonial_id)
        if not existing:
            raise TestimonialNotFoundError(testimonial_id)

        # Delete from MongoDB
        deleted = await self._repository.delete(testimonial_id)
        
        if not deleted:
            raise TestimonialNotFoundError(testimonial_id)

        return DeleteTestimonialResponse(
            id=testimonial_id,
            message="Testimonial deleted successfully",
        )
