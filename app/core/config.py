from pathlib import Path
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the app directory (parent of core directory)
APP_DIR = Path(__file__).parent.parent
ENV_FILE = APP_DIR / ".env"


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
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # MongoDB Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "microsite"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

