"""
Azure Function: Blob triggers to transcode video to HLS and notify backend.

Triggers:
- microsite/events/{eventId}/video_url.{ext} -> events/{id}/video_hls/ -> PATCH .../events/{id}/hls-ready
- microsite/accelerators/{acceleratorId}/video_url.{ext} -> accelerators/{id}/video_hls/ -> PATCH .../accelerators/{id}/hls-ready

App settings:
- BlobStorageConnectionString: connection to storage with microsite container (e.g. mmsuploads)
- BACKEND_BASE_URL: FastAPI base URL (e.g. https://your-api.azurewebsites.net)
- HLS_WEBHOOK_SECRET: optional, same as backend HLS_WEBHOOK_SECRET
"""

import os
import tempfile
import subprocess
import logging
from pathlib import Path

import azure.functions as func
from azure.storage.blob import BlobServiceClient

app = func.FunctionApp()


def get_config():
    backend_base = os.environ.get("BACKEND_BASE_URL", "").rstrip("/")
    webhook_secret = os.environ.get("HLS_WEBHOOK_SECRET", "")
    conn = os.environ.get("BlobStorageConnectionString", "")
    return backend_base, webhook_secret, conn


@app.blob_trigger(
    arg_name="blob",
    path="microsite/events/{event_id}/video_url.{ext}",
    connection="BlobStorageConnectionString",
)
def on_event_video_upload(blob: func.InputStream) -> None:
    """
    When a new event video is uploaded, transcode to HLS and notify the backend.
    Path params {event_id} and {ext} are not injected by the runtime; parse from blob.name.
    """
    # Blob name is relative to container, e.g. "events/<id>/video_url.mp4"
    name = getattr(blob, "name", None) or ""
    parts = name.split("/")
    if len(parts) != 3 or not parts[1] or not parts[2].startswith("video_url."):
        logging.error("Unexpected blob path: %s", name)
        return
    event_id = parts[1]
    ext = parts[2].split(".", 1)[-1] if "." in parts[2] else "mp4"
    logging.info("Blob trigger: event_id=%s ext=%s size=%s", event_id, ext, getattr(blob, "length", 0))

    backend_base, webhook_secret, conn = get_config()
    if not conn:
        logging.error("BlobStorageConnectionString not set")
        return
    if not backend_base:
        logging.warning("BACKEND_BASE_URL not set; skipping hls-ready callback")

    blob_service = BlobServiceClient.from_connection_string(conn)
    container_name = "microsite"
    source_path = f"events/{event_id}/video_url.{ext}"
    hls_prefix = f"events/{event_id}/video_hls"

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / f"source.{ext}"
        output_dir = Path(tmpdir) / "hls"
        output_dir.mkdir()

        # Download source
        blob_client = blob_service.get_blob_client(container=container_name, blob=source_path)
        with open(input_path, "wb") as f:
            f.write(blob_client.download_blob().readall())
        logging.info("Downloaded %s to %s", source_path, input_path)

        # FFmpeg: single-quality HLS (master.m3u8 + segment_NNN.ts)
        master_path = output_dir / "master.m3u8"
        seg_pattern = str(output_dir / "segment_%03d.ts")
        cmd = [
            "ffmpeg", "-y", "-i", str(input_path),
            "-c:v", "libx264", "-preset", "medium", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
            "-hls_segment_filename", seg_pattern,
            str(master_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True, timeout=3600)

        # Upload HLS output to blob
        container_client = blob_service.get_container_client(container_name)
        for local_path in output_dir.rglob("*"):
            if local_path.is_file():
                rel = local_path.relative_to(output_dir)
                blob_name = f"{hls_prefix}/{rel.as_posix()}"
                with open(local_path, "rb") as f:
                    container_client.upload_blob(name=blob_name, data=f, overwrite=True)
                logging.info("Uploaded %s", blob_name)

        hls_playlist_path = f"events/{event_id}/video_hls/master.m3u8"

    # Notify backend
    if backend_base:
        try:
            import json
            import urllib.request
            url = f"{backend_base}/api/v1/events/{event_id}/hls-ready"
            data = json.dumps({"hls_playlist_path": hls_playlist_path}).encode()
            req = urllib.request.Request(url, data=data, method="PATCH")
            req.add_header("Content-Type", "application/json")
            if webhook_secret:
                req.add_header("X-HLS-Webhook-Secret", webhook_secret)
            with urllib.request.urlopen(req, timeout=30) as resp:
                logging.info("hls-ready response: %s", resp.status)
        except Exception as e:
            logging.error("Failed to call hls-ready: %s", e)


@app.blob_trigger(
    arg_name="blob",
    path="microsite/accelerators/{accelerator_id}/video_url.{ext}",
    connection="BlobStorageConnectionString",
)
def on_accelerator_video_upload(blob: func.InputStream) -> None:
    """
    When a new accelerator video is uploaded, transcode to HLS and notify the backend.
    Path params {accelerator_id} and {ext} are not injected by the runtime; parse from blob.name.
    """
    name = getattr(blob, "name", None) or ""
    parts = name.split("/")
    if len(parts) != 3 or not parts[1] or not parts[2].startswith("video_url."):
        logging.error("Unexpected blob path: %s", name)
        return
    accelerator_id = parts[1]
    ext = parts[2].split(".", 1)[-1] if "." in parts[2] else "mp4"
    logging.info(
        "Blob trigger (accelerator): accelerator_id=%s ext=%s size=%s",
        accelerator_id,
        ext,
        getattr(blob, "length", 0),
    )

    backend_base, webhook_secret, conn = get_config()
    if not conn:
        logging.error("BlobStorageConnectionString not set")
        return
    if not backend_base:
        logging.warning("BACKEND_BASE_URL not set; skipping hls-ready callback")

    blob_service = BlobServiceClient.from_connection_string(conn)
    container_name = "microsite"
    source_path = f"accelerators/{accelerator_id}/video_url.{ext}"
    hls_prefix = f"accelerators/{accelerator_id}/video_hls"

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / f"source.{ext}"
        output_dir = Path(tmpdir) / "hls"
        output_dir.mkdir()

        blob_client = blob_service.get_blob_client(container=container_name, blob=source_path)
        with open(input_path, "wb") as f:
            f.write(blob_client.download_blob().readall())
        logging.info("Downloaded %s to %s", source_path, input_path)

        master_path = output_dir / "master.m3u8"
        seg_pattern = str(output_dir / "segment_%03d.ts")
        cmd = [
            "ffmpeg", "-y", "-i", str(input_path),
            "-c:v", "libx264", "-preset", "medium", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
            "-hls_segment_filename", seg_pattern,
            str(master_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True, timeout=3600)

        container_client = blob_service.get_container_client(container_name)
        for local_path in output_dir.rglob("*"):
            if local_path.is_file():
                rel = local_path.relative_to(output_dir)
                blob_name = f"{hls_prefix}/{rel.as_posix()}"
                with open(local_path, "rb") as f:
                    container_client.upload_blob(name=blob_name, data=f, overwrite=True)
                logging.info("Uploaded %s", blob_name)

        hls_playlist_path = f"accelerators/{accelerator_id}/video_hls/master.m3u8"

    if backend_base:
        try:
            import json
            import urllib.request
            url = f"{backend_base}/api/v1/accelerators/{accelerator_id}/hls-ready"
            data = json.dumps({"hls_playlist_path": hls_playlist_path}).encode()
            req = urllib.request.Request(url, data=data, method="PATCH")
            req.add_header("Content-Type", "application/json")
            if webhook_secret:
                req.add_header("X-HLS-Webhook-Secret", webhook_secret)
            with urllib.request.urlopen(req, timeout=30) as resp:
                logging.info("accelerator hls-ready response: %s", resp.status)
        except Exception as e:
            logging.error("Failed to call accelerator hls-ready: %s", e)
