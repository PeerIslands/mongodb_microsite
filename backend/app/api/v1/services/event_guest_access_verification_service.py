import hashlib
import re
import secrets
from datetime import datetime, timedelta
from html import escape
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.services.email_service import EmailService
from app.core.config import settings


class EventGuestAccessVerificationError(ValueError):
    """Raised when guest webinar access verification cannot proceed."""


class EventGuestAccessVerificationService:
    COLLECTION_NAME = "event_guest_access_verifications"

    def __init__(self, db: AsyncIOMotorDatabase):
        self._db = db
        self._collection = db[self.COLLECTION_NAME]
        self._email_service = EmailService()
        self._otp_expiry_minutes = settings.EVENT_GUEST_ACCESS_OTP_EXPIRY_MINUTES
        self._resend_cooldown_seconds = settings.EVENT_GUEST_ACCESS_OTP_RESEND_COOLDOWN_SECONDS
        self._max_attempts = settings.EVENT_GUEST_ACCESS_OTP_MAX_ATTEMPTS

    @staticmethod
    def normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _hash_value(value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()

    @staticmethod
    def _generate_otp_code() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    async def send_otp(self, event_id: str, email: str, name: str | None, event_title: str) -> dict:
        normalized_email = self.normalize_email(email)
        now = datetime.utcnow()
        existing = await self._collection.find_one({"event_id": event_id, "email": normalized_email})

        if existing and existing.get("last_sent_at"):
            seconds_since_last_send = (now - existing["last_sent_at"]).total_seconds()
            if seconds_since_last_send < self._resend_cooldown_seconds:
                remaining = int(self._resend_cooldown_seconds - seconds_since_last_send)
                raise EventGuestAccessVerificationError(
                    f"Please wait {max(1, remaining)} seconds before requesting another code."
                )

        otp_code = self._generate_otp_code()
        otp_expires_at = now + timedelta(minutes=self._otp_expiry_minutes)
        display_name = (name or "").strip() or "there"
        subject = f"Your access code for {event_title}"

        template_path = Path(__file__).resolve().parents[3] / "templates" / "event_guest_access_otp.html"
        with open(template_path, "r", encoding="utf-8") as f:
            html_template = f.read()

        html_body = html_template.replace("{{display_name}}", escape(display_name))
        html_body = html_body.replace("{{event_title}}", escape(event_title))
        html_body = html_body.replace("{{otp_code}}", escape(otp_code))
        html_body = html_body.replace("{{expiry_minutes}}", str(self._otp_expiry_minutes))

        plain_text_body = (
            f"Hi {display_name},\n\n"
            f"Use this code to access the on-demand webinar resources for '{event_title}': {otp_code}\n\n"
            f"This code expires in {self._otp_expiry_minutes} minutes.\n"
            "If you did not request access, you can ignore this email.\n"
            "Do not share this code with anyone.\n"
        )

        email_result = await self._email_service.send_email(
            to_addresses=[normalized_email],
            subject=subject,
            html_content=html_body,
            plain_text_content=plain_text_body,
        )
        if not email_result.get("success"):
            raise EventGuestAccessVerificationError("Failed to send access code email. Please try again.")

        await self._collection.update_one(
            {"event_id": event_id, "email": normalized_email},
            {
                "$set": {
                    "event_id": event_id,
                    "email": normalized_email,
                    "otp_hash": self._hash_value(otp_code),
                    "otp_expires_at": otp_expires_at,
                    "verification_attempts": 0,
                    "updated_at": now,
                    "last_sent_at": now,
                },
                "$setOnInsert": {"created_at": now},
                "$inc": {"send_count": 1},
            },
            upsert=True,
        )

        return {
            "message": f"Access code sent to {normalized_email}",
            "resend_cooldown_seconds": self._resend_cooldown_seconds,
        }

    async def verify_otp(self, event_id: str, email: str, otp_code: str) -> bool:
        normalized_email = self.normalize_email(email)
        now = datetime.utcnow()
        record = await self._collection.find_one({"event_id": event_id, "email": normalized_email})

        if not record or not record.get("otp_hash") or not record.get("otp_expires_at"):
            raise EventGuestAccessVerificationError("Access code request not found. Please request a new code.")

        if record["otp_expires_at"] < now:
            raise EventGuestAccessVerificationError("Access code has expired. Please request a new code.")

        attempts = int(record.get("verification_attempts", 0))
        if attempts >= self._max_attempts:
            raise EventGuestAccessVerificationError("Too many invalid attempts. Please request a new code.")

        clean_otp_code = re.sub(r"\D", "", otp_code or "")
        if self._hash_value(clean_otp_code) != record["otp_hash"]:
            await self._collection.update_one(
                {"_id": record["_id"]},
                {"$inc": {"verification_attempts": 1}, "$set": {"updated_at": now}},
            )
            remaining_attempts = max(0, self._max_attempts - attempts - 1)
            raise EventGuestAccessVerificationError(
                "Invalid access code."
                if remaining_attempts == 0
                else f"Invalid access code. {remaining_attempts} attempts remaining."
            )

        await self._collection.update_one(
            {"_id": record["_id"]},
            {
                "$set": {
                    "otp_hash": None,
                    "otp_expires_at": None,
                    "verification_attempts": 0,
                    "verified_at": now,
                    "updated_at": now,
                }
            },
        )

        return True
