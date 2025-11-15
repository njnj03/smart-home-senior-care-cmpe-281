"""Configuration management for the backend application."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/dbname"
    
    # Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # CORS - can be set as comma-separated string or list
    cors_origins_str: Optional[str] = None
    
    # Storage
    storage_path: str = "./storage/audio"
    
    # Policy Engine
    policy_threshold: float = 0.7  # Default threshold for alert creation
    policy_aggregation_window_seconds: int = 60  # Window for aggregating events
    policy_min_events_for_alert: int = 1  # Minimum events in window to trigger alert
    
    # ML Model path (defaults to model in models/ directory)
    ml_model_path: Optional[str] = None  # If None, uses models/my_yamnet_human_model.keras
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        protected_namespaces = ('settings_',)
    
    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from environment variable."""
        if self.cors_origins_str:
            return [origin.strip() for origin in self.cors_origins_str.split(",")]
        return ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()

