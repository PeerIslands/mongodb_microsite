"""Unit tests for Azure ID token claim helpers (no network / no JWKS)."""

from app.core.azure_oidc import (
    display_name_from_claims,
    email_from_id_token_claims,
    _expected_issuer,
    _jwks_url,
)


def test_jwks_url_format():
    tid = "90487389-fd4d-4951-a72c-069d7b20dee4"
    assert _jwks_url(tid) == (
        "https://login.microsoftonline.com/"
        "90487389-fd4d-4951-a72c-069d7b20dee4/discovery/v2.0/keys"
    )


def test_expected_issuer_v2():
    tid = "11111111-1111-1111-1111-111111111111"
    assert _expected_issuer(tid) == (
        "https://login.microsoftonline.com/11111111-1111-1111-1111-111111111111/v2.0"
    )


def test_email_from_claims_prefers_email():
    assert (
        email_from_id_token_claims(
            {"email": "User@PeerIslands.IO", "preferred_username": "other@test.com"}
        )
        == "user@peerislands.io"
    )


def test_email_from_claims_preferred_username():
    assert (
        email_from_id_token_claims(
            {"preferred_username": "someone@peerislands.io"}
        )
        == "someone@peerislands.io"
    )


def test_email_from_claims_upn():
    assert (
        email_from_id_token_claims({"upn": "x@peerislands.io"})
        == "x@peerislands.io"
    )


def test_email_from_claims_missing_returns_none():
    assert email_from_id_token_claims({}) is None


def test_display_name_from_given_family():
    fn, ln = display_name_from_claims(
        {"given_name": "Ada", "family_name": "Lovelace"}
    )
    assert fn == "Ada"
    assert ln == "Lovelace"


def test_display_name_from_full_name():
    fn, ln = display_name_from_claims({"name": "Ada Lovelace"})
    assert fn == "Ada"
    assert ln == "Lovelace"


def test_display_name_fallback():
    fn, ln = display_name_from_claims({})
    assert fn == "User"
    assert ln == "."
