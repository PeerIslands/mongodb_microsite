"""
Home popup endpoints.
Public: GET config (if enabled), GET image proxy.
Admin: GET full config, PUT update, POST upload image.
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import StreamingResponse

from app.api.v1.models.home_popup import (
    HomePopupConfig,
    HomePopupPublicResponse,
    HomePopupAdminResponse,
    HomePopupUpdateRequest,
)
from app.api.v1.models.user import UserModel
from app.api.v1.repositories.home_popup_repository import HomePopupRepository
from app.api.v1.dependencies.services import (
    get_home_popup_repository,
    get_current_user,
)
from app.api.v1.services.azure_blob_service import get_azure_blob_service, AzureBlobServiceError

router = APIRouter(prefix="/home-popup", tags=["home-popup"])


def require_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


# =============================================================================
# Public
# =============================================================================


@router.get("", response_model=HomePopupPublicResponse | None)
async def get_public_config(
    repo: HomePopupRepository = Depends(get_home_popup_repository),
):
    """Return popup config only if enabled and has an image. Otherwise 204/empty."""
    doc = await repo.get()
    if not doc or not doc.get("enabled") or not doc.get("image_url"):
        return None
    return HomePopupPublicResponse(
        image_url=doc["image_url"],
        title_text=doc.get("title_text") or "On-Demand webinar",
        cta_text=doc.get("cta_text") or "Click here to visit our On-Demand Webinars",
        cta_link=doc.get("cta_link") or "/events/on-demand",
    )


@router.get("/image")
async def get_popup_image(
    repo: HomePopupRepository = Depends(get_home_popup_repository),
):
    """Stream the popup background image from blob storage."""
    doc = await repo.get()
    blob_path = doc.get("image_url") if doc else None
    if not blob_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No popup image configured",
        )
    blob_service = get_azure_blob_service()
    try:
        content_type, content_length = await blob_service.get_file_info(blob_path)
    except AzureBlobServiceError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    if not content_type:
        content_type = "image/jpeg"

    async def stream_blob():
        async for chunk in blob_service.stream_file(blob_path):
            yield chunk

    headers = {"Cache-Control": "public, max-age=604800, immutable"}  # 7 days
    if content_length:
        headers["Content-Length"] = str(content_length)
    return StreamingResponse(
        stream_blob(),
        media_type=content_type,
        headers=headers,
    )


# =============================================================================
# Admin
# =============================================================================


@router.get("/admin", response_model=HomePopupAdminResponse)
async def get_admin_config(
    repo: HomePopupRepository = Depends(get_home_popup_repository),
    current_user: UserModel = Depends(require_admin),
):
    """Return full popup config for admin."""
    doc = await repo.get()
    if not doc:
        return HomePopupAdminResponse(
            image_url=None,
            title_text="On-Demand webinar",
            cta_text="Click here to visit our On-Demand Webinars",
            cta_link="/events/on-demand",
            enabled=True,
        )
    return HomePopupAdminResponse(
        image_url=doc.get("image_url"),
        title_text=doc.get("title_text") or "On-Demand webinar",
        cta_text=doc.get("cta_text") or "Click here to visit our On-Demand Webinars",
        cta_link=doc.get("cta_link") or "/events/on-demand",
        enabled=doc.get("enabled", True),
    )


@router.put("/admin", response_model=HomePopupAdminResponse)
async def update_admin_config(
    body: HomePopupUpdateRequest,
    repo: HomePopupRepository = Depends(get_home_popup_repository),
    current_user: UserModel = Depends(require_admin),
):
    """Update popup config (text and enabled; image via upload endpoint)."""
    data = body.model_dump(exclude_none=True)
    updated = await repo.update(data)
    if not updated:
        return HomePopupAdminResponse(
            image_url=None,
            title_text=data.get("title_text", "On-Demand webinar"),
            cta_text=data.get("cta_text", "Click here to visit our On-Demand Webinars"),
            cta_link=data.get("cta_link", "/events/on-demand"),
            enabled=data.get("enabled", True),
        )
    return HomePopupAdminResponse(
        image_url=updated.get("image_url"),
        title_text=updated.get("title_text") or "On-Demand webinar",
        cta_text=updated.get("cta_text") or "Click here to visit our On-Demand Webinars",
        cta_link=updated.get("cta_link") or "/events/on-demand",
        enabled=updated.get("enabled", True),
    )


@router.post("/admin/upload", response_model=HomePopupAdminResponse)
async def upload_popup_image(
    file: UploadFile = File(..., description="Background image (JPEG, PNG, WebP, GIF)"),
    repo: HomePopupRepository = Depends(get_home_popup_repository),
    current_user: UserModel = Depends(require_admin),
):
    """Upload popup background image; updates config with new blob path."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected",
        )
    content_type = file.content_type or "image/jpeg"
    content = await file.read()
    blob_service = get_azure_blob_service()
    try:
        blob_path = await blob_service.upload_image(
            file_content=content,
            category="homepopup",
            item_id="popup",
            field_name="image",
            original_filename=file.filename,
            content_type=content_type,
        )
    except AzureBlobServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    updated = await repo.update({"image_url": blob_path})
    return HomePopupAdminResponse(
        image_url=updated.get("image_url") or blob_path,
        title_text=updated.get("title_text") or "On-Demand webinar",
        cta_text=updated.get("cta_text") or "Click here to visit our On-Demand Webinars",
        cta_link=updated.get("cta_link") or "/events/on-demand",
        enabled=updated.get("enabled", True),
    )
