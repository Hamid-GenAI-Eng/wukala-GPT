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
    LLM_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    MIZAN_FAST_MODEL: str = "qwen3:8b"
    MIZAN_REASONING_MODEL: str = "qwen3:14b"
    MIZAN_REVIEW_MODEL: str = "qwen3:14b"
    
    GROQ_API_KEY: Optional[str] = None
    SECOND_GROQ: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    
    # Security (No default for SECRET_KEY to fail loudly in prod)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: list[str] = ["*"] # Override in production via ALLOWED_ORIGINS='["https://mydomain.com"]'
    
    # Models
    MIZAN_DENSE_MODEL: str = "BAAI/bge-large-en-v1.5"
    MIZAN_DENSE_DIMENSION: int = 1024
    MIZAN_SPARSE_MODEL: str = "prithivida/Splade_PP_en_v1"
    MIZAN_RERANK_MODEL: str = "jinaai/jina-reranker-v2-base-multilingual"
    
    # Retrieval configuration
    TOP_K_INITIAL: int = 15
    TOP_K_RERANK: int = 5
    
    # Data source
    CORPUS_PATH: str = "Legal corpus"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
