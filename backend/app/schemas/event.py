"""Event schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class EventCreate(BaseModel):
    """Schema for creating an event."""
    house_id: int
    device_id: int
    timestamp: datetime


class EventResponse(BaseModel):
    """Schema for event response."""
    event_id: int
    house_id: int
    device_id: int
    event_type: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    media_url: Optional[str] = None
    created_at: datetime
    is_processed: bool
    
    class Config:
        from_attributes = True
