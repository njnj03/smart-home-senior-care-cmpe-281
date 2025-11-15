"""Alert model for system alerts."""
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Alert(Base):
    """Alert table - stores system alerts."""
    
    __tablename__ = "alerts"
    
    alert_id = Column(Integer, primary_key=True, index=True)
    house_id = Column(Integer, ForeignKey("houses.house_id"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.device_id"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.event_id"), nullable=True, index=True)
    alert_type_id = Column(Integer, ForeignKey("alert_types.alert_type_id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("alert_rules.rule_id"), nullable=True)
    severity = Column(String(50), nullable=False)  # critical, high, medium, low
    status = Column(String(50), nullable=False, default="active", index=True)  # active, acknowledged, resolved, false_positive
    confidence_score = Column(Numeric(3, 2), nullable=True)  # DECIMAL(3,2)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    house = relationship("House", back_populates="alerts")
    device = relationship("Device", back_populates="alerts")
    event = relationship("Event", back_populates="alerts")
