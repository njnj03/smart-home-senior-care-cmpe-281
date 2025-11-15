"""Alert rule model for policy/rules configuration."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class AlertRule(Base):
    """Alert rules table - policy/rules for alert triggering."""
    
    __tablename__ = "alert_rules"
    
    rule_id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.tenant_id"), nullable=False, index=True)
    alert_type_id = Column(Integer, ForeignKey("alert_types.alert_type_id"), nullable=False)
    rule_name = Column(String(255), nullable=False)
    confidence_threshold = Column(Numeric(3, 2), nullable=True)  # DECIMAL(3,2) BETWEEN 0 AND 1
    cooldown_seconds = Column(Integer, default=30, nullable=False)
    deduplication_window_seconds = Column(Integer, default=10, nullable=False)
    severity_level = Column(String(50), nullable=True)  # critical, high, medium, low
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

