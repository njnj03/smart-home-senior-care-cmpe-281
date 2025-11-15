"""Metrics router for dashboard metrics."""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from app.database import get_db
from app.models.alert import Alert
from app.models.device import Device
from app.models.house import House
from app.schemas.metrics import MetricsResponse, SystemHealth
import random

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])


@router.get("", response_model=MetricsResponse)
async def get_metrics(
    db: AsyncSession = Depends(get_db),
):
    """
    Get dashboard metrics.
    """
    # Active houses (houses with active alerts)
    active_houses_query = select(func.count(distinct(Alert.house_id))).where(
        Alert.status == "active"
    )
    active_houses_result = await db.execute(active_houses_query)
    active_houses = active_houses_result.scalar() or 0
    
    # Total devices
    total_devices_query = select(func.count(Device.device_id))
    total_devices_result = await db.execute(total_devices_query)
    total_devices = total_devices_result.scalar() or 0
    
    # Online devices
    online_devices_query = select(func.count(Device.device_id)).where(
        Device.status == "online"
    )
    online_devices_result = await db.execute(online_devices_query)
    online_devices = online_devices_result.scalar() or 0
    
    # Active alerts
    active_alerts_query = select(func.count(Alert.alert_id)).where(
        Alert.status == "active"
    )
    active_alerts_result = await db.execute(active_alerts_query)
    active_alerts = active_alerts_result.scalar() or 0
    
    # System health (simulated for MVP)
    system_health = SystemHealth(
        api_latency=40 + random.randint(0, 30),
        queue_depth=random.randint(0, 10),
    )
    
    return MetricsResponse(
        active_houses=active_houses,
        total_devices=total_devices,
        online_devices=online_devices,
        active_alerts=active_alerts,
        system_health=system_health,
    )
