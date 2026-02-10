from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Database
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup: Connect to MongoDB
    await Database.connect()
    
    # Create database indexes for optimized queries
    try:
        from app.api.v1.repositories.email_template_repository import EmailTemplateRepository
        from app.api.v1.repositories.testimonial_repository import TestimonialRepository
        
        email_repo = EmailTemplateRepository(Database.get_db())
        await email_repo.ensure_indexes()
        
        testimonial_repo = TestimonialRepository(Database.get_db())
        await testimonial_repo.create_indexes()
    except Exception as e:
        print(f"Warning: Failed to create indexes: {e}")
    
    yield
    
    # Shutdown: Disconnect from MongoDB
    await Database.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
# Configure allowed origins based on environment
allowed_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "https://ashy-glacier-09cfe4b0f.5.azurestaticapps.net",
    "https://ashy-glacier-09cfe4b0f.1.azurestaticapps.net"  # Azure Static Web App
]

# Add custom CORS origins from settings if configured
if settings.BACKEND_CORS_ORIGINS:
    allowed_origins.extend(settings.BACKEND_CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
    }









