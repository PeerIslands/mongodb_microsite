"""
Testimonial Exceptions - Custom exceptions for testimonial operations.
"""

from fastapi import HTTPException, status


class TestimonialNotFoundError(HTTPException):
    """Exception raised when a testimonial is not found."""

    def __init__(self, identifier: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Testimonial '{identifier}' not found",
        )


class TestimonialValidationError(HTTPException):
    """Exception raised when testimonial validation fails."""

    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=message,
        )
