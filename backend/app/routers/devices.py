"""Devices router for device management."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceResponse, DeviceListResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/devices", tags=["devices"])


@router.get("", response_model=DeviceListResponse)
async def list_devices(
    house_id: Optional[int] = Query(None, description="Filter by house ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    List devices, optionally filtered by house ID.
    """
    query = select(Device)
    
    if house_id:
        query = query.where(Device.house_id == house_id)
    
    result = await db.execute(query)
    devices = result.scalars().all()
    
    return DeviceListResponse(
        devices=[DeviceResponse.model_validate(device) for device in devices]
    )


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get device details by ID.
    """
    query = select(Device).where(Device.device_id == device_id)
    result = await db.execute(query)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    
    return DeviceResponse.model_validate(device)
