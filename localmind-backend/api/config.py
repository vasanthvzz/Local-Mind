from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration settings."""

    APP_NAME: str = "LocalMind"

    # MODELS AND EMBEDDINGS
    LLM_MODEL: str = "llama3.1"
    EMBEDDING_MODEL: str = "bge-m3"

    # MODEL SERVING URLS
    LLM_BASE_URL: str = "http://localhost:11434"

    # Vector Store Configuration
    VECTOR_STORE_TYPE: str = "chroma"  # or "faiss", "pinecone", etc.

    # Storage Paths
    VECTOR_DB_DIR: str = "./storage/vector_db"
    DOCUMENTS_DIR: str = "./storage/documents"

    # Chunking Configuration
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 150

    # LLM Configuration
    LLM_MAX_TOKENS: int = 2000
    LLM_TEMPERATURE: float = 0.7

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()