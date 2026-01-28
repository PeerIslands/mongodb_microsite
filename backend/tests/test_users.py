"""
User endpoint tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_save_user_success():
    """Test successful user registration."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/saveuser",
            json={
                "first_name": "John",
                "last_name": "Doe",
                "user_email": "john.doe@example.com",
                "user_password": "securepass123",
            },
        )
    
    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    assert data["is_internal"] is False
    assert data["message"] == "User registered successfully"


@pytest.mark.asyncio
async def test_save_internal_user():
    """Test internal user detection for @company.com emails."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/saveuser",
            json={
                "first_name": "Jane",
                "last_name": "Smith",
                "user_email": "jane.smith@company.com",
                "user_password": "securepass123",
            },
        )
    
    assert response.status_code == 201
    data = response.json()
    assert data["is_internal"] is True


@pytest.mark.asyncio
async def test_save_user_duplicate_email():
    """Test duplicate email returns 409 conflict."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # First registration
        await client.post(
            "/api/v1/saveuser",
            json={
                "first_name": "Test",
                "last_name": "User",
                "user_email": "duplicate@example.com",
                "user_password": "securepass123",
            },
        )
        
        # Duplicate registration
        response = await client.post(
            "/api/v1/saveuser",
            json={
                "first_name": "Another",
                "last_name": "User",
                "user_email": "duplicate@example.com",
                "user_password": "differentpass",
            },
        )
    
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_save_user_invalid_email():
    """Test invalid email format returns 422."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/saveuser",
            json={
                "first_name": "Test",
                "last_name": "User",
                "user_email": "not-an-email",
                "user_password": "securepass123",
            },
        )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_save_user_short_password():
    """Test short password returns 422."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/saveuser",
            json={
                "first_name": "Test",
                "last_name": "User",
                "user_email": "test@example.com",
                "user_password": "short",
            },
        )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_users():
    """Test get all users endpoint."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/users")
    
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "users" in data
    assert isinstance(data["users"], list)


@pytest.mark.asyncio
async def test_get_user_not_found():
    """Test get non-existent user returns 404."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/users/nonexistent-id")
    
    assert response.status_code == 404

