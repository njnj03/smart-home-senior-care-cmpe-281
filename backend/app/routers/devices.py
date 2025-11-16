"""Devices router for device management."""
import logging
from typing import Optional
from datetime import datetime  # <- timezone 제거
from fastapi import APIRouter, Depends, HTTPException, Query, Body  # <- Body 추가
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.database import get_db                 # <- get_session 삭제
from app.models.device import Device
from app.models.house import House
from app.models.device_type import DeviceType
from app.models.event import Event
from app.models.alert import Alert
from app.schemas.device import (
    DeviceResponse,
    DeviceListResponse,
    DeviceCreate,
    DeviceUpdate,
    DeviceHeartbeatRequest,
)

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


@router.post("", response_model=DeviceResponse, status_code=201)
async def create_device(
    device_data: DeviceCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new device.
    """
    # Validate house exists
    house_query = select(House).where(House.house_id == device_data.house_id)
    house_result = await db.execute(house_query)
    house = house_result.scalar_one_or_none()
    if not house:
        raise HTTPException(status_code=404, detail=f"House {device_data.house_id} not found")
    
    # Validate device type exists
    device_type_query = select(DeviceType).where(DeviceType.device_type_id == device_data.device_type_id)
    device_type_result = await db.execute(device_type_query)
    device_type = device_type_result.scalar_one_or_none()
    if not device_type:
        raise HTTPException(status_code=404, detail=f"Device type {device_data.device_type_id} not found")
    
    # Check if MAC address is unique (if provided)
    if device_data.mac_address:
        mac_query = select(Device).where(Device.mac_address == device_data.mac_address)
        mac_result = await db.execute(mac_query)
        existing_device = mac_result.scalar_one_or_none()
        if existing_device:
            raise HTTPException(
                status_code=400,
                detail=f"Device with MAC address {device_data.mac_address} already exists"
            )
    
    # Create device
    device = Device(
        house_id=device_data.house_id,
        device_type_id=device_data.device_type_id,
        device_name=device_data.device_name,
        location=device_data.location,
        mac_address=device_data.mac_address,
        firmware_version=device_data.firmware_version,
        status=device_data.status,
        is_enabled=device_data.is_enabled,
    )
    
    db.add(device)
    await db.commit()
    await db.refresh(device)
    
    logger.info(f"Created device {device.device_id} for house {device_data.house_id}")
    
    return DeviceResponse.model_validate(device)


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: int,
    device_data: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update device details.
    """
    query = select(Device).where(Device.device_id == device_id)
    result = await db.execute(query)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    
    # Check if MAC address is unique (if being updated)
    if device_data.mac_address and device_data.mac_address != device.mac_address:
        mac_query = select(Device).where(
            Device.mac_address == device_data.mac_address,
            Device.device_id != device_id
        )
        mac_result = await db.execute(mac_query)
        existing_device = mac_result.scalar_one_or_none()
        if existing_device:
            raise HTTPException(
                status_code=400,
                detail=f"Device with MAC address {device_data.mac_address} already exists"
            )
    
    # Update fields
    if device_data.device_name is not None:
        device.device_name = device_data.device_name
    if device_data.location is not None:
        device.location = device_data.location
    if device_data.mac_address is not None:
        device.mac_address = device_data.mac_address
    if device_data.firmware_version is not None:
        device.firmware_version = device_data.firmware_version
    if device_data.status is not None:
        device.status = device_data.status
    if device_data.is_enabled is not None:
        device.is_enabled = device_data.is_enabled
    
    await db.commit()
    await db.refresh(device)
    
    logger.info(f"Updated device {device_id}")
    
    return DeviceResponse.model_validate(device)

@router.post("/{device_id}/heartbeat", response_model=DeviceResponse)
async def device_heartbeat(
    device_id: int,
    payload: DeviceHeartbeatRequest | None = Body(None),  # 바디 없으면 None
    db: AsyncSession = Depends(get_db),
):
    """
    Receive a heartbeat from a device.
    - Updates last_heartbeat to current UTC (naive datetime)
    - If `status` provided, set it; otherwise default to 'online'
    - Optionally updates firmware_version
    """
    # 1) device look up
    query = select(Device).where(Device.device_id == device_id)
    result = await db.execute(query)
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")

    # 2) heartbeat update 
    device.last_heartbeat = datetime.utcnow()

    # 3)
    if payload:
        if payload.status:
            device.status = payload.status
        if payload.firmware_version:
            device.firmware_version = payload.firmware_version

    # if not payload update to online
    if not payload or not payload.status:
        device.status = "online"

    await db.commit()
    await db.refresh(device)
    return DeviceResponse.model_validate(device)

@router.delete("/{device_id}", status_code=204)
async def delete_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a device.
    
    Note: Device will be soft-deleted (is_enabled=False) if it has associated events or alerts.
    Otherwise, it will be hard-deleted.
    """
    query = select(Device).where(Device.device_id == device_id)
    result = await db.execute(query)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    
    # Check for associated events
    events_query = select(func.count(Event.event_id)).where(Event.device_id == device_id)
    events_result = await db.execute(events_query)
    events_count = events_result.scalar() or 0
    
    # Check for associated alerts
    alerts_query = select(func.count(Alert.alert_id)).where(Alert.device_id == device_id)
    alerts_result = await db.execute(alerts_query)
    alerts_count = alerts_result.scalar() or 0
    
    # If device has events or alerts, soft delete
    if events_count > 0 or alerts_count > 0:
        device.is_enabled = False
        await db.commit()
        logger.info(f"Soft-deleted device {device_id} (has {events_count} events, {alerts_count} alerts)")
    else:
        # Hard delete if no associations
        await db.execute(delete(Device).where(Device.device_id == device_id))
        await db.commit()
        logger.info(f"Deleted device {device_id}")
    
    return None
