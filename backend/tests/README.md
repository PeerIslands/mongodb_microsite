# Backend tests

## Run

From `backend/` (with Poetry):

```bash
poetry run pytest tests/ -v
```

With pip:

```bash
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v
```

## What runs where

| Suite | Needs MongoDB | Needs `.env` |
|--------|-----------------|--------------|
| `test_azure_oidc.py` | No | No |
| `test_auth_internal_password.py` | No | No |
| `test_users.py`, `test_health.py` | Yes | `MONGODB_URI`, `MONGODB_DB_NAME`, `TOTP_SECRET_ENCRYPTION_KEY`, etc. |

Integration tests use `TestClient` from FastAPI so app **lifespan** runs (MongoDB connects). Use a dev/test database when possible.

### Fast unit tests only

```bash
poetry run pytest tests/test_azure_oidc.py tests/test_auth_internal_password.py -v
```

## Manual / QA (SSO)

Use these when validating Microsoft login in a browser (not automated here):

1. **Internal — first visit:** Login → default view is Microsoft only → sign in → JIT user created → JWT session.
2. **Internal — repeat:** Same; no password form unless user clicks “External user”.
3. **External:** Login → “External user? Sign in with email and password” → email/password (+ TOTP if enabled).
4. **Internal password blocked:** With `AZURE_TENANT_ID` and `AZURE_CLIENT_ID` set, `POST /sign_in` for `@peerislands.io` returns an error directing users to Microsoft sign-in.
5. **Signup:** `@peerislands.io` on `POST /saveuser` returns **400** with message to use Microsoft; external emails complete TOTP registration as before.
