"""
Case Study Exceptions - Custom exceptions for case study operations.
"""

from fastapi import HTTPException, status


class CaseStudyNotFoundError(HTTPException):
    """Exception raised when a case study is not found."""

    def __init__(self, identifier: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case study '{identifier}' not found",
        )


class CaseStudyAlreadyExistsError(HTTPException):
    """Exception raised when a case study with the same slug already exists."""

    def __init__(self, slug: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Case study with slug '{slug}' already exists",
        )


class CaseStudyValidationError(HTTPException):
    """Exception raised when case study validation fails."""

    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=message,
        )

