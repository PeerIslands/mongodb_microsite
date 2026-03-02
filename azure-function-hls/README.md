# HLS Transcode Azure Function

Blob-triggered function that converts event videos (MP4/MOV/etc.) to HLS and notifies the FastAPI backend.

## Flow

1. **Trigger:** New blob in `microsite/events/{eventId}/video_url.{ext}` (mmsuploads storage).
2. **Download** source blob to temp.
3. **FFmpeg** produces HLS: `master.m3u8` + `segment_NNN.ts`.
4. **Upload** all HLS files to `microsite/events/{eventId}/video_hls/`.
5. **Callback:** `PATCH {BACKEND_BASE_URL}/api/v1/events/{eventId}/hls-ready` with `{"hls_playlist_path": "events/{eventId}/video_hls/master.m3u8"}`.

## App settings (already set on Function App)

| Setting | Description |
|--------|-------------|
| `BlobStorageConnectionString` | Connection to storage account that has the **microsite** container (e.g. mmsuploads). |
| `BACKEND_BASE_URL` | FastAPI base URL. Production: `https://mongodb.peerislands.io`. Local runs: `http://localhost:8000` (function must be able to reach it, e.g. same machine or tunnel). |
| `HLS_WEBHOOK_SECRET` | Optional. Same value as `HLS_WEBHOOK_SECRET` in backend `.env`; sent as `X-HLS-Webhook-Secret` when calling hls-ready. |

## Timeout

- `host.json` sets `functionTimeout` to **1 hour** for long transcodes.

## Run on localhost

### 1. Prerequisites

- **Python 3.11** (e.g. `pyenv install 3.11` or system Python).
- **Azure Functions Core Tools** (v4):  
  - macOS: `brew tap azure/functions && brew install azure-functions-core-tools@4`  
  - Or: https://docs.microsoft.com/azure/azure-functions/functions-run-local
- **FFmpeg**: `brew install ffmpeg` (macOS) or install from https://ffmpeg.org

### 2. Local settings

```bash
cd azure-function-hls
cp local.settings.json.example local.settings.json
```

Edit `local.settings.json`:

- **AzureWebJobsStorage** – Use the same value as your Function App (mmshlstranscode connection string), or run [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) and set `UseDevelopmentStorage=true`.
- **BlobStorageConnectionString** – Connection string for **mmsuploads** (so the trigger sees blobs in the microsite container).
- **BACKEND_BASE_URL** – `http://localhost:8000` (your FastAPI backend).
- **HLS_WEBHOOK_SECRET** – Leave `""` unless you set it in backend `.env`.

### 3. Start the backend (terminal 1)

```bash
cd backend
source .venv/bin/activate   # or: .venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should be at http://localhost:8000.

### 4. Start the function (terminal 2)

```bash
cd azure-function-hls
python -m venv .venv
source .venv/bin/activate   # or: .venv\Scripts\activate on Windows
pip install -r requirements.txt
func start
```

You should see the blob-triggered function listed and the host running (e.g. http://localhost:7071).

### 5. Trigger the function locally

1. Start the **frontend** (e.g. `npm run dev` in `frontend`).
2. Log in as admin, go to **Events**, edit a past event, and **upload a video** (or replace the existing one).  
   The frontend uploads to **Azure Blob** (mmsuploads) via the upload URL from the backend.
3. When the new blob appears in `microsite/events/{eventId}/video_url.{ext}`, the **local** function is triggered (it uses `BlobStorageConnectionString` to watch that storage).
4. The function downloads the blob, runs FFmpeg, uploads HLS to blob, then calls `PATCH http://localhost:8000/api/v1/events/{eventId}/hls-ready`.

So: backend on **localhost:8000**, function host on **localhost:7071**; trigger by uploading a video from the app so the blob lands in mmsuploads.

## Deploy (with FFmpeg)

The default Python Linux image does **not** include FFmpeg. Use one of:

### Option A: Deploy as custom container (recommended)

1. Build and push the image (this Dockerfile installs FFmpeg):
   ```bash
   az acr create --name <acr> --resource-group monogo-microsite --sku Basic
   az functionapp config appsettings set --name mms-hls-transcode-func --resource-group monogo-microsite --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
   # Then configure the Function App to use the custom image (Portal or az functionapp config container set).
   ```
2. Or use Azure Container Registry and set the Function App to **Deploy from container**.

### Option B: Deploy code only (no FFmpeg in image)

Deploy with `func azure functionapp publish mms-hls-transcode-func`. Transcode will fail until you switch to a custom image that includes FFmpeg (Option A).

## Deploy code to existing Function App (no Docker)

```bash
cd azure-function-hls
func azure functionapp publish mms-hls-transcode-func --python
```

Then configure the Function App to run from a **custom Docker image** (that includes FFmpeg) as in Option A, or add an extension/startup script that installs FFmpeg if your plan supports it.
