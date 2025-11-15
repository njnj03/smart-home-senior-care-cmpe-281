"""Pydantic schemas for request/response validation."""
from app.schemas.event import EventCreate, EventResponse
from app.schemas.alert import (
    AlertResponse,
    AlertListResponse,
    AlertAcknowledge,
    AlertResolve,
    AlertDismiss,
)
from app.schemas.device import DeviceResponse, DeviceListResponse
from app.schemas.house import HouseResponse, HouseListResponse
from app.schemas.health import HealthResponse
from app.schemas.metrics import MetricsResponse
from app.schemas.inference import InferenceRequest, InferenceResponse
from app.schemas.ml_model import (
    MLModelResponse,
    MLModelListResponse,
    MLModelCreate,
    MLModelUpdate,
    MLModelActivate,
)

__all__ = [
    "EventCreate",
    "EventResponse",
    "AlertResponse",
    "AlertListResponse",
    "AlertAcknowledge",
    "AlertResolve",
    "AlertDismiss",
    "DeviceResponse",
    "DeviceListResponse",
    "HouseResponse",
    "HouseListResponse",
    "HealthResponse",
    "MetricsResponse",
    "InferenceRequest",
    "InferenceResponse",
    "MLModelResponse",
    "MLModelListResponse",
    "MLModelCreate",
    "MLModelUpdate",
    "MLModelActivate",
]

