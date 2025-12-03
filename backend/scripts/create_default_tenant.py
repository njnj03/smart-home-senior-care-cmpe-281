#!/usr/bin/env python3
"""
Script to create a default tenant in the database.
Run this after database migrations to ensure tenant_id=1 exists.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import AsyncSessionLocal
from app.models.tenant import Tenant
from sqlalchemy import select


async def create_default_tenant():
    """Create default tenant if it doesn't exist."""
    async with AsyncSessionLocal() as session:
        # Check if tenant with ID 1 exists
        query = select(Tenant).where(Tenant.tenant_id == 1)
        result = await session.execute(query)
        existing_tenant = result.scalar_one_or_none()
        
        if existing_tenant:
            print(f"✓ Default tenant already exists:")
            print(f"  ID: {existing_tenant.tenant_id}")
            print(f"  Name: {existing_tenant.tenant_name}")
            print(f"  Active: {existing_tenant.is_active}")
            return True
        
        # Check if any tenant with name "Default Tenant" exists
        name_query = select(Tenant).where(Tenant.tenant_name == "Default Tenant")
        name_result = await session.execute(name_query)
        existing_by_name = name_result.scalar_one_or_none()
        
        if existing_by_name:
            print(f"⚠ Tenant named 'Default Tenant' exists but has ID {existing_by_name.tenant_id}")
            print("  The registration endpoint will use this tenant automatically")
            return True
        
        # Try to create default tenant with ID 1
        try:
            default_tenant = Tenant(
                tenant_id=1,  # Explicitly set ID to 1
                tenant_name="Default Tenant",
                description="Default tenant for new user registrations",
                is_active=True
            )
            session.add(default_tenant)
            await session.commit()
            await session.refresh(default_tenant)
        except Exception as e:
            # If ID 1 is taken or sequence issue, create without specifying ID
            print(f"⚠ Could not create tenant with ID 1: {e}")
            print("  Creating tenant without specifying ID...")
            await session.rollback()
            
            default_tenant = Tenant(
                tenant_name="Default Tenant",
                description="Default tenant for new user registrations",
                is_active=True
            )
            session.add(default_tenant)
            await session.commit()
            await session.refresh(default_tenant)
        
        print("✓ Successfully created default tenant:")
        print(f"  ID: {default_tenant.tenant_id}")
        print(f"  Name: {default_tenant.tenant_name}")
        print(f"  Description: {default_tenant.description}")
        print(f"  Active: {default_tenant.is_active}")
        
        return True


async def main():
    """Main function."""
    try:
        success = await create_default_tenant()
        if success:
            print("\n✅ Default tenant setup complete!")
            sys.exit(0)
        else:
            print("\n⚠ Default tenant setup incomplete. Check output above.")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error creating default tenant: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

