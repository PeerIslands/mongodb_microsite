from pydantic import BaseModel, EmailStr, Field


class GuestEmailSendOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Guest email to verify")
    name: str | None = Field(None, description="Guest name for email personalization")


class GuestEmailSendOTPResponse(BaseModel):
    success: bool = True
    message: str
    resend_cooldown_seconds: int


class GuestEmailVerifyOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Guest email being verified")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6 digit OTP code")


class GuestEmailVerifyOTPResponse(BaseModel):
    success: bool = True
    message: str
    verification_token: str
    expires_in_seconds: int
