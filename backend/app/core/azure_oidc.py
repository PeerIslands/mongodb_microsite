"""
Validate Azure AD (Entra ID) ID tokens using Microsoft JWKS (v2.0).
"""

from __future__ import annotations

import jwt
from jwt import PyJWKClient

from app.core.config import settings


def _jwks_url(tenant_id: str) -> str:
    return f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"


def _expected_issuer(tenant_id: str) -> str:
    return f"https://login.microsoftonline.com/{tenant_id}/v2.0"


def decode_and_validate_azure_id_token(
    id_token: str,
    *,
    tenant_id: str | None = None,
    client_id: str | None = None,
) -> dict:
    """
    Verify signature (RS256), issuer, audience, expiry, and tenant id (tid).

    Raises:
        jwt.PyJWTError: If validation fails.
        ValueError: If tid does not match configured tenant.
    """
    tid = tenant_id or settings.AZURE_TENANT_ID
    aud = client_id or settings.AZURE_CLIENT_ID
    if not tid or not aud:
        raise ValueError("Azure AD is not configured (AZURE_TENANT_ID / AZURE_CLIENT_ID)")

    jwks_client = PyJWKClient(_jwks_url(tid))
    signing_key = jwks_client.get_signing_key_from_jwt(id_token)
    issuer = _expected_issuer(tid)

    payload = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=["RS256"],
        audience=aud,
        issuer=issuer,
        options={"verify_exp": True},
    )

    token_tid = payload.get("tid")
    if token_tid != tid:
        raise ValueError("Token tenant (tid) does not match configured tenant")

    return payload


def email_from_id_token_claims(claims: dict) -> str | None:
    """Resolve sign-in email from standard Azure ID token claims."""
    email = claims.get("email")
    if isinstance(email, str) and email.strip():
        return email.strip().lower()

    preferred = claims.get("preferred_username")
    if isinstance(preferred, str) and "@" in preferred:
        return preferred.strip().lower()

    upn = claims.get("upn")
    if isinstance(upn, str) and "@" in upn:
        return upn.strip().lower()

    return None


def display_name_from_claims(claims: dict) -> tuple[str, str]:
    """Return (first_name, last_name) for profile defaults."""
    fn = (claims.get("given_name") or "").strip()
    ln = (claims.get("family_name") or "").strip()
    if fn or ln:
        return fn or "User", ln or "."

    name = (claims.get("name") or "").strip()
    if name:
        parts = name.split(None, 1)
        return parts[0], parts[1] if len(parts) > 1 else "."

    return "User", "."
