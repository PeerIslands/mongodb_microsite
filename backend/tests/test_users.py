"""
User endpoint tests (integration — requires MongoDB in MONGODB_URI).
"""

import uuid

from fastapi.testclient import TestClient


def _external_signup_body(email: str) -> dict:
    """Valid payload for POST /saveuser (matches UserCreateRequest)."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "user_email": email,
        "user_password": "SecurePass1!",
        "company": "Acme Corp",
        "job_function": "Engineer",
        "business_phone": "+12025550199",
        "country": "United States",
    }


def test_save_user_success(client: TestClient):
    """Test successful external user registration."""
    email = f"john.{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/v1/saveuser",
        json=_external_signup_body(email),
    )

    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    assert data["is_internal"] is False
    assert "Complete MFA setup" in data["message"]


def test_save_user_internal_domain_uses_sso_only(client: TestClient):
    """Peer Islands emails cannot self-register via password; use Microsoft SSO."""
    response = client.post(
        "/api/v1/saveuser",
        json={
            "first_name": "Jane",
            "last_name": "Smith",
            "user_email": "jane.smith@peerislands.io",
            "user_password": "Securepass1!",
            "company": "Peer Islands",
            "job_function": "Engineer",
            "business_phone": "+12025550123",
            "country": "United States",
        },
    )

    assert response.status_code == 400
    assert "Microsoft" in response.json()["detail"]


def test_save_user_duplicate_email(client: TestClient):
    """Test duplicate email returns 409 conflict."""
    dup_email = f"duplicate.{uuid.uuid4().hex[:8]}@example.com"
    body = _external_signup_body(dup_email)
    first = client.post("/api/v1/saveuser", json=body)
    assert first.status_code == 201

    body2 = _external_signup_body(dup_email)
    body2["first_name"] = "Another"
    response = client.post("/api/v1/saveuser", json=body2)

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_save_user_invalid_email(client: TestClient):
    """Test invalid email format returns 422."""
    response = client.post(
        "/api/v1/saveuser",
        json={
            **_external_signup_body("x@example.com"),
            "user_email": "not-an-email",
        },
    )

    assert response.status_code == 422


def test_save_user_short_password(client: TestClient):
    """Test short password returns 422."""
    response = client.post(
        "/api/v1/saveuser",
        json={
            **_external_signup_body("test@example.com"),
            "user_password": "short",
        },
    )

    assert response.status_code == 422


def test_get_users(client: TestClient):
    """Test get all users endpoint."""
    response = client.get("/api/v1/users")

    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "users" in data
    assert isinstance(data["users"], list)


def test_get_user_not_found(client: TestClient):
    """Test get non-existent user returns 404."""
    response = client.get("/api/v1/users/nonexistent-id")

    assert response.status_code == 404
