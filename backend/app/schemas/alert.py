"""Alert schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class AlertResponse(BaseModel):
    """Schema for alert response."""
    alert_id: int
    house_id: int
    device_id: int
    event_id: Optional[int] = None
    alert_type_id: int
    alert_type_name: Optional[str] = None
    rule_id: Optional[int] = None
    severity: str  # critical, high, medium, low
    status: str  # active, acknowledged, resolved, false_positive
    confidence_score: Optional[Decimal] = None
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    """Schema for alert list response."""
    alerts: List[AlertResponse]
    total: int


class AlertAcknowledge(BaseModel):
    """Schema for acknowledging an alert."""
    notes: Optional[str] = None


class AlertResolve(BaseModel):
    """Schema for resolving an alert."""
    notes: Optional[str] = None


class AlertDismiss(BaseModel):
    """Schema for dismissing an alert."""
    notes: Optional[str] = None
