"""
Shared fixtures for HTTP integration tests.

Uses Starlette/FastAPI TestClient so lifespan runs (MongoDB connect).
Requires valid `MONGODB_URI` / `MONGODB_DB_NAME` (e.g. from `backend/.env`).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
