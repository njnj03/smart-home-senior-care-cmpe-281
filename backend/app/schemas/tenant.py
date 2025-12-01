"""Tenant schemas."""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class TenantBase(BaseModel):
    """Base tenant schema."""
    tenant_name: str
    description: Optional[str] = None


class TenantCreate(TenantBase):
    """Schema for creating a tenant."""
    pass


class TenantUpdate(BaseModel):
    """Schema for updating a tenant."""
    tenant_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TenantResponse(TenantBase):
    """Schema for tenant response."""
    model_config = ConfigDict(from_attributes=True)
    tenant_id: int
    is_active: bool
    created_at: datetime


class TenantListResponse(BaseModel):
    """Schema for tenant list response."""
    tenants: List[TenantResponse]

