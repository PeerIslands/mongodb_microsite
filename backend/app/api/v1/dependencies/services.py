"""
Dependency injection for services.
Provides singleton instances of services for FastAPI endpoints.
Updated to include TOTP repository for MFA support.
"""

from functools import lru_cache

from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.repositories.case_study_repository import CaseStudyRepository
from app.api.v1.repositories.totp_repository import TOTPRepository
from app.api.v1.repositories.blog_repository import BlogRepository
from app.api.v1.services.user_service import UserService
from app.api.v1.services.auth_service import AuthService
from app.api.v1.services.case_study_service import CaseStudyService
from app.api.v1.services.password_reset_service import PasswordResetService
from app.api.v1.services.blog_service import BlogService
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


def get_totp_repository() -> TOTPRepository:
    """
    Get TOTPRepository instance with MongoDB connection (NEW).
    
    Returns:
        TOTPRepository instance
    """
    db = Database.get_db()
    return TOTPRepository(db)


def get_blog_repository() -> BlogRepository:
    """
    Get BlogRepository instance with MongoDB connection.
    
    Returns:
        BlogRepository instance
    """
    db = Database.get_db()
    return BlogRepository(db)


# =============================================================================
# SERVICE SINGLETONS
# =============================================================================

def get_user_service() -> UserService:
    """
    UPDATED: Get UserService instance with TOTP repository.
    
    Returns:
        UserService instance with injected repositories
    """
    user_repository = get_user_repository()
    totp_repository = get_totp_repository()
    return UserService(user_repository, totp_repository)


def get_auth_service() -> AuthService:
    """
    UPDATED: Get AuthService instance with TOTP repository.
    
    Returns:
        AuthService instance with injected repositories
    """
    user_repository = get_user_repository()
    totp_repository = get_totp_repository()
    return AuthService(user_repository, totp_repository)


def get_case_study_service() -> CaseStudyService:
    """
    Get CaseStudyService instance.
    
    Returns:
        CaseStudyService instance with injected repository
    """
    repository = get_case_study_repository()
    return CaseStudyService(repository)


def get_password_reset_service() -> PasswordResetService:
    """
    Get PasswordResetService instance (NEW).
    
    Returns:
        PasswordResetService instance with injected repositories
    """
    user_repository = get_user_repository()
    totp_repository = get_totp_repository()
    return PasswordResetService(user_repository, totp_repository)


def get_blog_service() -> BlogService:
    """
    Get BlogService instance.
    
    Returns:
        BlogService instance with injected repository
    """
    repository = get_blog_repository()
    return BlogService(repository)

