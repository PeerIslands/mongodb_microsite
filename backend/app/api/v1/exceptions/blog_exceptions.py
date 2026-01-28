"""
Blog-specific exceptions.
Custom exceptions for blog operations.
"""


class BlogError(Exception):
    """Base exception for blog-related errors."""
    
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class BlogNotFoundError(BlogError):
    """Exception raised when a blog is not found."""
    
    def __init__(self, identifier: str):
        self.identifier = identifier
        super().__init__(f"Blog not found: {identifier}")


class BlogAlreadyExistsError(BlogError):
    """Exception raised when a blog with same URL already exists."""
    
    def __init__(self, url: str):
        self.url = url
        super().__init__(f"Blog with URL already exists: {url}")


class BlogValidationError(BlogError):
    """Exception raised when blog validation fails."""
    
    def __init__(self, message: str):
        super().__init__(f"Validation error: {message}")

