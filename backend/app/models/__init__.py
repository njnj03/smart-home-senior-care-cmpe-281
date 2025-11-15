"""Database models."""
from app.models.event import Event
from app.models.alert import Alert
from app.models.audit_log import AuditLog
from app.models.device import Device
from app.models.house import House
from app.models.tenant import Tenant
from app.models.device_type import DeviceType
from app.models.alert_type import AlertType
from app.models.alert_rule import AlertRule
from app.models.ml_model import MLModel

__all__ = [
    "Event",
    "Alert",
    "AuditLog",
    "Device",
    "House",
    "Tenant",
    "DeviceType",
    "AlertType",
    "AlertRule",
    "MLModel",
]
