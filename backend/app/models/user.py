"""User model for authentication and authorization."""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User table for authentication and authorization."""
    
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.tenant_id"), nullable=False, index=True)
    
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)  # Hashed password
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(String, nullable=False, default="house_owner", index=True)  # admin, house_owner, iot_team
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    
    # Index for common queries
    __table_args__ = (
        Index('ix_users_email_tenant', 'email', 'tenant_id'),
    )