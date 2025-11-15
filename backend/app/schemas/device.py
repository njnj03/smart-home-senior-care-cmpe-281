"""Device schemas."""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DeviceResponse(BaseModel):
    """Schema for device response."""
    device_id: int
    house_id: int
    device_type_id: int
    device_name: Optional[str] = None
    location: Optional[str] = None
    mac_address: Optional[str] = None
    firmware_version: Optional[str] = None
    status: str  # online, offline, degraded, disabled
    last_heartbeat: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_enabled: bool
    
    class Config:
        from_attributes = True


class DeviceListResponse(BaseModel):
    """Schema for device list response."""
    devices: List[DeviceResponse]
