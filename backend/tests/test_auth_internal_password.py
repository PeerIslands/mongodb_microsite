"""Tests: internal users cannot use password sign-in when Azure SSO env is set."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.api.v1.exceptions.user_exceptions import AuthenticationError
from app.api.v1.models.user import SignInRequest
from app.api.v1.services.auth_service import AuthService


def _internal_user_doc():
    return {
        "_id": "user-internal-1",
        "user_email": "employee@peerislands.io",
        "is_internal": True,
        "is_admin": False,
        "can_login": True,
        "registration_status": "completed",
        "account_active": True,
        "totp_enabled": False,
    }


@pytest.mark.asyncio
async def test_password_sign_in_rejected_for_internal_when_azure_configured():
    repo = MagicMock()
    repo.get_user_by_email = AsyncMock(return_value=_internal_user_doc())
    repo.get_login_creds = AsyncMock(
        return_value={"user_password": "hashed", "user_email": "employee@peerislands.io"}
    )
    auth = AuthService(repo, None)
    dummy_pwd = "AnyPassword1!"
    req = SignInRequest(
        user_email="employee@peerislands.io",
        user_password=dummy_pwd,
    )

    with patch("app.api.v1.services.auth_service.settings") as mock_settings:
        mock_settings.AZURE_TENANT_ID = "90487389-fd4d-4951-a72c-069d7b20dee4"
        mock_settings.AZURE_CLIENT_ID = "209b8cfb-e743-4602-a496-a884d68ca5ea"
        with pytest.raises(AuthenticationError) as excinfo:
            await auth.sign_in(req)

    assert "Microsoft" in excinfo.value.message
    repo.get_login_creds.assert_not_called()


@pytest.mark.asyncio
async def test_password_sign_in_allowed_for_external_when_azure_configured():
    """External users still use password + normal flow (mocked password verify)."""
    repo = MagicMock()
    repo.get_user_by_email = AsyncMock(
        return_value={
            "_id": "ext-1",
            "user_email": "guest@example.com",
            "is_internal": False,
            "is_admin": False,
            "can_login": True,
            "registration_status": "completed",
            "account_active": True,
            "totp_enabled": False,
        }
    )
    repo.get_login_creds = AsyncMock(
        return_value={"user_password": "hashed", "user_email": "guest@example.com"}
    )
    auth = AuthService(repo, None)
    dummy_pwd = "SecurePass1!"
    req = SignInRequest(user_email="guest@example.com", user_password=dummy_pwd)

    with patch("app.api.v1.services.auth_service.settings") as mock_settings:
        mock_settings.AZURE_TENANT_ID = "90487389-fd4d-4951-a72c-069d7b20dee4"
        mock_settings.AZURE_CLIENT_ID = "209b8cfb-e743-4602-a496-a884d68ca5ea"
        with patch.object(auth, "verify_password", return_value=True):
            with patch.object(auth, "create_access_token", return_value="jwt-token"):
                resp = await auth.sign_in(req)

    assert resp.access_token == "jwt-token"
    assert resp.user_email == "guest@example.com"
    assert resp.is_internal is False
