# FastAPI Project Template - Universal Starter Guide

This is a universal template for creating new FastAPI projects from scratch. Use this guide to bootstrap any FastAPI application with modern best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Project Structure](#project-structure)
4. [Initial Setup](#initial-setup)
5. [Core Configuration](#core-configuration)
6. [Application Structure](#application-structure)
7. [Error Handling](#error-handling)
8. [Middleware & Security](#middleware--security)
9. [Optional Features](#optional-features)
10. [Testing Setup](#testing-setup)
11. [Docker Setup](#docker-setup)
12. [CI/CD Setup](#cicd-setup)
13. [Deployment](#deployment)
14. [Development Workflow](#development-workflow)

---

## Quick Start

### 1. Create Project Directory
```bash
mkdir my-fastapi-project
cd my-fastapi-project
```

### 2. Initialize Poetry
```bash
poetry init
# Follow prompts or use: poetry init --no-interaction
```

### 3. Install Core Dependencies
```bash
poetry add fastapi uvicorn[standard] pydantic pydantic-settings python-dotenv
```

### 4. Create Basic Structure
```bash
mkdir -p app/{api/v1/endpoints,core,models,services}
touch app/__init__.py app/main.py app/core/__init__.py app/core/config.py
```

### 5. Run Your First API
```bash
poetry run uvicorn app.main:app --reload
```

Visit: http://localhost:8000/docs

---

## Project Overview

### Technology Stack (Core)
- **Framework**: FastAPI (latest)
- **Python**: 3.11+ (3.12 recommended)
- **ASGI Server**: Uvicorn
- **Package Manager**: Poetry (recommended) or pip
- **Validation**: Pydantic v2

### Optional Additions
- **Database**: SQLAlchemy (SQL), Motor (MongoDB), Tortoise ORM
- **Cache**: Redis
- **Task Queue**: Celery, RQ
- **Authentication**: JWT, OAuth2, Azure AD
- **Logging**: structlog, loguru
- **Testing**: pytest, pytest-asyncio, httpx
- **Rate Limiting**: slowapi

---

## Project Structure

### Minimal Structure
```
my-project/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py       # Router aggregation
│   │       └── endpoints/   # API endpoints
│   │           ├── __init__.py
│   │           └── health.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Settings
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── middleware.py    # Custom middleware
│   └── models/              # Pydantic models (optional)
│       └── __init__.py
├── tests/                    # Tests
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   └── test_health.py
├── pyproject.toml            # Poetry config
├── .env.example              # Environment template
├── .gitignore
└── README.md
```

### Extended Structure (with optional features)
```
my-project/
├── app/
│   ├── main.py
│   ├── api/
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py       # DB connection
│   │   ├── logger.py         # Logging setup
│   │   ├── security.py       # Auth utilities
│   │   ├── exceptions.py     # Custom exceptions
│   │   └── middleware.py     # Custom middleware
│   ├── models/              # Pydantic models
│   ├── schemas/             # Request/Response schemas
│   ├── services/            # Business logic
│   ├── repositories/        # Data access
│   ├── dependencies/        # FastAPI dependencies
│   └── utils/               # Utilities
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   └── test_endpoints/
├── alembic/                 # DB migrations (if using SQLAlchemy)
└── [config files]
```

---

## Initial Setup

### 1. pyproject.toml (Minimal)

```toml
[tool.poetry]
name = "my-fastapi-project"
version = "0.1.0"
description = ""
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.115.0"
uvicorn = {extras = ["standard"], version = "^0.32.0"}
pydantic = "^2.9.0"
pydantic-settings = "^2.5.0"
python-dotenv = "^1.0.1"

[tool.poetry.group.dev.dependencies]
pytest = "^8.3.0"
pytest-asyncio = "^0.24.0"
httpx = "^0.27.0"
black = "^24.8.0"
isort = "^5.13.2"
mypy = "^1.11.0"
pytest-cov = "^5.0.0"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 88
target-version = ['py311']

[tool.isort]
profile = "black"

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = false
```

### 2. .gitignore

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
poetry.lock

# IDEs
.vscode/
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace

# Environment
.env
.env.local
.env.*.local

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.mypy_cache/
.dmypy.json
dmypy.json

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# Docker
.dockerignore
```

### 3. .env.example

```bash
# Application
PROJECT_NAME=My FastAPI Project
VERSION=0.1.0
API_V1_STR=/api/v1
ENVIRONMENT=development  # development, staging, production

# Server
HOST=0.0.0.0
PORT=8000

# CORS (comma-separated)
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database (if using SQLAlchemy)
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
# DATABASE_URL=mysql+aiomysql://user:pass@localhost:3306/dbname

# MongoDB (if using)
# MONGODB_URL=mongodb://localhost:27017
# DATABASE_NAME=mydb

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting (if using slowapi)
# REDIS_URL=redis://localhost:6379/0
# RATE_LIMIT_PER_MINUTE=60
```

---

## Core Configuration

### Settings (app/core/config.py)

```python
from typing import List, Literal
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "FastAPI Project"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    BACKEND_CORS_ORIGINS: str = ""
    
    @field_validator("BACKEND_CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: str) -> List[str]:
        if not v:
            return []
        return [i.strip() for i in v.split(",") if i.strip()]
    
    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database (optional)
    DATABASE_URL: str | None = None
    MONGODB_URL: str | None = None
    DATABASE_NAME: str = "mydb"
    
    # Rate Limiting (optional)
    REDIS_URL: str | None = None
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()
```

---

## Application Structure

### Main Application (app/main.py)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.middleware import add_security_headers, log_requests
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    # Connect to database, initialize services, etc.
    # Example:
    # from app.core.database import connect_db
    # await connect_db()
    yield
    # Shutdown
    # Close database connections, cleanup, etc.
    # Example:
    # from app.core.database import close_db
    # await close_db()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if not settings.is_production else None,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# CORS Middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Custom Middleware
app.middleware("http")(add_security_headers)
if settings.is_development:
    app.middleware("http")(log_requests)


# Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "detail": exc.detail,
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": exc.detail,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Validation failed",
            "detail": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
        },
    )


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs" if not settings.is_production else None,
    }
```

### Custom Exceptions (app/core/exceptions.py)

```python
from fastapi import status


class AppException(Exception):
    """Base application exception"""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "APPLICATION_ERROR",
        detail: dict | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.detail = detail or {}
        super().__init__(self.message)


class NotFoundError(AppException):
    """Resource not found exception"""
    
    def __init__(self, resource: str, identifier: str | int):
        super().__init__(
            message=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            detail={"resource": resource, "identifier": str(identifier)},
        )


class ValidationError(AppException):
    """Validation error exception"""
    
    def __init__(self, message: str, detail: dict | None = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            detail=detail or {},
        )


class AuthenticationError(AppException):
    """Authentication error exception"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR",
        )


class AuthorizationError(AppException):
    """Authorization error exception"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR",
        )
```

### Custom Middleware (app/core/middleware.py)

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from app.core.logger import logger


def add_security_headers(request: Request, call_next):
    """Add security headers to responses"""
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


async def log_requests(request: Request, call_next):
    """Log incoming requests (development only)"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        "Request processed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time=f"{process_time:.3f}s",
    )
    
    return response
```

### API Router (app/api/v1/api.py)

```python
from fastapi import APIRouter
from app.api.v1.endpoints import health

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
```

### Health Endpoint (app/api/v1/endpoints/health.py)

```python
from fastapi import APIRouter
from datetime import datetime, timezone
from typing import Dict, Any

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "api",
    }
```

---

## Error Handling

The application includes comprehensive error handling:

1. **Custom Exceptions** (`app/core/exceptions.py`) - Define domain-specific exceptions
2. **Global Exception Handlers** - Handle all exceptions consistently
3. **Validation Errors** - Automatic Pydantic validation error formatting
4. **HTTP Exceptions** - Standard HTTP error responses

### Usage Example

```python
from app.core.exceptions import NotFoundError, ValidationError

@router.get("/items/{item_id}")
async def get_item(item_id: int):
    item = await get_item_from_db(item_id)
    if not item:
        raise NotFoundError(resource="Item", identifier=item_id)
    return item
```

---

## Middleware & Security

### Security Headers

The application automatically adds security headers via middleware:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Rate Limiting (Optional)

**Install:**
```bash
poetry add slowapi redis
```

**Setup (app/core/rate_limit.py):**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from app.core.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL or "memory://",
)

def init_rate_limit(app):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**Usage:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.rate_limit import limiter

@router.get("/items")
@limiter.limit("10/minute")
async def get_items(request: Request):
    return items
```

---

## Optional Features

### 1. Database Integration

#### SQLAlchemy (PostgreSQL/MySQL)

**Install:**
```bash
poetry add sqlalchemy asyncpg  # PostgreSQL
# or
poetry add sqlalchemy aiomysql  # MySQL
poetry add alembic  # Migrations
```

**Setup (app/core/database.py):**
```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL not set")

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_development,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

**Update main.py to include database lifecycle:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.core.database import engine
    # Create tables (in production, use migrations)
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()
```

#### MongoDB (Motor)

**Install:**
```bash
poetry add motor pymongo
```

**Setup (app/core/database.py):**
```python
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient | None = None
database = None


async def connect_db():
    """Connect to MongoDB"""
    global client, database
    if not settings.MONGODB_URL:
        raise ValueError("MONGODB_URL not set")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    # Test connection
    await client.admin.command("ping")


async def close_db():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
```

**Update main.py:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import connect_db, close_db
    await connect_db()
    yield
    await close_db()
```

### 2. Authentication

#### JWT Authentication

**Install:**
```bash
poetry add python-jose[cryptography] passlib[bcrypt]
```

**Setup (app/core/security.py):**
```python
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.core.exceptions import AuthenticationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get current authenticated user"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuthenticationError("Invalid token")
        # Fetch user from database
        # user = await get_user_by_id(user_id)
        # if user is None:
        #     raise AuthenticationError("User not found")
        # return user
        return {"id": user_id}
    except JWTError:
        raise AuthenticationError("Invalid token")
```

**Usage in endpoints:**
```python
from app.core.security import get_current_user

@router.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": "This is protected", "user": current_user}
```

### 3. Logging

**Install:**
```bash
poetry add structlog
```

**Setup (app/core/logger.py):**
```python
import structlog
import logging
import sys

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer() if not sys.stdout.isatty() else structlog.dev.ConsoleRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)

logger = structlog.get_logger()
```

### 4. Background Tasks

**Using FastAPI BackgroundTasks:**
```python
from fastapi import BackgroundTasks

@router.post("/items/{item_id}/process")
async def process_item(
    item_id: int,
    background_tasks: BackgroundTasks
):
    def process():
        # Long-running task
        pass
    
    background_tasks.add_task(process)
    return {"message": "Processing started"}
```

**Using Celery (for complex tasks):**
```bash
poetry add celery redis
```

---

## Testing Setup

### Test Configuration (tests/conftest.py)

```python
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.fixture
async def client():
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_user():
    """Test user data"""
    return {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com",
    }
```

### Basic Test (tests/test_health.py)

```python
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint"""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "service" in data


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint"""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
```

### Advanced Test Example (tests/test_endpoints/test_auth.py)

```python
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_protected_endpoint_without_token(client: AsyncClient):
    """Test protected endpoint without authentication"""
    response = await client.get("/api/v1/protected")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_with_token(client: AsyncClient):
    """Test protected endpoint with valid token"""
    token = create_access_token(data={"sub": "user123"})
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/protected", headers=headers)
    assert response.status_code == 200
```

### Running Tests

```bash
# Install test dependencies
poetry install --with dev

# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/test_health.py

# Run with verbose output
pytest -v

# Run with parallel execution
pytest -n auto
```

---

## Docker Setup

### Dockerfile (Multi-stage build)

```dockerfile
# Build stage
FROM python:3.12-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --upgrade pip && \
    pip install poetry==1.8.3

# Configure Poetry
RUN poetry config virtualenvs.create false

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root --only=main

# Production stage
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/health')"

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/dbname
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=dbname
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## CI/CD Setup

### GitHub Actions (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.12'
    
    - name: Install Poetry
      uses: snok/install-poetry@v1
      with:
        version: latest
    
    - name: Install dependencies
      run: poetry install --with dev
    
    - name: Run linting
      run: |
        poetry run black --check app/
        poetry run isort --check app/
        poetry run mypy app/
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/testdb
      run: poetry run pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  docker:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Build Docker image
      run: docker build -t my-api:test .
    
    - name: Test Docker image
      run: docker run -d -p 8000:8000 --name test-api my-api:test
```

### GitLab CI (.gitlab-ci.yml)

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2

test:
  stage: test
  image: python:3.12
  services:
    - postgres:16
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql+asyncpg://test:test@postgres:5432/testdb
  before_script:
    - pip install poetry
    - poetry install --with dev
  script:
    - poetry run black --check app/
    - poetry run isort --check app/
    - poetry run pytest --cov=app
```

---

## Deployment

### Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables in Railway dashboard
5. Deploy: `railway up`

### Render

1. Connect your GitHub repository
2. Create new Web Service
3. Set build command: `poetry install --no-interaction --no-ansi`
4. Set start command: `poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### AWS (ECS/Fargate)

1. Build and push Docker image to ECR
2. Create ECS task definition
3. Create ECS service
4. Configure load balancer
5. Set up environment variables via Secrets Manager

### Heroku

**Procfile:**
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**runtime.txt:**
```
python-3.12.0
```

Deploy:
```bash
heroku create your-app-name
heroku config:set SECRET_KEY=your-secret-key
git push heroku main
```

---

## Development Workflow

### 1. Development Server
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Code Formatting
```bash
# Format code
poetry run black app/

# Sort imports
poetry run isort app/

# Format and check
poetry run black app/ && poetry run isort app/
```

### 3. Type Checking
```bash
poetry add --group dev mypy
poetry run mypy app/
```

### 4. Pre-commit Hooks
```bash
poetry add --group dev pre-commit
poetry run pre-commit install
```

**.pre-commit-config.yaml:**
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.8.0
    hooks:
      - id: black
  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.11.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
```

### 5. Database Migrations (Alembic)

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Best Practices

1. **Use async/await** for I/O operations
2. **Validate with Pydantic** models
3. **Use dependency injection** for testability
4. **Follow RESTful conventions**
5. **Document APIs** with OpenAPI
6. **Handle errors gracefully** with custom exceptions
7. **Use environment variables** for configuration
8. **Write tests** for critical paths
9. **Use type hints** throughout
10. **Keep endpoints focused** (single responsibility)
11. **Add security headers** via middleware
12. **Implement rate limiting** for public endpoints
13. **Use connection pooling** for databases
14. **Log important events** with structured logging
15. **Use health checks** for monitoring

---

## Next Steps

1. **Add your first endpoint** - Create a new endpoint in `app/api/v1/endpoints/`
2. **Set up database** - Choose SQL or NoSQL and integrate
3. **Add authentication** - Implement JWT or OAuth2
4. **Write tests** - Add tests for your endpoints
5. **Set up CI/CD** - Automate testing and deployment
6. **Add monitoring** - Integrate logging and metrics (Prometheus, Sentry)
7. **Deploy** - Deploy to your preferred platform
8. **Add API documentation** - Customize OpenAPI schema
9. **Implement caching** - Add Redis caching for frequently accessed data
10. **Set up monitoring** - Add APM tools (New Relic, Datadog)

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Motor Documentation](https://motor.readthedocs.io/)

---

## Template Checklist

- [ ] Project structure created
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Basic health endpoint working
- [ ] Error handling implemented
- [ ] Security headers middleware added
- [ ] Tests written and passing
- [ ] Docker setup working
- [ ] CI/CD configured
- [ ] Documentation updated
- [ ] Production deployment ready
- [ ] Monitoring and logging configured
