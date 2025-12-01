"""Authentication and authorization service."""
import logging
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.config import settings

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = settings.jwt_secret_key
ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.jwt_access_token_expire_minutes


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly (bypasses passlib backend detection issues)."""
    # Bcrypt has a 72-byte limit - ensure password is within limit
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Truncate to 72 bytes (bcrypt's limit)
        password_bytes = password_bytes[:72]
        logger.warning("Password truncated to 72 bytes for bcrypt compatibility")
    
    # Use bcrypt directly to avoid passlib backend detection issues on Windows
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash using bcrypt directly."""
    try:
        # Bcrypt has a 72-byte limit
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        # Verify using bcrypt directly
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Error verifying password: {e}", exc_info=True)
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password."""
    try:
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        # Update last_login
        user.last_login = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        
        return user
    except Exception as e:
        logger.error(f"Error authenticating user: {e}", exc_info=True)
        return None


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """Get a user by ID."""
    try:
        query = select(User).where(User.user_id == user_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}", exc_info=True)
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email."""
    try:
        query = select(User).where(User.email == email)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error getting user by email: {e}", exc_info=True)
        return None


# Role definitions
ROLES = {
    "admin": {
        "name": "Cloud Staff",
        "permissions": ["*"]  # All permissions
    },
    "house_owner": {
        "name": "House Owner",
        "permissions": [
            "alerts:read",
            "alerts:acknowledge",
            "alerts:resolve",
            "alerts:dismiss",
            "devices:read",
            "houses:read",
            "events:read",
            "metrics:read"
        ]
    },
    "iot_team": {
        "name": "IoT Team",
        "permissions": [
            "alerts:read",
            "devices:read",
            "devices:create",
            "devices:update",
            "devices:delete",
            "houses:read",
            "events:read",
            "metrics:read"
        ]
    }
}


def has_permission(user_role: str, required_permission: str) -> bool:
    """Check if a user role has a specific permission."""
    if user_role not in ROLES:
        return False
    
    role_perms = ROLES[user_role]["permissions"]
    
    # Admin has all permissions
    if "*" in role_perms:
        return True
    
    # Check exact permission match
    if required_permission in role_perms:
        return True
    
    # Check wildcard permissions (e.g., "alerts:*" matches "alerts:read")
    permission_parts = required_permission.split(":")
    if len(permission_parts) == 2:
        resource, action = permission_parts
        wildcard_perm = f"{resource}:*"
        if wildcard_perm in role_perms:
            return True
    
    return False

