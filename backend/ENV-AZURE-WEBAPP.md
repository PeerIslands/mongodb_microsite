# Azure Web App – Application settings reference

Set these in **Azure Portal** → your Web App (**mongodb-microsite-api** / **mongodb-microsite-api-uat**) → **Configuration** → **Application settings**. Use the same names as in `.env` (no `export`, just name/value).

---

## Required (app won’t start without these)

| Name | Description | Example |
|------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | Database name | `microsite` |

---

## Security (required in production)

| Name | Description | Example |
|------|-------------|---------|
| `SECRET_KEY` | App secret key | Long random string |
| `JWT_SECRET_KEY` | JWT signing key | Long random string |
| `TOTP_SECRET_ENCRYPTION_KEY` | Encrypts TOTP secrets | 32-byte key (e.g. base64) |

---

## Azure Blob Storage (events/accelerators/case studies files)

| Name | Description | Example |
|------|-------------|---------|
| `AZURE_BLOB_SAS_URL` | Full SAS URL including container path | `https://account.blob.core.windows.net/microsite?sv=...&se=...` |
| `AZURE_BLOB_CONTAINER` | Container name if not in SAS path | `microsite` |

---

## HLS video (Azure Function callback)

| Name | Description | Example |
|------|-------------|---------|
| `HLS_WEBHOOK_SECRET` | Optional. If set, Function must send same value in `X-HLS-Webhook-Secret` when calling `PATCH .../events/{id}/hls-ready` | Random string, or leave empty |

---

## URLs (for links in emails and file proxy)

| Name | Description | Example (prod) |
|------|-------------|-----------------|
| `API_BASE_URL` | Public backend API URL (file proxy, etc.) | `https://mongodb.peerislands.io` or UAT URL |
| `FRONTEND_BASE_URL` | Public frontend URL (e.g. calendar links in emails) | `https://mongodb.peerislands.io` or UAT URL |

---

## CORS

| Name | Description | Example |
|------|-------------|---------|
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins | `https://your-frontend.azurestaticapps.net,https://mongodb.peerislands.io` |

---

## Email (Azure Communication Services)

| Name | Description |
|------|-------------|
| `AZURE_COMMUNICATION_CONNECTION_STRING` | ACS connection string |
| `AZURE_COMMUNICATION_SENDER_ADDRESS` | Sender email (e.g. ACS domain) |
| `CONTACTUS_RECEIVER_EMAIL` | Contact form recipient |
| `CONTACTUS_RECEIVER_CC_EMAIL` | Optional, comma-separated CC addresses |

---

## Optional (JWT / TOTP / SMTP / OpenAI / Gamma)

| Name | Description | Default in code |
|------|-------------|------------------|
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry (minutes) | `480` |
| `TOTP_ISSUER_NAME` | TOTP issuer label | `MongoDB Microsite` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` | SMTP (if used) | — |
| `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`, `AZURE_OPENAI_API_VERSION` | Azure OpenAI (chatbot/LLM) | — |
| `GAMMA_API_KEY` | Gamma presentation API | — |

---

## Checklist for HLS + events

- [ ] `MONGODB_URI`, `MONGODB_DB_NAME`
- [ ] `SECRET_KEY`, `JWT_SECRET_KEY`, `TOTP_SECRET_ENCRYPTION_KEY`
- [ ] `AZURE_BLOB_SAS_URL` (and `AZURE_BLOB_CONTAINER` if SAS has no path)
- [ ] `HLS_WEBHOOK_SECRET` – set only if you want to secure the hls-ready callback (same value on Function App)
- [ ] `API_BASE_URL` – e.g. `https://mongodb.peerislands.io` (or UAT API URL)
- [ ] `FRONTEND_BASE_URL`, `BACKEND_CORS_ORIGINS` as needed
- [ ] Email / ACS / contact form settings if you use those features
