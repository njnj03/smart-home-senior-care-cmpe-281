"""Inference router for testing ML predictions."""
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.inference import inference_service
from app.schemas.inference import InferenceResponse
from app.services.storage import storage_service
import tempfile
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/predict", tags=["inference"])


@router.post("", response_model=InferenceResponse)
async def predict(
    audio_file: UploadFile = File(...),
):
    """
    Test endpoint for running inference on an audio file.
    This is useful for local testing and development.
    """
    try:
        # Read file content
        audio_content = await audio_file.read()
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            tmp_file.write(audio_content)
            tmp_path = tmp_file.name
        
        try:
            # Run inference
            result = await inference_service.predict(tmp_path)
            return result
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running inference: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

