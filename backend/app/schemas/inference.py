"""Inference schemas."""
from pydantic import BaseModel
from typing import Optional


class InferenceRequest(BaseModel):
    """Schema for inference request."""
    file_path: Optional[str] = None  # For testing endpoint


class InferenceResponse(BaseModel):
    """Schema for inference response."""
    label: str
    score: float

