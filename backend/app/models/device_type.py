"""Device type model for device configurations."""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class DeviceType(Base):
    """Device types table - reference table for device configurations."""
    
    __tablename__ = "device_types"
    
    device_type_id = Column(Integer, primary_key=True, index=True)
    type_name = Column(String(100), nullable=False, unique=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

