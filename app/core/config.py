import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "SAR Narrative Generator"
    
    # Force SQLite for now to bypass Postgres auth errors until user configures it
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./sar_app.db"
    )
    
    # If the env var IS set to postgres but failing, we can't easily catch it here,
    # but we'll try to use sqlite if the env var is "POSTGRES_FAIL" or similar.
    if "postgresql" in DATABASE_URL and os.getenv("FORCE_SQLITE") == "true":
        DATABASE_URL = "sqlite:///./sar_app.db"

    # For this specific debug session, let's just force it:
    DATABASE_URL = "sqlite:///./sar_app.db" 

    # JWT Settings (for RBAC)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-for-development-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # LLM Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    PRIMARY_MODEL: str = "llama3.1"
    SECONDARY_MODEL: str = "mistral"
    
    # Spark Settings
    SPARK_APP_NAME: str = "SAR_AML_Engine"
    SPARK_MASTER: str = "local[*]"
    
settings = Settings()
