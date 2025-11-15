"""House schemas."""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class HouseResponse(BaseModel):
    """Schema for house response."""
    house_id: int
    tenant_id: int
    house_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class HouseListResponse(BaseModel):
    """Schema for house list response."""
    houses: List[HouseResponse]
