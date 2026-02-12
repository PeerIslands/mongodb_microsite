"""
Event Service - Business logic layer for event operations.
Handles validation, data transformation, and orchestrates repository calls.
"""

import re
import uuid
from datetime import datetime, timedelta
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
            title: Event title
            exclude_id: Optional ID to exclude (for updates)
            
        Returns:
            Unique slug string
        """
        base_slug = self._slugify(title)
        slug = base_slug

        # Ensure slug is not empty
        if not slug:
            slug = "event"

        counter = 1
        while await self._repository.slug_exists(slug, exclude_id):
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    # =========================================================================
    # RESPONSE HELPERS
    # =========================================================================

    def _to_response(self, doc: dict) -> EventResponse:
        """Convert document to EventResponse."""
        return EventResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            slug=doc.get("slug", ""),
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
            event_type=doc.get("event_type", "online"),
            location=doc.get("location", ""),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at", ""),
        )

    def _to_detail_response(self, doc: dict) -> EventDetailResponse:
        """Convert document to EventDetailResponse."""
        return EventDetailResponse(
            id=str(doc.get("id", doc.get("_id", ""))),
            title=doc.get("title", ""),
            slug=doc.get("slug", ""),
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
            event_type=doc.get("event_type", "online"),
            location=doc.get("location", ""),
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

        # Generate unique slug from title
        event_data["slug"] = await self._generate_unique_slug(event_data["title"])

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
            status: Filter by status ('draft', 'published', or 'archived')
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

        # If title is updated, regenerate slug
        if "title" in update_data:
            update_data["slug"] = await self._generate_unique_slug(
                update_data["title"], exclude_id=event_id
            )

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

    async def generate_calendar_file(self, event_id: str) -> str:
        """
        Generate an ICS calendar file for the event.
        
        Args:
            event_id: The event ID
            
        Returns:
            ICS file content as string
            
        Raises:
            EventNotFoundError: If event not found
        """
        doc = await self._repository.get_by_id(event_id)
        
        if not doc:
            raise EventNotFoundError(event_id)
        
        return self._generate_ics_content(doc)

    def _generate_ics_content(self, event_data: dict) -> str:
        """
        Generate ICS calendar content for an event.
        
        Args:
            event_data: Dictionary containing event details
            
        Returns:
            ICS file content as string with CRLF line endings
        """
        # Parse date and time
        event_date = event_data.get('date', '')
        event_time = event_data.get('time', '00:00')
        timezone = event_data.get('timezone', 'UTC')
        duration_minutes = event_data.get('duration_minutes', 60)
        
        # Create datetime string for ICS (format: YYYYMMDDTHHMMSS)
        try:
            dt = datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M")
            start_dt = dt.strftime("%Y%m%dT%H%M%S")
            end_dt = (dt + timedelta(minutes=duration_minutes)).strftime("%Y%m%dT%H%M%S")
        except ValueError:
            # Fallback if parsing fails
            start_dt = datetime.now().strftime("%Y%m%dT%H%M%S")
            end_dt = (datetime.now() + timedelta(hours=1)).strftime("%Y%m%dT%H%M%S")
        
        # Generate unique ID for the event
        uid = str(uuid.uuid4())
        
        # Determine location
        event_type = event_data.get('event_type', 'online')
        location = event_data.get('location', '')
        
        if not location:
            location = "Online Event" if event_type == 'online' else "TBD"
        
        # Escape special characters for ICS
        def escape_ics(text: str) -> str:
            if not text:
                return ""
            return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")
        
        title = escape_ics(event_data.get('title', 'Event'))
        description = escape_ics(event_data.get('description', ''))
        location_escaped = escape_ics(location)
        
        # Add meeting link to description if online
        if event_type in ('online', 'hybrid') and location:
            description = f"Join the meeting: {escape_ics(location)}"
        
        # Current timestamp for DTSTAMP
        now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        
        # Build ICS content with CRLF line endings (RFC 5545 requirement)
        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Peerislands//Event Registration//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now}",
            f"DTSTART;TZID={timezone}:{start_dt}",
            f"DTEND;TZID={timezone}:{end_dt}",
            f"SUMMARY:{title}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location_escaped}",
            "STATUS:CONFIRMED",
            "SEQUENCE:0",
            "END:VEVENT",
            "END:VCALENDAR"
        ]
        
        # Join with CRLF as required by RFC 5545
        return "\r\n".join(ics_lines)
