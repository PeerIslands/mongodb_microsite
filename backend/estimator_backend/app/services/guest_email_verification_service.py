import hashlib
import re
import secrets
from datetime import datetime, timedelta

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.services.email_service import EmailService
from app.core.config import settings


class GuestEmailVerificationError(ValueError):
    """Raised when guest email verification cannot proceed."""


class GuestEmailVerificationService:
    COLLECTION_NAME = "estimator_guest_email_verifications"

    def __init__(self, db: AsyncIOMotorDatabase):
        self._db = db
        self._collection = db[self.COLLECTION_NAME]
        self._email_service = EmailService()
        self._otp_expiry_minutes = settings.ESTIMATOR_GUEST_OTP_EXPIRY_MINUTES
        self._verified_session_minutes = settings.ESTIMATOR_GUEST_VERIFICATION_SESSION_MINUTES
        self._resend_cooldown_seconds = settings.ESTIMATOR_GUEST_OTP_RESEND_COOLDOWN_SECONDS
        self._max_attempts = settings.ESTIMATOR_GUEST_OTP_MAX_ATTEMPTS

    @staticmethod
    def normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _hash_value(value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()

    @staticmethod
    def _generate_otp_code() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    @staticmethod
    def _generate_verification_token() -> str:
        return secrets.token_urlsafe(32)

    async def send_otp(self, email: str, name: str | None = None) -> dict:
        normalized_email = self.normalize_email(email)
        now = datetime.utcnow()
        existing = await self._collection.find_one({"email": normalized_email})

        if existing and existing.get("last_sent_at"):
            seconds_since_last_send = (now - existing["last_sent_at"]).total_seconds()
            if seconds_since_last_send < self._resend_cooldown_seconds:
                remaining = int(self._resend_cooldown_seconds - seconds_since_last_send)
                raise GuestEmailVerificationError(
                    f"Please wait {max(1, remaining)} seconds before requesting another OTP."
                )

        otp_code = self._generate_otp_code()
        otp_expires_at = now + timedelta(minutes=self._otp_expiry_minutes)
        expires_at = otp_expires_at

        display_name = (name or "").strip() or "there"
        subject = "Your MongoDB estimator verification code"
        body = (
            f"Hi {display_name},\n\n"
            f"Your verification code for the MongoDB migration estimator is: {otp_code}\n\n"
            f"This code expires in {self._otp_expiry_minutes} minutes.\n"
            "If you did not request this code, you can ignore this email.\n"
        )

        email_result = await self._email_service.send_simple_email(
            to_address=normalized_email,
            subject=subject,
            body=body,
        )
        if not email_result.get("success"):
            raise GuestEmailVerificationError("Failed to send verification email. Please try again.")

        await self._collection.update_one(
            {"email": normalized_email},
            {
                "$set": {
                    "email": normalized_email,
                    "otp_hash": self._hash_value(otp_code),
                    "otp_expires_at": otp_expires_at,
                    "verification_attempts": 0,
                    "verified": False,
                    "verification_token_hash": None,
                    "verified_session_expires_at": None,
                    "expires_at": expires_at,
                    "updated_at": now,
                    "last_sent_at": now,
                },
                "$setOnInsert": {"created_at": now},
                "$inc": {"send_count": 1},
            },
            upsert=True,
        )

        return {
            "message": f"OTP sent to {normalized_email}",
            "resend_cooldown_seconds": self._resend_cooldown_seconds,
        }

    async def verify_otp(self, email: str, otp_code: str) -> dict:
        normalized_email = self.normalize_email(email)
        now = datetime.utcnow()
        record = await self._collection.find_one({"email": normalized_email})

        if not record or not record.get("otp_hash") or not record.get("otp_expires_at"):
            raise GuestEmailVerificationError("OTP request not found. Please request a new code.")

        if record["otp_expires_at"] < now:
            raise GuestEmailVerificationError("OTP has expired. Please request a new code.")

        attempts = int(record.get("verification_attempts", 0))
        if attempts >= self._max_attempts:
            raise GuestEmailVerificationError("Too many invalid attempts. Please request a new code.")

        clean_otp_code = re.sub(r"\D", "", otp_code or "")
        if self._hash_value(clean_otp_code) != record["otp_hash"]:
            await self._collection.update_one(
                {"_id": record["_id"]},
                {"$inc": {"verification_attempts": 1}, "$set": {"updated_at": now}},
            )
            remaining_attempts = max(0, self._max_attempts - attempts - 1)
            raise GuestEmailVerificationError(
                "Invalid OTP code."
                if remaining_attempts == 0
                else f"Invalid OTP code. {remaining_attempts} attempts remaining."
            )

        verification_token = self._generate_verification_token()
        verified_session_expires_at = now + timedelta(minutes=self._verified_session_minutes)

        await self._collection.update_one(
            {"_id": record["_id"]},
            {
                "$set": {
                    "verified": True,
                    "otp_hash": None,
                    "otp_expires_at": None,
                    "verification_attempts": 0,
                    "verification_token_hash": self._hash_value(verification_token),
                    "verified_session_expires_at": verified_session_expires_at,
                    "expires_at": verified_session_expires_at,
                    "verified_at": now,
                    "updated_at": now,
                }
            },
        )

        return {
            "message": "Email verified successfully.",
            "verification_token": verification_token,
            "expires_in_seconds": self._verified_session_minutes * 60,
        }

    async def validate_verified_email(self, email: str, verification_token: str) -> bool:
        normalized_email = self.normalize_email(email)
        record = await self._collection.find_one({"email": normalized_email, "verified": True})
        if not record:
            return False

        expires_at = record.get("verified_session_expires_at")
        token_hash = record.get("verification_token_hash")
        if not expires_at or expires_at < datetime.utcnow() or not token_hash:
            return False

        return token_hash == self._hash_value(verification_token)
