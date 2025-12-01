"""Tenants router for tenant management (Admin only)."""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import (
    TenantResponse,
    TenantCreate,
    TenantUpdate,
    TenantListResponse
)
from app.dependencies.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tenants", tags=["tenants"])


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new tenant (Admin only).
    """
    # Check if tenant name already exists
    existing_query = select(Tenant).where(Tenant.tenant_name == tenant_data.tenant_name)
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tenant with name '{tenant_data.tenant_name}' already exists"
        )
    
    # Create new tenant
    new_tenant = Tenant(
        tenant_name=tenant_data.tenant_name,
        description=tenant_data.description,
        is_active=True
    )
    
    db.add(new_tenant)
    await db.commit()
    await db.refresh(new_tenant)
    
    logger.info(f"Admin {current_user.email} created tenant: {new_tenant.tenant_name} (ID: {new_tenant.tenant_id})")
    
    return TenantResponse.model_validate(new_tenant)


@router.get("", response_model=TenantListResponse)
async def list_tenants(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    List all tenants (Admin only).
    """
    query = select(Tenant).order_by(Tenant.created_at.desc())
    result = await db.execute(query)
    tenants = result.scalars().all()
    
    return TenantListResponse(
        tenants=[TenantResponse.model_validate(tenant) for tenant in tenants]
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get tenant details by ID (Admin only).
    """
    query = select(Tenant).where(Tenant.tenant_id == tenant_id)
    result = await db.execute(query)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {tenant_id} not found"
        )
    
    return TenantResponse.model_validate(tenant)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update tenant details (Admin only).
    """
    query = select(Tenant).where(Tenant.tenant_id == tenant_id)
    result = await db.execute(query)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {tenant_id} not found"
        )
    
    # Check if new name conflicts with existing tenant
    if tenant_data.tenant_name and tenant_data.tenant_name != tenant.tenant_name:
        existing_query = select(Tenant).where(
            Tenant.tenant_name == tenant_data.tenant_name,
            Tenant.tenant_id != tenant_id
        )
        existing_result = await db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tenant with name '{tenant_data.tenant_name}' already exists"
            )
    
    # Update fields
    if tenant_data.tenant_name is not None:
        tenant.tenant_name = tenant_data.tenant_name
    if tenant_data.description is not None:
        tenant.description = tenant_data.description
    if tenant_data.is_active is not None:
        tenant.is_active = tenant_data.is_active
    
    await db.commit()
    await db.refresh(tenant)
    
    logger.info(f"Admin {current_user.email} updated tenant: {tenant.tenant_name} (ID: {tenant_id})")
    
    return TenantResponse.model_validate(tenant)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a tenant (Admin only).
    Note: This will fail if tenant has associated users or houses.
    """
    query = select(Tenant).where(Tenant.tenant_id == tenant_id)
    result = await db.execute(query)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {tenant_id} not found"
        )
    
    # Check for associated users
    from app.models.user import User
    users_query = select(User).where(User.tenant_id == tenant_id)
    users_result = await db.execute(users_query)
    users = users_result.scalars().all()
    
    if users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete tenant with {len(users)} associated users"
        )
    
    # Check for associated houses
    from app.models.house import House
    houses_query = select(House).where(House.tenant_id == tenant_id)
    houses_result = await db.execute(houses_query)
    houses = houses_result.scalars().all()
    
    if houses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete tenant with {len(houses)} associated houses"
        )
    
    await db.delete(tenant)
    await db.commit()
    
    logger.info(f"Admin {current_user.email} deleted tenant: {tenant.tenant_name} (ID: {tenant_id})")

