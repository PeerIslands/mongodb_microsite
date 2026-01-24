"""
Dependency injection for services.
Provides singleton instances of services for FastAPI endpoints.
Updated to include TOTP repository for MFA support.
Updated to include Accelerator repository and service.
Updated to include authentication dependency for protected endpoints.
"""

from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


from app.api.v1.repositories.user_repository import UserRepository
from app.api.v1.repositories.case_study_repository import CaseStudyRepository
from app.api.v1.repositories.totp_repository import TOTPRepository
from app.api.v1.repositories.blog_repository import BlogRepository
from app.api.v1.repositories.accelerator_repository import AcceleratorRepository
from app.api.v1.repositories.event_repository import EventRepository
from app.api.v1.repositories.analytics_repository import AnalyticsRepository
from app.api.v1.services.user_service import UserService
from app.api.v1.services.auth_service import AuthService
from app.api.v1.services.case_study_service import CaseStudyService
from app.api.v1.services.password_reset_service import PasswordResetService
from app.api.v1.services.blog_service import BlogService
from app.api.v1.services.accelerator_service import AcceleratorService
from app.api.v1.services.analytics_service import AnalyticsService
from app.api.v1.models.user import UserModel
from app.api.v1.services.event_service import EventService
from app.core.database import Database

# Security scheme for JWT authentication
security = HTTPBearer()


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


def get_accelerator_repository() -> AcceleratorRepository:
    """
    Get AcceleratorRepository instance with MongoDB connection.
    
    Returns:
        AcceleratorRepository instance
    """
    db = Database.get_db()
    return AcceleratorRepository(db)


def get_event_repository() -> EventRepository:
    """
    Get EventRepository instance with MongoDB connection.
    
    Returns:
        EventRepository instance
    """
    db = Database.get_db()
    return EventRepository(db)


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


def get_accelerator_service() -> AcceleratorService:
    """
    Get AcceleratorService instance.
    
    Returns:
        AcceleratorService instance with injected repository
    """
    repository = get_accelerator_repository()
    return AcceleratorService(repository)


def get_analytics_service() -> AnalyticsService:
    """
    Get AnalyticsService instance.
    
    Returns:
        AnalyticsService instance with injected repository
    """
    db = Database.get_db()
    repository = AnalyticsRepository(db)
    return AnalyticsService(repository)


# =============================================================================
# AUTHENTICATION DEPENDENCIES
# =============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserModel:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials
        auth_service: Auth service instance
    
    Returns:
        Current authenticated user
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        # Decode the JWT token
        payload = auth_service.decode_token(credentials.credentials)
        email: str = payload.get("sub")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        user_repository = get_user_repository()
        user_data = await user_repository.get_user_by_email(email)
        
        if user_data is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return UserModel(**user_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    """
    Get current active user (not disabled).
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Current active user
    
    Raises:
        HTTPException: If user is inactive/disabled
    """
    if not current_user.account_active or not current_user.can_login:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user
def get_event_service() -> EventService:
    """
    Get EventService instance.
    
    Returns:
        EventService instance with injected repository
    """
    repository = get_event_repository()
    return EventService(repository)

