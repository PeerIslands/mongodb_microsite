from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from estimator_backend.app.api.v1.schemas.guest_email_verification import (
    GuestEmailSendOTPRequest,
    GuestEmailSendOTPResponse,
    GuestEmailVerifyOTPRequest,
    GuestEmailVerifyOTPResponse,
)
from estimator_backend.app.core.database import get_database
from estimator_backend.app.services.guest_email_verification_service import (
    GuestEmailVerificationError,
    GuestEmailVerificationService,
)

router = APIRouter(prefix="/guest-email", tags=["guest-email"])


@router.post("/send-otp", response_model=GuestEmailSendOTPResponse, status_code=status.HTTP_200_OK)
async def send_guest_email_otp(
    payload: GuestEmailSendOTPRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = GuestEmailVerificationService(db)
    try:
        result = await service.send_otp(email=payload.email, name=payload.name)
    except GuestEmailVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return GuestEmailSendOTPResponse(
        message=result["message"],
        resend_cooldown_seconds=result["resend_cooldown_seconds"],
    )


@router.post("/verify-otp", response_model=GuestEmailVerifyOTPResponse, status_code=status.HTTP_200_OK)
async def verify_guest_email_otp(
    payload: GuestEmailVerifyOTPRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    service = GuestEmailVerificationService(db)
    try:
        result = await service.verify_otp(email=payload.email, otp_code=payload.otp_code)
    except GuestEmailVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return GuestEmailVerifyOTPResponse(
        message=result["message"],
        verification_token=result["verification_token"],
        expires_in_seconds=result["expires_in_seconds"],
    )
