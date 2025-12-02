"""Authentication schemas."""
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[int] = None


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "house_owner"  # Default role: admin, house_owner, iot_team


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str
    tenant_id: int


class UserRegister(UserBase):
    """Schema for user registration."""
    password: str
    tenant_id: int = 1  # Default to tenant 1 for MVP


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # For password change


class UserResponse(UserBase):
    """Schema for user response."""
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    tenant_id: int
    tenant_name: Optional[str] = None  # Tenant name for display
    is_active: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserListResponse(BaseModel):
    """Schema for user list response."""
    users: List[UserResponse]

