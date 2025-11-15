"""Event model for ingested IoT signals."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Event(Base):
    """Event table - stores ingested IoT signals."""
    
    __tablename__ = "events"
    
    event_id = Column(Integer, primary_key=True, index=True)
    house_id = Column(Integer, ForeignKey("houses.house_id"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.device_id"), nullable=False, index=True)
    event_type = Column(String(100), nullable=True)
    raw_data = Column(JSON, nullable=True)  # JSONB in PostgreSQL
    media_url = Column(String(500), nullable=True)  # Path to stored audio file
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_processed = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    house = relationship("House", back_populates="events")
    device = relationship("Device", back_populates="events")
    alerts = relationship("Alert", back_populates="event")
