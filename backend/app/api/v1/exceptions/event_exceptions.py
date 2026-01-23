"""
Event-specific exceptions.
Custom exceptions for event operations.
"""


class EventError(Exception):
    """Base exception for event-related errors."""
    
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class EventNotFoundError(EventError):
    """Exception raised when an event is not found."""
    
    def __init__(self, identifier: str):
        self.identifier = identifier
        super().__init__(f"Event not found: {identifier}")


class EventValidationError(EventError):
    """Exception raised when event validation fails."""
    
    def __init__(self, message: str):
        super().__init__(f"Validation error: {message}")
