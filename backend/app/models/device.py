"""Device model for IoT devices."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Device(Base):
    """Device table - stores IoT device information."""
    
    __tablename__ = "devices"
    
    device_id = Column(Integer, primary_key=True, index=True)
    house_id = Column(Integer, ForeignKey("houses.house_id"), nullable=False, index=True)
    device_type_id = Column(Integer, ForeignKey("device_types.device_type_id"), nullable=False)
    device_name = Column(String(255), nullable=True)
    location = Column(String(100), nullable=True)
    mac_address = Column(String(17), unique=True, nullable=True)
    firmware_version = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="offline")  # online, offline, degraded, disabled
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    house = relationship("House", back_populates="devices")
    events = relationship("Event", back_populates="device")
    alerts = relationship("Alert", back_populates="device")
