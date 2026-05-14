from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mizan AI"
    API_V1_STR: str = "/api/v1"
    
    # Qdrant Settings
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: Optional[str] = None
    
    # LLM Settings
    GROQ_API_KEY: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "a_very_secret_key_for_mizan_ai_REPLACE_ME_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: list[str] = ["*"] # Override in production via ALLOWED_ORIGINS='["https://mydomain.com"]'
    
    # Data source
    CORPUS_PATH: str = "Legal corpus"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
