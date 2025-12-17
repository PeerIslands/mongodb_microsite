"""
Dependency injection for services.
Provides singleton instances of services for FastAPI endpoints.
"""

from functools import lru_cache

from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.services.user_service import UserService
from app.api.v1.services.auth_service import AuthService


# =============================================================================
# REPOSITORY SINGLETONS
# =============================================================================

@lru_cache()
def get_user_repository() -> UserRepository:
    """
    Get singleton UserRepository instance.
    
    Returns:
        UserRepository instance
    """
    return UserRepository()


# =============================================================================
# SERVICE SINGLETONS
# =============================================================================

@lru_cache()
def get_user_service() -> UserService:
    """
    Get singleton UserService instance.
    
    Returns:
        UserService instance with injected repository
    """
    repository = get_user_repository()
    return UserService(repository)


@lru_cache()
def get_auth_service() -> AuthService:
    """
    Get singleton AuthService instance.
    
    Returns:
        AuthService instance with injected repository
    """
    repository = get_user_repository()
    return AuthService(repository)

