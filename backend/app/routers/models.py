"""ML Models router for model management."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.ml_model import MLModel
from app.schemas.ml_model import (
    MLModelResponse,
    MLModelListResponse,
    MLModelCreate,
    MLModelUpdate,
    MLModelActivate,
)
from app.services.inference import inference_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/models", tags=["models"])


@router.get("", response_model=MLModelListResponse)
async def list_models(
    db: AsyncSession = Depends(get_db),
):
    """
    List all ML models with active model highlighted.
    """
    from pathlib import Path
    
    query = select(MLModel).order_by(MLModel.created_at.desc())
    result = await db.execute(query)
    models = result.scalars().all()
    
    # Find active model
    active_model = next((m for m in models if m.is_active), None)
    
    # Check file existence for each model
    backend_root = Path(__file__).parent.parent.parent
    model_responses = []
    for model in models:
        model_file_path = backend_root / model.file_path
        file_exists = model_file_path.exists()
        model_dict = MLModelResponse.model_validate(model).model_dump()
        model_dict['file_exists'] = file_exists
        model_responses.append(MLModelResponse(**model_dict))
    
    active_model_response = None
    if active_model:
        active_model_file_path = backend_root / active_model.file_path
        file_exists = active_model_file_path.exists()
        active_dict = MLModelResponse.model_validate(active_model).model_dump()
        active_dict['file_exists'] = file_exists
        active_model_response = MLModelResponse(**active_dict)
    
    return MLModelListResponse(
        models=model_responses,
        active_model=active_model_response,
    )


@router.get("/active", response_model=MLModelResponse)
async def get_active_model(
    db: AsyncSession = Depends(get_db),
):
    """
    Get the currently active model.
    """
    from pathlib import Path
    
    query = select(MLModel).where(MLModel.is_active == True)
    result = await db.execute(query)
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="No active model found")
    
    # Check file existence
    backend_root = Path(__file__).parent.parent.parent
    model_file_path = backend_root / model.file_path
    file_exists = model_file_path.exists()
    
    model_dict = MLModelResponse.model_validate(model).model_dump()
    model_dict['file_exists'] = file_exists
    return MLModelResponse(**model_dict)


@router.get("/{model_id}", response_model=MLModelResponse)
async def get_model(
    model_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get model details by ID.
    """
    from pathlib import Path
    
    query = select(MLModel).where(MLModel.model_id == model_id)
    result = await db.execute(query)
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    # Check file existence
    backend_root = Path(__file__).parent.parent.parent
    model_file_path = backend_root / model.file_path
    file_exists = model_file_path.exists()
    
    model_dict = MLModelResponse.model_validate(model).model_dump()
    model_dict['file_exists'] = file_exists
    return MLModelResponse(**model_dict)


@router.post("", response_model=MLModelResponse, status_code=201)
async def create_model(
    model_data: MLModelCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new ML model in the database.
    Note: The model file should already exist in the filesystem.
    """
    # Check if model name already exists
    existing_query = select(MLModel).where(MLModel.model_name == model_data.model_name)
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Model with name '{model_data.model_name}' already exists"
        )
    
    # Create new model record
    model = MLModel(
        model_name=model_data.model_name,
        version=model_data.version,
        file_path=model_data.file_path,
        description=model_data.description,
        model_type=model_data.model_type,
        accuracy=model_data.accuracy,
        is_active=False,  # New models are not active by default
    )
    
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    logger.info(f"Created model record: {model.model_name} (ID: {model.model_id})")
    
    return MLModelResponse.model_validate(model)


@router.put("/{model_id}", response_model=MLModelResponse)
async def update_model(
    model_id: int,
    model_data: MLModelUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update model metadata.
    """
    query = select(MLModel).where(MLModel.model_id == model_id)
    result = await db.execute(query)
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    # Update fields if provided
    if model_data.model_name is not None:
        # Check if new name conflicts with existing model
        if model_data.model_name != model.model_name:
            existing_query = select(MLModel).where(
                and_(
                    MLModel.model_name == model_data.model_name,
                    MLModel.model_id != model_id
                )
            )
            existing_result = await db.execute(existing_query)
            if existing_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"Model with name '{model_data.model_name}' already exists"
                )
        model.model_name = model_data.model_name
    
    if model_data.version is not None:
        model.version = model_data.version
    if model_data.file_path is not None:
        model.file_path = model_data.file_path
    if model_data.description is not None:
        model.description = model_data.description
    if model_data.model_type is not None:
        model.model_type = model_data.model_type
    if model_data.accuracy is not None:
        model.accuracy = model_data.accuracy
    
    await db.commit()
    await db.refresh(model)
    
    logger.info(f"Updated model: {model.model_name} (ID: {model_id})")
    
    return MLModelResponse.model_validate(model)


@router.post("/{model_id}/activate", response_model=MLModelResponse)
async def activate_model(
    model_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Activate a model (deactivates current active model and activates this one).
    This will trigger a hot-reload of the model in the inference service.
    """
    # Get the model to activate
    query = select(MLModel).where(MLModel.model_id == model_id)
    result = await db.execute(query)
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    # Check if model file exists BEFORE making any database changes
    from pathlib import Path
    backend_root = Path(__file__).parent.parent.parent
    model_file_path = backend_root / model.file_path
    
    if not model_file_path.exists():
        logger.error(f"Model file not found: {model_file_path}")
        raise HTTPException(
            status_code=400,
            detail=f"Model file not found at path: {model.file_path}"
        )
    
    # Store previous active model for potential rollback
    previous_active_query = select(MLModel).where(MLModel.is_active == True)
    previous_active_result = await db.execute(previous_active_query)
    previous_active_model = previous_active_result.scalar_one_or_none()
    
    # Deactivate all models FIRST (before activating new one)
    # This prevents unique constraint violation
    deactivate_query = select(MLModel).where(MLModel.is_active == True)
    deactivate_result = await db.execute(deactivate_query)
    active_models = deactivate_result.scalars().all()
    
    for active_model in active_models:
        active_model.is_active = False
    
    # Flush to ensure deactivation is applied before activating new model
    await db.flush()
    
    # Now activate the selected model
    model.is_active = True
    
    # Try to load the model in inference service before committing
    try:
        inference_service.load_model(str(model_file_path))
        inference_service.current_model_id = model.model_id
        logger.info(f"Activated and reloaded model: {model.model_name} (ID: {model_id})")
    except Exception as e:
        logger.error(f"Failed to reload model: {e}", exc_info=True)
        # Rollback database changes
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Failed to load model: {str(e)}"
        )
    
    # Only commit if model loading was successful
    await db.commit()
    await db.refresh(model)
    
    return MLModelResponse.model_validate(model)


@router.delete("/{model_id}", status_code=204)
async def delete_model(
    model_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a model record from the database.
    Note: This does not delete the model file from the filesystem.
    """
    query = select(MLModel).where(MLModel.model_id == model_id)
    result = await db.execute(query)
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    # Check if this is the only model
    count_query = select(MLModel)
    count_result = await db.execute(count_query)
    total_models = len(count_result.scalars().all())
    
    if total_models <= 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the only model. Please add another model first."
        )
    
    if model.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete the active model. Please activate another model first."
        )
    
    await db.delete(model)
    await db.commit()
    
    logger.info(f"Deleted model record: {model.model_name} (ID: {model_id})")
    
    return None

