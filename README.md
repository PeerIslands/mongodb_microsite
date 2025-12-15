# MongoDB Microsite API

A FastAPI-based microsite application.

## Quick Start

### 1. Install Dependencies

```bash
poetry install
```

### 2. Set Up Environment

Copy `.env.example` to `.env` in the `app/` directory and update the values:

```bash
cp app/.env.example app/.env
```

### 3. Run the Application

```bash
poetry run uvicorn app.main:app --reload
```

Visit: http://localhost:8000/docs

## Project Structure

```
mongodb-microsite/
├── app/                     # FastAPI Backend
│   ├── .env                 # Backend environment variables
│   ├── .env.example         # Backend environment template
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
│   └── core/
│       ├── __init__.py
│       └── config.py        # Settings
├── pyproject.toml           # Poetry configuration
├── .gitignore
└── README.md
```

## Development

### Run Development Server

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Code Formatting

```bash
poetry run black app/
poetry run isort app/
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/v1/health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)
