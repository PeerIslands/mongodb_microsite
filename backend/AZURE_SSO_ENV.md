# Azure AD SSO (internal users)

## Azure Portal

Use a **single-tenant** app registration. Under **Authentication**, register **Single-page application** redirect URIs that match your deployment (for example `https://mongodb.peerislands.io/` and `http://localhost:5173/` for local Vite). Use the same **Application (client) ID** for both the SPA and backend validation.

Delegated permissions typically include **openid**, **profile**, and **email** (Microsoft Graph). Grant admin consent where required.

## Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `AZURE_TENANT_ID` | Directory (tenant) ID from Azure Portal |
| `AZURE_CLIENT_ID` | Application (client) ID — must match the SPA |

The API validates ID tokens from the browser and issues your existing HS256 JWT. If `AZURE_TENANT_ID` or `AZURE_CLIENT_ID` is unset, `POST /api/v1/auth/azure/token` returns 401 with a configuration message.

## Frontend (`.env` / build-time)

| Variable | Description |
|----------|-------------|
| `VITE_AZURE_CLIENT_ID` | Same as `AZURE_CLIENT_ID` |
| `VITE_AZURE_TENANT_ID` | Same as `AZURE_TENANT_ID` |
| `VITE_AZURE_REDIRECT_URI` | Optional; defaults to `window.location.origin` (must match an SPA redirect URI in Azure) |

If `VITE_AZURE_CLIENT_ID` or `VITE_AZURE_TENANT_ID` is missing, the **Sign in with Microsoft** button is hidden.

## Internal users

The backend accepts only emails under the internal domain (`UserService.INTERNAL_DOMAIN`, currently `@peerislands.io`) and matches the token `tid` to `AZURE_TENANT_ID`.
