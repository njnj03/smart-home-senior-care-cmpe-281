"""Metrics schemas."""
from pydantic import BaseModel


class SystemHealth(BaseModel):
    """System health metrics."""
    api_latency: int
    queue_depth: int


class MetricsResponse(BaseModel):
    """Schema for metrics response."""
    active_houses: int
    total_devices: int
    online_devices: int
    active_alerts: int
    system_health: SystemHealth

