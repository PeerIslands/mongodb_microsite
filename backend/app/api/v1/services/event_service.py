"""
Event Service - Business logic layer for event operations.
Handles validation, data transformation, and orchestrates repository calls.
"""

from typing import List, Optional

from app.api.v1.models.event import (
    CreateEventRequest,
    CreateEventResponse,
    UpdateEventRequest,
    UpdateEventResponse,
    EventResponse,
    EventDetailResponse,
    DeleteEventResponse,
)
from app.api.v1.repositories.event_repository import EventRepository
from app.api.v1.exceptions.event_exceptions import EventNotFoundError


class EventService:
    """
    Service class for event business logic.
    """

    def __init__(self, repository: EventRepository):
        """
        Initialize the service with a repository.
        
        Args:
            repository: EventRepository instance
        """
        self._repository = repository

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _to_response(self, doc: dict) -> EventResponse:
        """Convert document to EventResponse."""
        return EventResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            subtitle=doc.get("subtitle", ""),
            date=doc.get("date", ""),
            time=doc.get("time", ""),
            timezone=doc.get("timezone", ""),
            duration_minutes=doc.get("duration_minutes", 0),
            description=doc.get("description", ""),
            attendee_value=doc.get("attendee_value", ""),
            category=doc.get("category", ""),
            featured=doc.get("featured", False),
            status=doc.get("status", "draft"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    def _to_detail_response(self, doc: dict) -> EventDetailResponse:
        """Convert document to EventDetailResponse."""
        return EventDetailResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            subtitle=doc.get("subtitle", ""),
            date=doc.get("date", ""),
            time=doc.get("time", ""),
            timezone=doc.get("timezone", ""),
            duration_minutes=doc.get("duration_minutes", 0),
            description=doc.get("description", ""),
            attendee_value=doc.get("attendee_value", ""),
            category=doc.get("category", ""),
            featured=doc.get("featured", False),
            status=doc.get("status", "draft"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    # =========================================================================
    # SERVICE METHODS
    # =========================================================================

    async def create_event(
        self, request: CreateEventRequest
    ) -> CreateEventResponse:
        """
        Create a new event.
        
        Args:
            request: CreateEventRequest with event data
            
        Returns:
            CreateEventResponse with id and message
        """
        # Convert request to dict for storage
        event_data = request.model_dump()
        
        # Convert enum to string
        if event_data.get("status"):
            event_data["status"] = event_data["status"].value if hasattr(event_data["status"], "value") else event_data["status"]

        # Create in MongoDB
        created = await self._repository.create(event_data)

        return CreateEventResponse(
            id=str(created["id"]),
            message="Event created successfully",
        )

    async def get_all_events(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        featured: Optional[bool] = None,
    ) -> List[EventResponse]:
        """
        Get all events with optional filters.
        
        Args:
            category: Filter by category
            status: Filter by status ('published' or 'draft')
            featured: Filter by featured status
            
        Returns:
            List of EventResponse objects
        """
        docs = await self._repository.get_all(
            category=category,
            status=status,
            featured=featured,
        )
        
        return [self._to_response(doc) for doc in docs]

    async def get_event_by_id(self, event_id: str) -> EventDetailResponse:
        """
        Get an event by its unique ID.
        
        Args:
            event_id: The event ID
            
        Returns:
            EventDetailResponse with full event details
            
        Raises:
            EventNotFoundError: If not found
        """
        doc = await self._repository.get_by_id(event_id)
        
        if not doc:
            raise EventNotFoundError(event_id)

        return self._to_detail_response(doc)

    async def update_event(
        self,
        event_id: str,
        request: UpdateEventRequest,
    ) -> UpdateEventResponse:
        """
        Update an existing event.
        
        Args:
            event_id: The event ID to update
            request: UpdateEventRequest with fields to update
            
        Returns:
            UpdateEventResponse with id and message
            
        Raises:
            EventNotFoundError: If event not found
        """
        # Check if event exists
        existing = await self._repository.get_by_id(event_id)
        if not existing:
            raise EventNotFoundError(event_id)

        # Build update data - only include non-None fields
        update_data = request.model_dump(exclude_none=True)

        # Convert enum to string if present
        if update_data.get("status"):
            update_data["status"] = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]

        # Update in MongoDB
        updated = await self._repository.update(event_id, update_data)

        if not updated:
            raise EventNotFoundError(event_id)

        return UpdateEventResponse(
            id=str(updated["id"]),
            message="Event updated successfully",
        )

    async def delete_event(self, event_id: str) -> DeleteEventResponse:
        """
        Delete an event by its ID.
        
        Args:
            event_id: The event ID to delete
            
        Returns:
            DeleteEventResponse with id and message
            
        Raises:
            EventNotFoundError: If event not found
        """
        # Check if event exists
        existing = await self._repository.get_by_id(event_id)
        if not existing:
            raise EventNotFoundError(event_id)

        # Delete from MongoDB
        deleted = await self._repository.delete(event_id)
        
        if not deleted:
            raise EventNotFoundError(event_id)

        return DeleteEventResponse(
            id=event_id,
            message="Event deleted successfully",
        )

    async def get_categories(self) -> List[str]:
        """
        Get all unique event categories.
        
        Returns:
            List of category names
        """
        return await self._repository.get_categories()
