"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import ingestion, alerts, devices, houses, health, metrics, inference, models
from app.services.inference import inference_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Smart Home Senior Care API",
    description="Backend API for Smart Home Senior Care monitoring platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingestion.router)
app.include_router(alerts.router)
app.include_router(devices.router)
app.include_router(houses.router)
app.include_router(health.router)
app.include_router(metrics.router)
app.include_router(inference.router)
app.include_router(models.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Smart Home Senior Care API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("Starting Smart Home Senior Care API")
    logger.info(f"CORS origins: {settings.cors_origins}")
    logger.info(f"Storage path: {settings.storage_path}")
    
    # Test database connection
    try:
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            # Test connection with a simple query
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
    
    # Load active model from database
    try:
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            await inference_service.load_active_model_from_db(session)
    except Exception as e:
        logger.error(f"Failed to load active model on startup: {e}", exc_info=True)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down Smart Home Senior Care API")

