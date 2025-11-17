"""
Application configuration management
"""
from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "AstralAI Marketing Platform"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # API
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_URL: str = "http://localhost:8000"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 1 week
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # Database
    DATABASE_URL: str
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ai_marketing_agent"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # AI Services
    OPENAI_API_KEY: str
    ANTHROPIC_API_KEY: Optional[str] = None
    RUNWAY_API_KEY: Optional[str] = None
    DID_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    REPLICATE_API_TOKEN: Optional[str] = None

    # Social Media - Meta
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_ACCESS_TOKEN: Optional[str] = None

    # Social Media - TikTok
    TIKTOK_CLIENT_KEY: Optional[str] = None
    TIKTOK_CLIENT_SECRET: Optional[str] = None
    TIKTOK_ACCESS_TOKEN: Optional[str] = None

    # Social Media - Google
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REFRESH_TOKEN: Optional[str] = None
    GOOGLE_ADS_DEVELOPER_TOKEN: Optional[str] = None
    GOOGLE_ADS_CUSTOMER_ID: Optional[str] = None

    # Storage - AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None

    # Storage - Cloudflare R2 (alternative)
    CLOUDFLARE_ACCOUNT_ID: Optional[str] = None
    CLOUDFLARE_ACCESS_KEY_ID: Optional[str] = None
    CLOUDFLARE_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: Optional[str] = None

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@entradeltd.com"

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOGTAIL_TOKEN: Optional[str] = None

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_VIDEO_GENERATION_PER_DAY: int = 50

    # Feature Flags
    ENABLE_AUTO_POSTING: bool = True
    ENABLE_VIDEO_GENERATION: bool = True
    ENABLE_AI_AVATARS: bool = True
    ENABLE_ANALYTICS: bool = True

    # Business Settings
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: List[str] = ["en", "es", "fr", "de", "it", "pt", "he"]
    COMPANY_NAME: str = "AstralAI"
    COMPANY_WEBSITE: str = "https://astralai.com"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
