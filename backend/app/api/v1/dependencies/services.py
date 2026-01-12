"""
Dependency injection for services.
Provides singleton instances of services for FastAPI endpoints.
"""

from functools import lru_cache

from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.repositories.case_study_repository import CaseStudyRepository
from app.api.v1.services.user_service import UserService
from app.api.v1.services.auth_service import AuthService
from app.api.v1.services.case_study_service import CaseStudyService
from app.core.database import Database


# =============================================================================
# REPOSITORY SINGLETONS
# =============================================================================

def get_user_repository() -> UserRepository:
    """
    Get UserRepository instance with MongoDB connection.
    
    Returns:
        UserRepository instance
    """
    db = Database.get_db()
    return UserRepository(db)


def get_case_study_repository() -> CaseStudyRepository:
    """
    Get CaseStudyRepository instance with MongoDB connection.
    
    Returns:
        CaseStudyRepository instance
    """
    db = Database.get_db()
    return CaseStudyRepository(db)


# =============================================================================
# SERVICE SINGLETONS
# =============================================================================

def get_user_service() -> UserService:
    """
    Get UserService instance.
    
    Returns:
        UserService instance with injected repository
    """
    repository = get_user_repository()
    return UserService(repository)


def get_auth_service() -> AuthService:
    """
    Get AuthService instance.
    
    Returns:
        AuthService instance with injected repository
    """
    repository = get_user_repository()
    return AuthService(repository)


def get_case_study_service() -> CaseStudyService:
    """
    Get CaseStudyService instance.
    
    Returns:
        CaseStudyService instance with injected repository
    """
    repository = get_case_study_repository()
    return CaseStudyService(repository)

