# Deployment Status

## Backend API (develop / UAT)

**Workflows:** `develop_mongodb-microsite-api.yml` | `uat_mongodb-microsite-api-uat.yml`

- **Trigger:** Push to `develop` → deploys to **mongodb-microsite-api**. Push to `uat` → deploys to **mongodb-microsite-api-uat**.
- **No workflow changes required** for the latest code (streaming, Range support, hls-ready, upload-url, etc.). Pushing to `develop` or `uat` will deploy the current backend as-is.

**Check in Azure Web App (Configuration → Application settings):**

- `HLS_WEBHOOK_SECRET` – Set if you want to secure the hls-ready callback from the Azure Function (same value as on the Function App).
- `AZURE_BLOB_SAS_URL`, `AZURE_BLOB_CONTAINER`, and other existing env vars – Must be set for the environment (develop vs UAT) as you already do.

---

## Azure Function (HLS transcode)

**App name (example):** `mms-hls-transcode-func` (or the one you created via Azure CLI)

**What’s done:**

- Function code in `azure-function-hls/` (blob trigger, FFmpeg, upload HLS, callback to backend).
- Blob trigger path: `microsite/events/{event_id}/video_url.{ext}`.
- Callback: `PATCH {BACKEND_BASE_URL}/api/v1/events/{event_id}/hls-ready`.
- Local run works with `func start` and `local.settings.json`.

**What you still need for production:**

1. **Deploy with FFmpeg**  
   The default Python Function runtime does **not** include FFmpeg. Use either:
   - **Custom container (recommended):** Build the image from `azure-function-hls/Dockerfile`, push to Azure Container Registry, and set the Function App to use that image (see `azure-function-hls/README.md`).
   - Or another mechanism that installs FFmpeg in the Function’s runtime.

2. **Function App settings (Azure Portal / CLI)**  
   Ensure these are set for the **deployed** Function App (not only in `local.settings.json`):

   | Setting                       | Description |
   |------------------------------|-------------|
   | `BlobStorageConnectionString`| Connection string for the storage account that has the **microsite** container (e.g. mmsuploads). |
   | `BACKEND_BASE_URL`           | API base URL the function will call: e.g. `https://mongodb.peerislands.io` for production, or the UAT API URL for UAT. |
   | `HLS_WEBHOOK_SECRET`         | Optional; same value as `HLS_WEBHOOK_SECRET` on the backend Web App if you use it. |
   | `AzureWebJobsStorage`        | Storage for the Function runtime (e.g. mmshlstranscode). |

3. **Deploy the function code**  
   - If using a **custom container:** the code is inside the image; deploy by building and pushing the image, then updating the Function App to use it.
   - If using **code-only** (no custom image): run `func azure functionapp publish <your-function-app-name> --python` from `azure-function-hls/`. Transcoding will still fail until FFmpeg is available (custom image or other install).

**Optional:** Add a GitHub Actions workflow under `.github/workflows/` to build the Function’s Docker image and deploy it (or to run `func azure functionapp publish`) so the Function stays in sync with the repo.
