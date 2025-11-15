"""Health check router."""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, check_db_health
from app.schemas.health import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/health", tags=["health"])


@router.get("", response_model=HealthResponse)
async def health_check(
    db: AsyncSession = Depends(get_db),
):
    """
    Health check endpoint.
    Returns service status, version, and database connectivity.
    """
    db_healthy = await check_db_health()
    
    return HealthResponse(
        status="healthy" if db_healthy else "degraded",
        version="1.0.0",
        database=db_healthy,
    )

