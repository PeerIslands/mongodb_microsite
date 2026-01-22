from fastapi import APIRouter
from app.api.v1.endpoints import health, users, auth, case_studies, password_reset, blogs, ai_extract

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(case_studies.router, tags=["case-studies"])
api_router.include_router(password_reset.router, tags=["password-reset"])
api_router.include_router(blogs.router, tags=["blogs"])
api_router.include_router(ai_extract.router, tags=["AI Extract"])









