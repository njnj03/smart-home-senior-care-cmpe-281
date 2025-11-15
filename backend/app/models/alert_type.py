"""Alert type model for alert classifications."""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class AlertType(Base):
    """Alert types table - reference table for alert classifications."""
    
    __tablename__ = "alert_types"
    
    alert_type_id = Column(Integer, primary_key=True, index=True)
    type_name = Column(String(100), nullable=False, unique=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

