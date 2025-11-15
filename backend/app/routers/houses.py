"""Houses router for house management."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.house import House
from app.schemas.house import HouseResponse, HouseListResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/houses", tags=["houses"])


@router.get("", response_model=HouseListResponse)
async def list_houses(
    db: AsyncSession = Depends(get_db),
):
    """
    List all houses.
    """
    query = select(House)
    result = await db.execute(query)
    houses = result.scalars().all()
    
    return HouseListResponse(
        houses=[HouseResponse.model_validate(house) for house in houses]
    )


@router.get("/{house_id}", response_model=HouseResponse)
async def get_house(
    house_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get house details by ID.
    """
    query = select(House).where(House.house_id == house_id)
    result = await db.execute(query)
    house = result.scalar_one_or_none()
    
    if not house:
        raise HTTPException(status_code=404, detail=f"House {house_id} not found")
    
    return HouseResponse.model_validate(house)
