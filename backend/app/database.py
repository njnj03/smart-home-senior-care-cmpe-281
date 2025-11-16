"""Database connection and session management."""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Ensure database URL uses asyncpg
database_url = settings.database_url
if not database_url.startswith("postgresql+asyncpg://"):
    # If URL doesn't have +asyncpg, add it
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif not database_url.startswith("postgresql+asyncpg://"):
        logger.warning(f"Database URL should start with 'postgresql+asyncpg://', got: {database_url[:30]}...")
        # Try to fix it
        if "://" in database_url:
            parts = database_url.split("://", 1)
            database_url = f"postgresql+asyncpg://{parts[1]}"

# Create async engine
# Note: Disable prepared statements for pgbouncer compatibility (transaction mode)
# For Supabase with pgbouncer, we need to disable statement caching
# Reference: https://github.com/MagicStack/asyncpg/issues/475
engine = create_async_engine(
    database_url,
    echo=False,  # Set to True for SQL query logging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
    connect_args={
        "statement_cache_size": 0,  # Disable prepared statement cache for pgbouncer
        "prepared_statement_cache_size": 0,  # Disable prepared statement cache
        "server_settings": {
            "jit": "off"  # Disable JIT for pgbouncer compatibility
        }
    },
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Dependency for getting database session.
    Yields a database session and ensures it's closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health() -> bool:
    """
    Check database connectivity.
    Returns True if connection is healthy, False otherwise.
    """
    try:
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

