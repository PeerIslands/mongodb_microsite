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
   - `AZURE_COMMUNICATION_CONNECTION_STRING` - Azure Communication Services connection string
   - `AZURE_COMMUNICATION_SENDER_ADDRESS` - Verified sender email address
   
   See `EMAIL_SETUP.md` for detailed Azure Communication Services configuration.

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

## Features

### Email Service
The backend includes Azure Communication Services integration for sending emails:
- Simple emails with plain text or HTML
- Template-based emails (welcome, password reset, notifications)
- Full-featured emails with CC, BCC, and attachments
- Rate limiting and permission controls

See `EMAIL_SETUP.md` for setup instructions.

### Authentication & Security
- JWT-based authentication
- TOTP/MFA support with QR code generation
- Backup codes for account recovery
- Rate limiting on TOTP attempts
- Password reset functionality

### Storage
- Azure Blob Storage integration for file uploads
- MongoDB for data persistence

## Environment Variables

Required environment variables for `.env`:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=mongodb_microsite

# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Azure Blob Storage
AZURE_BLOB_SAS_URL=https://yourstorage.blob.core.windows.net/container?sas-token

# Azure Communication Services Email
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=key
AZURE_COMMUNICATION_SENDER_ADDRESS=noreply@yourdomain.com

# TOTP/MFA
TOTP_ENABLED=True
TOTP_SECRET_ENCRYPTION_KEY=your-64-character-hex-key

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Deployment

The backend is deployed to Azure App Service. See the root-level documentation for deployment details.

