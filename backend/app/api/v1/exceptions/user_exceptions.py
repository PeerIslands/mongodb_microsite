"""
User-related custom exceptions.
"""


class UserBaseException(Exception):
    """Base exception for user-related errors."""
    
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class UserAlreadyExistsError(UserBaseException):
    """Raised when attempting to create a user with an existing email."""
    
    def __init__(self, email: str):
        super().__init__(f"User with email '{email}' already exists")
        self.email = email


class UserNotFoundError(UserBaseException):
    """Raised when a user is not found."""
    
    def __init__(self, identifier: str):
        super().__init__(f"User '{identifier}' not found")
        self.identifier = identifier


class UserValidationError(UserBaseException):
    """Raised when user data validation fails."""
    
    def __init__(self, field: str, message: str):
        super().__init__(f"Validation error for '{field}': {message}")
        self.field = field


class AuthenticationError(UserBaseException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message)

