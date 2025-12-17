# FastAPI Backend

FastAPI-based backend application for MongoDB Microsite.

## Quick Start

### 1. Install Dependencies

From the project root:

```bash
poetry install
```

### 2. Set Up Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Application
PROJECT_NAME=MongoDB Microsite
VERSION=0.1.0
API_V1_STR=/api/v1

# Server
HOST=0.0.0.0
PORT=8000

# CORS (comma-separated)
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Security
SECRET_KEY=your-secret-key-here-change-in-production
```

### 3. Run the Application

From the project root:

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
app/
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
├── __init__.py
├── main.py              # Application entry point
├── api/
│   ├── __init__.py
│   └── v1/
│       ├── __init__.py
│       ├── api.py       # Router aggregation
│       └── endpoints/   # API endpoints
│           ├── __init__.py
│           └── health.py
└── core/
    ├── __init__.py
    └── config.py        # Settings and configuration
```

## Configuration

### Environment Variables

All configuration is managed through environment variables loaded from `.env`:

- `PROJECT_NAME` - Application name
- `VERSION` - Application version
- `API_V1_STR` - API version prefix (default: `/api/v1`)
- `HOST` - Server host (default: `0.0.0.0`)
- `PORT` - Server port (default: `8000`)
- `BACKEND_CORS_ORIGINS` - Comma-separated list of allowed CORS origins
- `SECRET_KEY` - Secret key for security operations

### Settings

Configuration is managed in `core/config.py` using Pydantic Settings. The settings are automatically loaded from:
1. Environment variables
2. `.env` file in the `app/` directory
3. Default values (if neither is provided)

## Development

### Run Development Server

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-reload on code changes.

### Code Formatting

Format code with Black:

```bash
poetry run black app/
```

Sort imports with isort:

```bash
poetry run isort app/
```

### Type Checking

Run type checking with mypy (if installed):

```bash
poetry add --group dev mypy
poetry run mypy app/
```

## API Endpoints

### Root Endpoint

- **GET** `/` - Welcome message and API information

### Health Check

- **GET** `/api/v1/health` - Health check endpoint
  - Returns: `{"status": "healthy", "timestamp": "...", "service": "api"}`

### Documentation

- **GET** `/docs` - Interactive API documentation (Swagger UI)
- **GET** `/redoc` - Alternative API documentation (ReDoc)
- **GET** `/api/v1/openapi.json` - OpenAPI schema

## Adding New Endpoints

1. Create a new file in `api/v1/endpoints/` (e.g., `items.py`)
2. Define your router and endpoints:

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/items")
async def get_items():
    return {"items": []}
```

3. Register the router in `api/v1/api.py`:

```python
from app.api.v1.endpoints import health, items

api_router.include_router(items.router, prefix="/items", tags=["items"])
```

## Testing

### Run Tests

```bash
poetry run pytest
```

### Run Tests with Coverage

```bash
poetry run pytest --cov=app --cov-report=html
```

## Dependencies

### Core Dependencies

- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `pydantic` - Data validation
- `pydantic-settings` - Settings management
- `python-dotenv` - Environment variable loading

### Development Dependencies

- `pytest` - Testing framework
- `pytest-asyncio` - Async test support
- `httpx` - HTTP client for testing
- `black` - Code formatter
- `isort` - Import sorter

## Best Practices

1. **Use async/await** for I/O operations
2. **Validate with Pydantic** models for request/response
3. **Use dependency injection** for testability
4. **Follow RESTful conventions** for API design
5. **Document APIs** with OpenAPI (automatic with FastAPI)
6. **Handle errors gracefully** with proper HTTP status codes
7. **Use environment variables** for configuration
8. **Write tests** for critical paths
9. **Use type hints** throughout the codebase
10. **Keep endpoints focused** (single responsibility)

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, change the port in `.env` or specify it:

```bash
poetry run uvicorn app.main:app --reload --port 8001
```

### Environment Variables Not Loading

Ensure `.env` file exists in the `app/` directory and contains the required variables.

### Import Errors

Make sure you're running commands from the project root, not from inside the `app/` directory.

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [Poetry Documentation](https://python-poetry.org/docs/)



