# Backend - FastAPI Application

This directory contains the Python FastAPI backend application for the MongoDB Microsite.

## Structure

```
backend/
├── app/                    # Main application code
│   ├── main.py            # FastAPI app entry point
│   ├── core/              # Core configuration
│   └── api/v1/            # API version 1
│       ├── endpoints/     # Route handlers
│       ├── models/        # Pydantic models
│       ├── services/      # Business logic
│       ├── repositories/  # Data access
│       ├── exceptions/    # Custom exceptions
│       └── dependencies/  # Dependency injection
│
├── tests/                 # Test suite
├── .venv/                # Virtual environment (gitignored)
├── .pytest_cache/        # Pytest cache (gitignored)
│
├── pyproject.toml        # Poetry dependencies
├── poetry.lock           # Locked dependencies
├── requirements.txt      # Pip requirements (for deployment)
├── startup.txt           # Production startup command
└── .deployment           # Azure deployment config
```

## Setup

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   # OR using Poetry
   poetry install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and update:
   - `MONGODB_URI` - Your MongoDB connection string
   - `SECRET_KEY` - Generate a secure secret key
   - `AZURE_BLOB_SAS_URL` - Your Azure Blob Storage SAS URL (if needed)

4. **Run development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Run tests:**
   ```bash
   pytest tests/ -v
   ```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Deployment

The backend is deployed to Azure App Service. See the root-level documentation for deployment details.

