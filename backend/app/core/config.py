from pathlib import Path
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the backend directory (parent of app directory)
APP_DIR = Path(__file__).parent.parent
BACKEND_DIR = APP_DIR.parent  # Go up one more level to backend/
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "FastAPI Project"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    BACKEND_CORS_ORIGINS: str = ""

    @field_validator("BACKEND_CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: str) -> List[str]:
        if not v:
            return []
        return [i.strip() for i in v.split(",") if i.strip()]

    # Security
    SECRET_KEY: str = "change-me-in-production"
    
    # JWT Settings
    JWT_SECRET_KEY: str = "jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # MongoDB Settings
    # Pydantic settings will load these from .env file automatically
    MONGODB_URI: str
    MONGODB_DB_NAME: str
    
    # Azure Blob Storage Settings
    # Full SAS URL for the blob container (includes SAS token)
    AZURE_BLOB_SAS_URL: str = ""
    
    # Azure Communication Services Email Settings
    AZURE_COMMUNICATION_CONNECTION_STRING: str = ""
    AZURE_COMMUNICATION_SENDER_ADDRESS: str = ""
    
    # Contact Form Email Settings
    CONTACTUS_RECEIVER_EMAIL: str = ""
    CONTACTUS_RECEIVER_CC_EMAIL: str = ""  # Comma-separated email addresses
    
    # Backend Base URL (for generating calendar download links in emails)
    BACKEND_BASE_URL: str = ""
    
    def get_contactus_cc_emails(self) -> List[str]:
        """Parse comma-separated CC email addresses into a list"""
        if not self.CONTACTUS_RECEIVER_CC_EMAIL:
            return []
        return [email.strip() for email in self.CONTACTUS_RECEIVER_CC_EMAIL.split(",") if email.strip()]
    
    # TOTP/MFA Settings
    TOTP_ENABLED: bool = True
    TOTP_ISSUER_NAME: str = "MongoDB Microsite"
    TOTP_DIGITS: int = 6
    TOTP_PERIOD: int = 30
    TOTP_ALGORITHM: str = "SHA1"
    
    # CRITICAL: Encryption key for TOTP secrets (must be set in environment)
    TOTP_SECRET_ENCRYPTION_KEY: str = ""
    
    # Rate Limiting
    TOTP_MAX_ATTEMPTS_PER_WINDOW: int = 5
    TOTP_RATE_LIMIT_WINDOW_MINUTES: int = 15
    TOTP_MAX_FAILURES_BEFORE_LOCK: int = 10
    TOTP_ACCOUNT_LOCK_DURATION_MINUTES: int = 60
    
    # Backup Codes
    TOTP_BACKUP_CODES_COUNT: int = 10
    TOTP_BACKUP_CODE_BCRYPT_ROUNDS: int = 12
    
    # Time Window Tolerance
    TOTP_TIME_WINDOW_TOLERANCE: int = 1  # ±1 window (30 seconds each way)
    TOTP_ALLOW_CODE_REUSE: bool = False
    
    # SMTP Email Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_TLS: bool = True
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@peerislands.io"

    
    # Azure OpenAI Configuration
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "gpt-4-turbo"
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


def get_settings() -> Settings:
    """Get application settings instance."""
    return settings

