"""Tenant model for multi-tenancy support."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Tenant(Base):
    """Tenant table - multi-tenancy support."""
    
    __tablename__ = "tenants"
    
    tenant_id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String(255), nullable=False, unique=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

