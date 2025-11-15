"""ML Model model for model management."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Numeric, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class MLModel(Base):
    """ML Models table - stores model metadata and configuration."""
    
    __tablename__ = "ml_models"
    
    model_id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(255), nullable=False, unique=True, index=True)
    version = Column(String(50), nullable=True)
    file_path = Column(String(500), nullable=False)  # Relative path from backend/
    description = Column(Text, nullable=True)
    model_type = Column(String(100), nullable=True)  # e.g., 'yamnet', 'custom'
    accuracy = Column(Numeric(5, 4), nullable=True)  # DECIMAL(5,4)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    # Foreign key to users table (optional - can be None if users table doesn't exist)
    created_by_user_id = Column(Integer, nullable=True)  # Removed FK constraint for MVP compatibility

