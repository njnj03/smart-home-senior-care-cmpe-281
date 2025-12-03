"""Public IoT endpoints (no authentication)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.house import House
from app.models.device import Device
from app.schemas.house import HouseResponse, HouseListResponse
from app.schemas.device import DeviceResponse, DeviceListResponse

router = APIRouter(prefix="/api/v1/iot", tags=["iot-public"])


@router.get("/houses", response_model=HouseListResponse)
async def list_houses_public(
    db: AsyncSession = Depends(get_db)
):
    """Return all houses without authentication (IoT simulator use only)."""
    query = select(House)
    result = await db.execute(query)
    houses = result.scalars().all()
    return HouseListResponse(
        houses=[HouseResponse.model_validate(h) for h in houses]
    )


@router.get("/devices", response_model=DeviceListResponse)
async def list_devices_public(
    house_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Return devices for a given house (public)."""
    query = select(Device)
    if house_id:
        query = query.where(Device.house_id == house_id)

    result = await db.execute(query)
    devices = result.scalars().all()
    return DeviceListResponse(
        devices=[DeviceResponse.model_validate(d) for d in devices]
    )
