"""Storage service for file management."""
import logging
from pathlib import Path
from typing import Optional
from app.config import settings
import uuid
import shutil

logger = logging.getLogger(__name__)


class StorageService:
    """Service for managing file storage."""
    
    def __init__(self):
        """Initialize storage service."""
        self.storage_path = Path(settings.storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Storage initialized at {self.storage_path}")
    
    def save_audio_file(self, file_content: bytes, house_id: str, device_id: str) -> str:
        """
        Save an audio file to storage.
        
        Args:
            file_content: Binary content of the audio file
            house_id: ID of the house
            device_id: ID of the device
            
        Returns:
            Path to the saved file (relative to storage root)
        """
        # Create subdirectory structure: house_id/device_id/
        house_dir = self.storage_path / house_id / device_id
        house_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}.wav"  # Assuming WAV format, adjust as needed
        file_path = house_dir / filename
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Return relative path for database storage
        relative_path = str(file_path.relative_to(self.storage_path))
        logger.info(f"Saved audio file: {relative_path}")
        
        return str(file_path)  # Return absolute path for inference service
    
    def get_file_path(self, relative_path: str) -> Path:
        """
        Get absolute path for a stored file.
        
        Args:
            relative_path: Relative path stored in database
            
        Returns:
            Absolute Path object
        """
        return self.storage_path / relative_path
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if a file exists.
        
        Args:
            file_path: Path to check
            
        Returns:
            True if file exists, False otherwise
        """
        return Path(file_path).exists()


# Global instance
storage_service = StorageService()

