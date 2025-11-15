"""Ingestion router for IoT event ingestion."""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.event import Event
from app.models.device import Device
from app.models.house import House
from app.schemas.event import EventResponse
from app.services.inference import inference_service
from app.services.policy import policy_engine
from app.services.storage import storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ingest", tags=["ingestion"])


@router.post("/event", response_model=EventResponse, status_code=201)
async def ingest_event(
    house_id: int = Form(...),
    device_id: int = Form(...),
    timestamp: str = Form(...),  # ISO format datetime string
    audio_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest an IoT event with audio file.
    
    This endpoint:
    1. Accepts audio file and metadata
    2. Saves the file locally
    3. Creates an event record
    4. Runs inference synchronously
    5. Evaluates policy and creates alert if needed
    """
    try:
        # Parse timestamp
        try:
            event_timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format. Use ISO format.")
        
        # Validate house and device exist
        house_result = await db.execute(select(House).where(House.house_id == house_id))
        house = house_result.scalar_one_or_none()
        if not house:
            raise HTTPException(status_code=404, detail=f"House {house_id} not found")
        
        device_result = await db.execute(select(Device).where(Device.device_id == device_id))
        device = device_result.scalar_one_or_none()
        if not device:
            raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
        
        if device.house_id != house_id:
            raise HTTPException(status_code=400, detail="Device does not belong to the specified house")
        
        # Read audio file
        audio_content = await audio_file.read()
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Save file
        file_path = storage_service.save_audio_file(audio_content, str(house_id), str(device_id))
        
        # Store inference metadata in raw_data JSON
        raw_data = {
            "file_path": file_path,
            "original_filename": audio_file.filename,
            "content_type": audio_file.content_type,
        }
        
        # Create event record
        event = Event(
            house_id=house_id,
            device_id=device_id,
            event_type="audio",
            raw_data=raw_data,
            media_url=file_path,
            is_processed=False,
        )
        
        db.add(event)
        await db.flush()  # Flush to get the event_id
        
        # Run inference
        try:
            inference_result = await inference_service.predict(file_path)
            
            # Update raw_data with inference results
            if event.raw_data:
                event.raw_data["inference"] = {
                    "label": inference_result.label,
                    "score": float(inference_result.score),
                }
            else:
                event.raw_data = {
                    "inference": {
                        "label": inference_result.label,
                        "score": float(inference_result.score),
                    }
                }
            
            # Evaluate policy and create alert if needed
            alert_id = await policy_engine.evaluate(
                db=db,
                event_id=event.event_id,
                house_id=house_id,
                device_id=device_id,
                inference_result=inference_result,
                event_timestamp=event_timestamp,
            )
            
            # Mark event as processed
            event.is_processed = True
            
        except Exception as e:
            logger.error(f"Inference/policy processing failed for event {event.event_id}: {e}")
            # Don't fail the entire request, but leave is_processed as False
        
        await db.commit()
        
        logger.info(f"Ingested event {event.event_id} for house {house_id}, device {device_id}")
        
        return EventResponse.model_validate(event)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ingesting event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
