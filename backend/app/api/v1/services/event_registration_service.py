"""
Event Registration Service - Business logic layer for event registration operations.
Handles validation, data transformation, and orchestrates repository calls.
"""

from typing import List, Optional

from app.api.v1.models.event_registration import (
    CreateEventRegistrationResponse,
    UpdateRegistrationStatusRequest,
    UpdateEventRegistrationResponse,
    EventRegistrationResponse,
    DeleteEventRegistrationResponse,
    EventRegistrationCountResponse,
    RegistrationStatus,
)
from app.api.v1.repositories.event_registration_repository import EventRegistrationRepository
from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.repositories.event_repository import EventRepository
from app.api.v1.exceptions.event_registration_exceptions import (
    EventRegistrationNotFoundError,
    DuplicateRegistrationError,
    UserNotFoundForRegistrationError,
    EventNotFoundForRegistrationError,
)


class EventRegistrationService:
    """
    Service class for event registration business logic.
    """

    def __init__(
        self,
        repository: EventRegistrationRepository,
        user_repository: UserRepository,
        event_repository: EventRepository,
    ):
        """
        Initialize the service with repositories.
        
        Args:
            repository: EventRegistrationRepository instance
            user_repository: UserRepository instance for user validation
            event_repository: EventRepository instance for event validation
        """
        self._repository = repository
        self._user_repository = user_repository
        self._event_repository = event_repository

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _to_response(self, doc: dict) -> EventRegistrationResponse:
        """Convert document to EventRegistrationResponse."""
        return EventRegistrationResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            user_id=doc.get("user_id", ""),
            event_id=doc.get("event_id", ""),
            status=doc.get("status", ""),
            registered_at=doc.get("registered_at", ""),
        )

    # =========================================================================
    # SERVICE METHODS
    # =========================================================================

    async def create_registration(
        self,
        user_id: str,
        event_id: str,
    ) -> CreateEventRegistrationResponse:
        """
        Create a new event registration.
        
        Args:
            user_id: User ID (from JWT token)
            event_id: Event ID to register for
            
        Returns:
            CreateEventRegistrationResponse with id and message
            
        Raises:
            UserNotFoundForRegistrationError: If user does not exist
            EventNotFoundForRegistrationError: If event does not exist
            DuplicateRegistrationError: If user is already registered for this event
        """
        # Check if user exists
        user = await self._user_repository.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundForRegistrationError(user_id)

        # Check if event exists
        event = await self._event_repository.get_by_id(event_id)
        if not event:
            raise EventNotFoundForRegistrationError(event_id)

        # Check for existing registration
        existing = await self._repository.get_by_user_and_event(user_id, event_id)
        if existing:
            raise DuplicateRegistrationError(user_id, event_id)

        # Prepare registration data
        registration_data = {
            "user_id": user_id,
            "event_id": event_id,
            "status": RegistrationStatus.REGISTERED.value,
        }

        # Create in MongoDB
        created = await self._repository.create(registration_data)

        return CreateEventRegistrationResponse(
            id=str(created["id"]),
            message="Registered successfully",
        )

    async def get_registrations_by_user(
        self,
        user_id: str,
        status: Optional[str] = None,
    ) -> List[EventRegistrationResponse]:
        """
        Get all registrations for a specific user.
        
        Args:
            user_id: The user ID
            status: Optional filter by status
            
        Returns:
            List of EventRegistrationResponse objects
        """
        docs = await self._repository.get_by_user_id(user_id, status=status)
        return [self._to_response(doc) for doc in docs]

    async def get_registrations_by_event(
        self,
        event_id: str,
        status: Optional[str] = None,
    ) -> List[EventRegistrationResponse]:
        """
        Get all registrations for a specific event.
        
        Args:
            event_id: The event ID
            status: Optional filter by status
            
        Returns:
            List of EventRegistrationResponse objects
        """
        docs = await self._repository.get_by_event_id(event_id, status=status)
        return [self._to_response(doc) for doc in docs]

    async def get_all_registrations(
        self,
        status: Optional[str] = None,
    ) -> List[EventRegistrationResponse]:
        """
        Get all registrations with optional filters.
        
        Args:
            status: Optional filter by status
            
        Returns:
            List of EventRegistrationResponse objects
        """
        docs = await self._repository.get_all(status=status)
        return [self._to_response(doc) for doc in docs]

    async def get_registration_by_id(
        self, registration_id: str
    ) -> EventRegistrationResponse:
        """
        Get a registration by its unique ID.
        
        Args:
            registration_id: The registration ID
            
        Returns:
            EventRegistrationResponse with registration details
            
        Raises:
            EventRegistrationNotFoundError: If not found
        """
        doc = await self._repository.get_by_id(registration_id)
        
        if not doc:
            raise EventRegistrationNotFoundError(registration_id)

        return self._to_response(doc)

    async def update_registration_status(
        self,
        registration_id: str,
        request: UpdateRegistrationStatusRequest,
    ) -> UpdateEventRegistrationResponse:
        """
        Update the status of an existing registration.
        
        Args:
            registration_id: The registration ID to update
            request: UpdateRegistrationStatusRequest with new status
            
        Returns:
            UpdateEventRegistrationResponse with id and message
            
        Raises:
            EventRegistrationNotFoundError: If registration not found
        """
        # Check if registration exists
        existing = await self._repository.get_by_id(registration_id)
        if not existing:
            raise EventRegistrationNotFoundError(registration_id)

        # Update status
        updated = await self._repository.update_status(
            registration_id, request.status.value
        )

        if not updated:
            raise EventRegistrationNotFoundError(registration_id)

        return UpdateEventRegistrationResponse(
            id=str(updated["id"]),
            message="Registration status updated successfully",
        )

    async def delete_registration(
        self, registration_id: str
    ) -> DeleteEventRegistrationResponse:
        """
        Delete a registration by its ID.
        
        Args:
            registration_id: The registration ID to delete
            
        Returns:
            DeleteEventRegistrationResponse with id and message
            
        Raises:
            EventRegistrationNotFoundError: If registration not found
        """
        # Check if registration exists
        existing = await self._repository.get_by_id(registration_id)
        if not existing:
            raise EventRegistrationNotFoundError(registration_id)

        # Delete from MongoDB
        deleted = await self._repository.delete(registration_id)
        
        if not deleted:
            raise EventRegistrationNotFoundError(registration_id)

        return DeleteEventRegistrationResponse(
            id=registration_id,
            message="Registration deleted successfully",
        )

    async def get_registration_count_by_event(
        self,
        event_id: str,
        status: Optional[str] = None,
    ) -> EventRegistrationCountResponse:
        """
        Get the count of registrations for an event.
        
        Args:
            event_id: The event ID
            status: Optional filter by status
            
        Returns:
            EventRegistrationCountResponse with count
        """
        count = await self._repository.get_count_by_event(event_id, status=status)
        return EventRegistrationCountResponse(
            event_id=event_id,
            count=count,
        )
