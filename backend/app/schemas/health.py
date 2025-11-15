"""Health check schemas."""
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Schema for health check response."""
    status: str
    version: str
    database: bool

