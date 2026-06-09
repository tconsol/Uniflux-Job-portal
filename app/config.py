from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Job Portal Service"
    DEBUG: bool = False
    API_VERSION: str = "v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = "job_portal_db"
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_OAUTH_REDIRECT_URI: str = os.getenv(
        "GOOGLE_OAUTH_REDIRECT_URI",
        "http://localhost:8000/api/v1/auth/oauth/google/callback"
    )
    STRIPE_API_KEY: str = os.getenv("STRIPE_API_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_CLIENT_ID: str = os.getenv("STRIPE_CLIENT_ID", "")
    JOB_AGGREGATION_SERVICE_URL: str = os.getenv("JOB_AGGREGATION_SERVICE_URL", "http://localhost:8001")
    ADMIN_SERVICE_URL: str = os.getenv("ADMIN_SERVICE_URL", "http://localhost:8002")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    @property
    def JWT_ALGORITHM(self) -> str:
        return "HS256"


settings = Settings()