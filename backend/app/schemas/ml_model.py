"""ML Model schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from decimal import Decimal


class MLModelResponse(BaseModel):
    """Schema for ML model response."""
    model_id: int
    model_name: str
    version: Optional[str] = None
    file_path: str
    description: Optional[str] = None
    model_type: Optional[str] = None
    accuracy: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    created_by_user_id: Optional[int] = None
    
    class Config:
        from_attributes = True
        protected_namespaces = ()  # Disable protected namespace warnings


class MLModelListResponse(BaseModel):
    """Schema for ML model list response."""
    models: List[MLModelResponse]
    active_model: Optional[MLModelResponse] = None


class MLModelCreate(BaseModel):
    """Schema for creating a new ML model."""
    model_name: str
    version: Optional[str] = None
    file_path: str
    description: Optional[str] = None
    model_type: Optional[str] = None
    accuracy: Optional[Decimal] = None


class MLModelUpdate(BaseModel):
    """Schema for updating an ML model."""
    model_name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    model_type: Optional[str] = None
    accuracy: Optional[Decimal] = None


class MLModelActivate(BaseModel):
    """Schema for activating a model."""
    model_id: int

