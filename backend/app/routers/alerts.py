"""Alerts router for alert lifecycle management."""
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.database import get_db
from app.models.alert import Alert
from app.models.house import House
from app.models.alert_type import AlertType
# Audit logs removed - not needed
from app.schemas.alert import (
    AlertResponse,
    AlertListResponse,
    AlertAcknowledge,
    AlertResolve,
    AlertDismiss,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("", response_model=AlertListResponse)
async def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    house_id: Optional[int] = Query(None, description="Filter by house ID"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    List alerts with optional filtering.
    """
    query = select(Alert, House.latitude, House.longitude, AlertType.type_name).join(
        House, House.house_id == Alert.house_id
    ).join(
        AlertType, AlertType.alert_type_id == Alert.alert_type_id
    )
    
    # Apply filters
    conditions = []
    if severity:
        conditions.append(Alert.severity == severity)
    if status:
        conditions.append(Alert.status == status)
    if house_id:
        conditions.append(Alert.house_id == house_id)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Get total count
    count_query = select(func.count()).select_from(Alert)
    if conditions:
        count_query = count_query.where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    rows = result.all()

    alerts = []
    for alert, lat, lng, alert_type_name in rows:
        alert_obj = AlertResponse.model_validate(alert)
        alert_obj.latitude = lat
        alert_obj.longitude = lng
        alert_obj.alert_type_name = alert_type_name
        alerts.append(alert_obj)

    return AlertListResponse(alerts=alerts, total=total or 0)


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get alert details by ID.
    """
    query = select(Alert, House.latitude, House.longitude, AlertType.type_name).join(
        House, House.house_id == Alert.house_id
    ).join(
        AlertType, AlertType.alert_type_id == Alert.alert_type_id
    ).where(Alert.alert_id == alert_id)
    
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    alert, lat, lng, alert_type_name = row
    alert_obj = AlertResponse.model_validate(alert)
    alert_obj.latitude = lat
    alert_obj.longitude = lng
    alert_obj.alert_type_name = alert_type_name
    
    return alert_obj


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: int,
    request: AlertAcknowledge,
    db: AsyncSession = Depends(get_db),
):
    """
    Acknowledge an alert.
    Valid transitions: active -> acknowledged
    """
    query = select(Alert, House.latitude, House.longitude, AlertType.type_name).join(
        House, House.house_id == Alert.house_id
    ).join(
        AlertType, AlertType.alert_type_id == Alert.alert_type_id
    ).where(Alert.alert_id == alert_id)
    
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    alert, lat, lng, alert_type_name = row
    
    # Validate state transition
    if alert.status != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot acknowledge alert in status '{alert.status}'. Only 'active' alerts can be acknowledged."
        )
    
    # Update alert
    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.utcnow()
    if request.notes:
        alert.notes = request.notes
    
    await db.commit()
    
    logger.info(f"Alert {alert_id} acknowledged")
    
    alert_obj = AlertResponse.model_validate(alert)
    alert_obj.latitude = lat
    alert_obj.longitude = lng
    alert_obj.alert_type_name = alert_type_name
    
    return alert_obj


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: int,
    request: AlertResolve,
    db: AsyncSession = Depends(get_db),
):
    """
    Resolve an alert.
    Valid transitions: active -> resolved, acknowledged -> resolved
    """
    query = select(Alert, House.latitude, House.longitude, AlertType.type_name).join(
        House, House.house_id == Alert.house_id
    ).join(
        AlertType, AlertType.alert_type_id == Alert.alert_type_id
    ).where(Alert.alert_id == alert_id)
    
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    alert, lat, lng, alert_type_name = row
    
    # Validate state transition
    if alert.status not in ["active", "acknowledged"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resolve alert in status '{alert.status}'. Only 'active' or 'acknowledged' alerts can be resolved."
        )
    
    # Update alert
    alert.status = "resolved"
    alert.resolved_at = datetime.utcnow()
    if request.notes:
        alert.notes = request.notes
    
    await db.commit()
    
    logger.info(f"Alert {alert_id} resolved")
    
    alert_obj = AlertResponse.model_validate(alert)
    alert_obj.latitude = lat
    alert_obj.longitude = lng
    alert_obj.alert_type_name = alert_type_name
    
    return alert_obj


@router.post("/{alert_id}/dismiss", response_model=AlertResponse)
async def dismiss_alert(
    alert_id: int,
    request: AlertDismiss,
    db: AsyncSession = Depends(get_db),
):
    """
    Dismiss an alert (mark as false_positive).
    Valid transitions: active -> false_positive, acknowledged -> false_positive
    """
    query = select(Alert, House.latitude, House.longitude, AlertType.type_name).join(
        House, House.house_id == Alert.house_id
    ).join(
        AlertType, AlertType.alert_type_id == Alert.alert_type_id
    ).where(Alert.alert_id == alert_id)
    
    result = await db.execute(query)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    alert, lat, lng, alert_type_name = row
    
    # Validate state transition
    if alert.status not in ["active", "acknowledged"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot dismiss alert in status '{alert.status}'. Only 'active' or 'acknowledged' alerts can be dismissed."
        )
    
    # Update alert
    alert.status = "false_positive"
    if request.notes:
        alert.notes = request.notes
    
    await db.commit()
    
    logger.info(f"Alert {alert_id} dismissed")
    
    alert_obj = AlertResponse.model_validate(alert)
    alert_obj.latitude = lat
    alert_obj.longitude = lng
    alert_obj.alert_type_name = alert_type_name
    
    return alert_obj
