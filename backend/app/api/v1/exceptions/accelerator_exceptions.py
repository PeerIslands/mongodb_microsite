"""
Accelerator Exceptions - Custom exceptions for accelerator operations.

Exceptions:
- AcceleratorNotFoundError: Raised when accelerator is not found
- AcceleratorAlreadyExistsError: Raised when accelerator with same title exists
- AcceleratorValidationError: Raised for validation errors
"""

from fastapi import HTTPException, status


class AcceleratorNotFoundError(HTTPException):
    """Raised when an accelerator is not found."""
    
    def __init__(self, accelerator_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Accelerator with ID '{accelerator_id}' not found",
        )


class AcceleratorAlreadyExistsError(HTTPException):
    """Raised when an accelerator with the same title already exists."""
    
    def __init__(self, title: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Accelerator with title '{title}' already exists",
        )


class AcceleratorValidationError(HTTPException):
    """Raised for accelerator validation errors."""
    
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Accelerator validation error: {message}",
        )

