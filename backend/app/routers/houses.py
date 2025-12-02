"""Houses router for house management."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.house import House
from app.models.user import User
from app.models.tenant import Tenant
from app.dependencies.auth import require_any_user, require_admin
from app.schemas.house import HouseResponse, HouseListResponse, HouseCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/houses", tags=["houses"])


@router.get("", response_model=HouseListResponse)
async def list_houses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_user),
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


@router.post("", response_model=HouseResponse, status_code=201)
async def create_house(
    house_data: HouseCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new house (Admin only).
    """
    # Validate tenant exists
    tenant_query = select(Tenant).where(Tenant.tenant_id == house_data.tenant_id)
    tenant_result = await db.execute(tenant_query)
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant {house_data.tenant_id} not found"
        )
    
    # Create new house
    new_house = House(
        tenant_id=house_data.tenant_id,
        house_name=house_data.house_name,
        address=house_data.address,
        city=house_data.city,
        state=house_data.state,
        zip_code=house_data.zip_code,
        latitude=house_data.latitude,
        longitude=house_data.longitude,
        is_active=house_data.is_active
    )
    
    db.add(new_house)
    await db.commit()
    await db.refresh(new_house)
    
    logger.info(f"Admin {current_user.email} created house: {new_house.house_name} (ID: {new_house.house_id})")
    
    return HouseResponse.model_validate(new_house)


@router.get("/{house_id}", response_model=HouseResponse)
async def get_house(
    house_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_user),
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
