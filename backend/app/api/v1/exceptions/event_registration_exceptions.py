"""
Event Registration-specific exceptions.
Custom exceptions for event registration operations.
"""


class EventRegistrationError(Exception):
    """Base exception for event registration-related errors."""
    
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class EventRegistrationNotFoundError(EventRegistrationError):
    """Exception raised when an event registration is not found."""
    
    def __init__(self, identifier: str):
        self.identifier = identifier
        super().__init__(f"Event registration not found: {identifier}")


class DuplicateRegistrationError(EventRegistrationError):
    """Exception raised when a user tries to register for an event they're already registered for."""
    
    def __init__(self, user_id: str, event_id: str):
        self.user_id = user_id
        self.event_id = event_id
        super().__init__(f"User {user_id} is already registered for event {event_id}")


class EventRegistrationValidationError(EventRegistrationError):
    """Exception raised when event registration validation fails."""
    
    def __init__(self, message: str):
        super().__init__(f"Validation error: {message}")


class UserNotFoundForRegistrationError(EventRegistrationError):
    """Exception raised when user does not exist for registration."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        super().__init__(f"User not found: {user_id}")


class EventNotFoundForRegistrationError(EventRegistrationError):
    """Exception raised when event does not exist for registration."""
    
    def __init__(self, event_id: str):
        self.event_id = event_id
        super().__init__(f"Event not found: {event_id}")
