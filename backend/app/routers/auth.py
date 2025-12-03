"""Authentication router."""
import logging
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import (
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
    UserCreate,
    UserUpdate,
    UserListResponse
)
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_user_by_email,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.dependencies.auth import get_current_active_user, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and return access token.
    """
    user = await authenticate_user(db, user_credentials.email, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.user_id),
            "email": user.email,
            "role": user.role,
            "tenant_id": user.tenant_id
        },
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user (public endpoint for MVP).
    Note: In production, this should be admin-only.
    """
    # Check if user already exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate tenant exists, or find/create default tenant
    tenant_query = select(Tenant).where(Tenant.tenant_id == user_data.tenant_id)
    tenant_result = await db.execute(tenant_query)
    tenant = tenant_result.scalar_one_or_none()
    
    if not tenant:
        # Try to find a default tenant (ID 1 or name "Default Tenant")
        default_query = select(Tenant).where(
            (Tenant.tenant_id == 1) | (Tenant.tenant_name == "Default Tenant")
        ).where(Tenant.is_active == True)
        default_result = await db.execute(default_query)
        tenant = default_result.scalar_one_or_none()
        
        if not tenant:
            # Create default tenant if none exists
            logger.warning(f"Tenant {user_data.tenant_id} not found, creating default tenant")
            tenant = Tenant(
                tenant_id=1,
                tenant_name="Default Tenant",
                description="Default tenant for new user registrations",
                is_active=True
            )
            db.add(tenant)
            await db.flush()  # Flush to get the tenant_id
            logger.info(f"Created default tenant: {tenant.tenant_id}")
    
    # Use the tenant's ID (in case we created one or found a different one)
    final_tenant_id = tenant.tenant_id
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        tenant_id=final_tenant_id,  # Use the resolved tenant ID
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    logger.info(f"Registered new user: {new_user.email} (ID: {new_user.user_id})")
    
    return UserResponse.model_validate(new_user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user's information.
    """
    return UserResponse.model_validate(current_user)


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user (Admin only).
    """
    # Check if user already exists
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate tenant exists
    tenant_query = select(Tenant).where(Tenant.tenant_id == user_data.tenant_id)
    tenant_result = await db.execute(tenant_query)
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {user_data.tenant_id} not found"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        tenant_id=user_data.tenant_id,
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    logger.info(f"Admin {current_user.email} created user: {new_user.email} (ID: {new_user.user_id})")
    
    return UserResponse.model_validate(new_user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing user (Admin only).
    """
    query = select(User).where(User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.password is not None:
        user.password_hash = get_password_hash(user_data.password)
    
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"Admin {current_user.email} updated user: {user.email} (ID: {user_id})")
    
    return UserResponse.model_validate(user)


@router.get("/users", response_model=UserListResponse)
async def list_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    List all users with tenant information (Admin only).
    
    Returns a list of all users in the system including:
    - User details (email, name, role, status)
    - Tenant ID and tenant name
    - Account status and login information
    
    **Access Control:** Admin role required
    """
    # Query users with tenant relationship loaded
    query = select(User).options(selectinload(User.tenant))
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Build response with tenant name
    user_responses = []
    for user in users:
        user_dict = UserResponse.model_validate(user).model_dump()
        # Add tenant name from relationship
        if user.tenant:
            user_dict['tenant_name'] = user.tenant.tenant_name
        user_responses.append(UserResponse(**user_dict))
    
    return UserListResponse(users=user_responses)

