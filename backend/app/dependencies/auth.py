"""Authentication dependencies."""
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth import decode_access_token, get_user_by_id
from app.models.user import User

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    logger.debug(f"Received token: {token[:50] if token else 'None'}...")
    payload = decode_access_token(token)
    
    if payload is None:
        logger.warning(f"Failed to decode token: {token[:50] if token else 'None'}...")
        raise credentials_exception
    
    # JWT 'sub' is stored as string, but user_id is int - convert it
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        logger.error(f"Invalid user_id in token: {user_id_str}")
        raise credentials_exception
    
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current active user.
    
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def require_role(*allowed_roles: str):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_role("admin"))):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def require_permission(permission: str):
    """
    Dependency factory for permission-based access control.
    
    Usage:
        @router.post("/alerts")
        async def create_alert(user: User = Depends(require_permission("alerts:create"))):
            ...
    """
    from app.services.auth import has_permission
    
    async def permission_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission: {permission}"
            )
        return current_user
    
    return permission_checker


# Common role dependencies
require_admin = require_role("admin")
require_house_owner = require_role("admin", "house_owner")  # Admin or house owner
require_iot_team = require_role("admin", "iot_team")  # Admin or IoT team
require_any_user = get_current_active_user  # Any authenticated user

