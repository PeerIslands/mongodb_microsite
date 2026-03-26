from typing import Optional

from fastapi import Depends, HTTPException, status

from app.api.v1.dependencies.services import (
    get_current_active_user as get_microsite_current_active_user,
    get_optional_current_user as get_microsite_optional_current_user,
)
from app.api.v1.models.user import UserModel

def _adapt_microsite_user(user: UserModel) -> dict:
    """Map microsite users into the estimator's lightweight auth shape."""
    return {
        "_id": user.id,
        "username": user.user_email,
        "user_email": user.user_email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "company": user.company,
        "job_function": user.job_function,
        "role": "admin" if user.is_admin else "user",
        "is_admin": user.is_admin,
    }


async def get_current_user(
    current_user: UserModel = Depends(get_microsite_current_active_user),
) -> dict:
    """Get the current authenticated microsite user in estimator format."""
    return _adapt_microsite_user(current_user)


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Verify that current user is an admin."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


async def get_optional_current_user(
    current_user: Optional[UserModel] = Depends(get_microsite_optional_current_user),
) -> Optional[dict]:
    """Return the current microsite user when authenticated, else None."""
    if current_user is None:
        return None
    return _adapt_microsite_user(current_user)
