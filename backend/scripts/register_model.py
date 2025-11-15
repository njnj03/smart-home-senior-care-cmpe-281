"""
Script to register an existing model file in the database.

Usage:
    python scripts/register_model.py --name "YAMNet Human v1" --path "my_yamnet_human_model.keras" --activate
"""
import asyncio
import argparse
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import AsyncSessionLocal
from app.models.ml_model import MLModel
from sqlalchemy import select
from decimal import Decimal


async def register_model(
    name: str,
    file_path: str,
    version: str = None,
    description: str = None,
    model_type: str = None,
    accuracy: float = None,
    activate: bool = False,
):
    """Register a model in the database."""
    # Check if model file exists
    backend_root = Path(__file__).parent.parent
    model_file = backend_root / file_path
    
    if not model_file.exists():
        print(f"ERROR: Model file not found at {model_file}")
        print(f"Please ensure the file exists before registering.")
        return False
    
    async with AsyncSessionLocal() as session:
        # Check if model name already exists
        query = select(MLModel).where(MLModel.model_name == name)
        result = await session.execute(query)
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"ERROR: Model with name '{name}' already exists (ID: {existing.model_id})")
            return False
        
        # If activating, deactivate current active model
        if activate:
            active_query = select(MLModel).where(MLModel.is_active == True)
            active_result = await session.execute(active_query)
            active_models = active_result.scalars().all()
            for active_model in active_models:
                active_model.is_active = False
        
        # Create new model record
        model = MLModel(
            model_name=name,
            version=version,
            file_path=file_path,
            description=description,
            model_type=model_type,
            accuracy=Decimal(str(accuracy)) if accuracy is not None else None,
            is_active=activate,
        )
        
        session.add(model)
        await session.commit()
        await session.refresh(model)
        
        print(f"✓ Successfully registered model:")
        print(f"  ID: {model.model_id}")
        print(f"  Name: {model.model_name}")
        print(f"  Path: {model.file_path}")
        print(f"  Active: {model.is_active}")
        
        return True


async def main():
    parser = argparse.ArgumentParser(description="Register an ML model in the database")
    parser.add_argument("--name", required=True, help="Model name (unique)")
    parser.add_argument("--path", required=True, help="Relative path from backend/ (e.g., 'models/yamnet_human_v1.keras')")
    parser.add_argument("--version", help="Model version (e.g., 'v1.0')")
    parser.add_argument("--description", help="Model description")
    parser.add_argument("--type", help="Model type (e.g., 'yamnet', 'custom')")
    parser.add_argument("--accuracy", type=float, help="Model accuracy (0.0-1.0)")
    parser.add_argument("--activate", action="store_true", help="Activate this model (deactivates current active model)")
    
    args = parser.parse_args()
    
    success = await register_model(
        name=args.name,
        file_path=args.path,
        version=args.version,
        description=args.description,
        model_type=args.type,
        accuracy=args.accuracy,
        activate=args.activate,
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())

