from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Railway provides DATABASE_URL directly; individual vars used as fallback
    DATABASE_URL_OVERRIDE: str | None = None  # set via DATABASE_URL env var on Railway

    # Database (fallback for local/docker)
    POSTGRES_DB: str = "agrohub"
    POSTGRES_USER: str = "agrohub"
    POSTGRES_PASSWORD: str = "agrohub"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        # Allow DATABASE_URL env var to map to DATABASE_URL_OVERRIDE
        env_prefix="",
    )

    def model_post_init(self, __context):
        import os
        raw = os.environ.get("DATABASE_URL", "")
        if raw and not self.DATABASE_URL_OVERRIDE:
            object.__setattr__(self, "DATABASE_URL_OVERRIDE", raw)

    @computed_field
    @property
    def DB_SSL_REQUIRED(self) -> bool:
        """asyncpg requires ssl via connect_args, not URL param."""
        raw = self.DATABASE_URL_OVERRIDE or ""
        return "sslmode=require" in raw or "sslmode=prefer" in raw

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_URL_OVERRIDE:
            import re
            url = self.DATABASE_URL_OVERRIDE
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            # asyncpg does not support sslmode URL param — strip it
            url = re.sub(r"[?&]sslmode=[^&]*", "", url)
            url = re.sub(r"\?$", "", url)
            return url
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @computed_field
    @property
    def DATABASE_URL_SYNC(self) -> str:
        if self.DATABASE_URL_OVERRIDE:
            url = self.DATABASE_URL_OVERRIDE
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            return url
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ROOT_USER: str = "minioadmin"
    MINIO_ROOT_PASSWORD: str = "minioadmin"
    MINIO_BUCKET: str = "agrohub"

    # External APIs
    YANDEX_API_KEY: str = "9a0b5050-70b5-43a3-a1de-bb2fc3a4abdd"

    # App
    ENVIRONMENT: str = "development"
    APP_TITLE: str = "AgroHub Logistic API"
    APP_VERSION: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
