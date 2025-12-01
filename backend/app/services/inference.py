"""Inference service for ML model predictions."""
import logging
from pathlib import Path
from typing import Optional, Dict, List
import numpy as np
import librosa
import soundfile as sf
import tensorflow as tf
import csv
import io
from app.schemas.inference import InferenceResponse
from app.config import settings

logger = logging.getLogger(__name__)

# YAMNet expects 16kHz mono audio
SAMPLE_RATE = 16000


class InferenceService:
    """
    Inference service for audio analysis using YAMNet from TensorFlow Hub.
    
    YAMNet is a pre-trained audio event classifier that predicts 521 audio events
    from the AudioSet ontology.
    """
    
    def __init__(self):
        """Initialize the inference service."""
        self.model = None
        self.class_names = []
        self.model_loaded = False
        self.current_model_path = None
    
    def _load_yamnet_model(self):
        """Load YAMNet model from local models/yamnet-tensorflow2-yamnet-v1/ directory."""
        try:
            if self.model is not None:
                logger.info("YAMNet model already loaded")
                return True
            
            # Get backend root directory
            backend_root = Path(__file__).parent.parent.parent
            yamnet_path = backend_root / "models" / "yamnet-tensorflow2-yamnet-v1"
            
            if not yamnet_path.exists():
                logger.error(f"YAMNet model directory not found: {yamnet_path}")
                raise FileNotFoundError(f"YAMNet model directory not found: {yamnet_path}")
            
            saved_model_pb = yamnet_path / "saved_model.pb"
            if not saved_model_pb.exists():
                logger.error(f"saved_model.pb not found in: {yamnet_path}")
                raise FileNotFoundError(f"saved_model.pb not found in: {yamnet_path}")
            
            logger.info(f"Loading YAMNet model from local directory: {yamnet_path}")
            
            # Load SavedModel format
            self.model = tf.saved_model.load(str(yamnet_path))
            
            # Load class names from the model
            # YAMNet SavedModel should have class_map_path attribute
            if hasattr(self.model, 'class_map_path'):
                try:
                    class_map_path = self.model.class_map_path().numpy()
                    class_map_csv_text = tf.io.read_file(class_map_path).numpy().decode('utf-8')
                    self.class_names = self._class_names_from_csv(class_map_csv_text)
                    logger.info("Loaded class names from model's class_map_path")
                except Exception as e:
                    logger.warning(f"Failed to load class names from class_map_path: {e}")
                    # Try loading from assets folder
                    self._try_load_class_names_from_assets(yamnet_path)
            else:
                # Try loading from assets folder
                logger.info("Model doesn't have class_map_path. Trying to load from assets folder.")
                self._try_load_class_names_from_assets(yamnet_path)
            
            self.model_loaded = True
            self.current_model_path = str(yamnet_path)
            logger.info(f"YAMNet model loaded successfully from {yamnet_path}. {len(self.class_names)} classes available.")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load YAMNet model: {e}", exc_info=True)
            self.model = None
            self.model_loaded = False
            return False
    
    def _class_names_from_csv(self, class_map_csv_text: str) -> List[str]:
        """Parse class names from CSV text."""
        class_map_csv = io.StringIO(class_map_csv_text)
        class_names = [display_name for (class_index, mid, display_name) in csv.reader(class_map_csv)]
        class_names = class_names[1:]  # Skip CSV header
        return class_names
    
    def _try_load_class_names_from_assets(self, yamnet_path: Path):
        """Try to load class names from assets/yamnet_class_map.csv file."""
        try:
            class_map_file = yamnet_path / "assets" / "yamnet_class_map.csv"
            if class_map_file.exists():
                with open(class_map_file, 'r', encoding='utf-8') as f:
                    class_map_csv_text = f.read()
                self.class_names = self._class_names_from_csv(class_map_csv_text)
                logger.info(f"Loaded class names from {class_map_file}")
            else:
                logger.warning(f"Class map file not found at {class_map_file}. Using default classes.")
                self.class_names = self._get_default_yamnet_classes()
        except Exception as e:
            logger.warning(f"Failed to load class names from assets folder: {e}. Using default classes.")
            self.class_names = self._get_default_yamnet_classes()
    
    def _get_default_yamnet_classes(self) -> List[str]:
        """Get default YAMNet class names (521 classes) as fallback."""
        logger.warning("Using placeholder class names. Model should include class names.")
        return [f"class_{i}" for i in range(521)]  # YAMNet has 521 classes
    
    async def load_active_model_from_db(self, db_session):
        """
        Load YAMNet model from local directory (always uses yamnet-tensorflow2-yamnet-v1).
        
        Args:
            db_session: Database session (not used, but kept for compatibility)
        """
        try:
            from app.models.ml_model import MLModel
            from sqlalchemy import select
            
            query = select(MLModel).where(MLModel.is_active == True)
            result = await db_session.execute(query)
            active_model = result.scalar_one_or_none()
            
            if active_model:
                logger.info(f"Active model in database: {active_model.model_name} (ID: {active_model.model_id})")
            
            # Always load YAMNet from local directory regardless of database
            logger.info("Loading YAMNet from local models/yamnet-tensorflow2-yamnet-v1/ directory")
            self._load_yamnet_model()
            
        except Exception as e:
            logger.error(f"Error in load_active_model_from_db: {e}", exc_info=True)
            # Still try to load YAMNet as fallback
            self._load_yamnet_model()
    
    def load_model(self, model_path: Optional[str] = None):
        """
        Load or reload the YAMNet model from local directory.
        
        Args:
            model_path: Ignored - always loads from models/yamnet-tensorflow2-yamnet-v1/
        """
        # Always load from local YAMNet directory, ignore model_path
        logger.info("Reloading YAMNet from local directory (ignoring provided path)")
        self._load_yamnet_model()
    
    def _preprocess_audio(self, audio_file_path: str) -> np.ndarray:
        """
        Preprocess audio file for YAMNet model.
        
        YAMNet expects:
        - 1-D float32 array
        - Mono 16kHz samples
        - Range [-1.0, +1.0]
        
        Args:
            audio_file_path: Path to audio file
            
        Returns:
            Preprocessed audio array (16kHz, mono, normalized to [-1, 1])
        """
        try:
            # Load audio file and resample to 16kHz, convert to mono
            audio, sr = librosa.load(audio_file_path, sr=SAMPLE_RATE, mono=True)
            
            # Ensure audio is in range [-1.0, +1.0]
            # librosa.load already normalizes, but ensure it's float32
            audio = audio.astype(np.float32)
            
            # Clip to ensure range
            audio = np.clip(audio, -1.0, 1.0)
            
            return audio
            
        except Exception as e:
            logger.error(f"Error preprocessing audio: {e}", exc_info=True)
            raise
    
    def _map_yamnet_to_care_labels(self, scores: np.ndarray, class_names: List[str]) -> tuple[str, float]:
        """
        Map YAMNet's 521 AudioSet classes to senior care labels.
        
        Args:
            scores: YAMNet scores array (N, 521) - mean aggregated
            class_names: List of 521 class names
            
        Returns:
            Tuple of (label, confidence_score)
        """
        # Mean aggregate scores across frames
        mean_scores = scores.mean(axis=0) if scores.ndim > 1 else scores
        
        # Find top predictions - check more classes for better coverage
        top_indices = np.argsort(mean_scores)[::-1][:20]  # Top 20 for better keyword matching
        
        # Map YAMNet classes to care labels
        # Expanded keyword lists for better detection
        distress_keywords = [
            'scream', 'crying', 'sobbing', 'whimper', 'groan', 'moan', 'groaning',
            'pain', 'distress', 'emergency', 'alarm', 'siren', 'smoke alarm',
            'fire alarm', 'car alarm', 'burglar alarm', 'help', 'yelp', 'shriek'
        ]
        
        inactivity_keywords = [
            'silence', 'quiet', 'muffled', 'muted', 'hush', 'stillness'
        ]
        
        normal_keywords = [
            'speech', 'conversation', 'talking', 'human voice', 'music',
            'television', 'radio', 'footsteps', 'door', 'knock'
        ]
        
        fall_keywords = [
            'thump', 'thud', 'crash', 'breaking', 'glass breaking', 'glass',
            'impact', 'explosion', 'bang', 'collision', 'drop', 'falling'
        ]
        
        # New alert type keywords
        medical_emergency_keywords = [
            'cough', 'wheezing', 'gasping', 'choking', 'labored breathing', 'breathing',
            'medical', 'respiratory', 'asthma', 'panting', 'gasp', 'suffocation',
            'snoring', 'apnea', 'dyspnea'
        ]
        
        intrusion_keywords = [
            'breaking', 'glass breaking', 'door slamming', 'forced entry', 'intrusion',
            'breaking glass', 'window breaking', 'door', 'doorbell', 'knock', 'banging',
            'forced', 'break-in', 'burglary', 'unauthorized'
        ]
        
        agitation_keywords = [
            'shouting', 'arguing', 'aggressive speech', 'angry', 'yelling', 'screaming',
            'agitation', 'aggressive', 'hostile', 'confrontation', 'dispute', 'quarrel'
        ]
        
        # Minimum score threshold for keyword matches to be considered valid
        MIN_KEYWORD_SCORE = 0.05  # Very low threshold - any match above this is valid
        
        # Check all top predictions for relevant classes
        best_match_score = 0.0
        detected_label = "normal"
        matched_keywords = []
        matched_class = None
        
        # Priority order: distress > medical_emergency > intrusion > fall > agitation > inactivity
        for idx in top_indices:
            class_name = class_names[idx].lower()
            score = float(mean_scores[idx])
            
            # Check for distress indicators (highest priority)
            matched_distress = [kw for kw in distress_keywords if kw in class_name]
            if matched_distress and score >= MIN_KEYWORD_SCORE:
                if score > best_match_score:
                    best_match_score = score
                    detected_label = "distress"
                    matched_keywords = matched_distress
                    matched_class = class_names[idx]
                    logger.info(f"Matched distress keyword(s): {matched_distress} in class '{class_names[idx]}' (score: {score:.4f})")
            
            # Check for medical emergency (second priority - can override fall/intrusion/agitation)
            matched_medical = [kw for kw in medical_emergency_keywords if kw in class_name]
            if matched_medical and score >= MIN_KEYWORD_SCORE:
                # Medical emergency can override lower priority labels
                if score > best_match_score * 0.8 or (detected_label not in ["distress"] and score > best_match_score):
                    best_match_score = max(best_match_score, score)
                    if detected_label != "distress":  # Don't override distress
                        detected_label = "medical_emergency"
                        matched_keywords = matched_medical
                        matched_class = class_names[idx]
                        logger.info(f"Matched medical_emergency keyword(s): {matched_medical} in class '{class_names[idx]}' (score: {score:.4f})")
            
            # Check for intrusion (third priority)
            matched_intrusion = [kw for kw in intrusion_keywords if kw in class_name]
            if matched_intrusion and score >= MIN_KEYWORD_SCORE:
                # Intrusion can override fall/agitation/inactivity
                if score > best_match_score * 0.7 or (detected_label not in ["distress", "medical_emergency"] and score > best_match_score):
                    best_match_score = max(best_match_score, score)
                    if detected_label not in ["distress", "medical_emergency"]:
                        detected_label = "intrusion"
                        matched_keywords = matched_intrusion
                        matched_class = class_names[idx]
                        logger.info(f"Matched intrusion keyword(s): {matched_intrusion} in class '{class_names[idx]}' (score: {score:.4f})")
            
            # Check for fall indicators (fourth priority)
            matched_fall = [kw for kw in fall_keywords if kw in class_name]
            if matched_fall and score >= MIN_KEYWORD_SCORE:
                # Falls can override agitation/inactivity
                if score > best_match_score * 0.7 or (detected_label not in ["distress", "medical_emergency", "intrusion"] and score > best_match_score):
                    best_match_score = max(best_match_score, score)
                    if detected_label not in ["distress", "medical_emergency", "intrusion"]:
                        detected_label = "fall"
                        matched_keywords = matched_fall
                        matched_class = class_names[idx]
                        logger.info(f"Matched fall keyword(s): {matched_fall} in class '{class_names[idx]}' (score: {score:.4f})")
            
            # Check for agitation (fifth priority)
            matched_agitation = [kw for kw in agitation_keywords if kw in class_name]
            if matched_agitation and score >= MIN_KEYWORD_SCORE:
                # Agitation can override inactivity
                if score > best_match_score * 0.7 or (detected_label not in ["distress", "medical_emergency", "intrusion", "fall"] and score > best_match_score):
                    best_match_score = max(best_match_score, score)
                    if detected_label not in ["distress", "medical_emergency", "intrusion", "fall"]:
                        detected_label = "agitation"
                        matched_keywords = matched_agitation
                        matched_class = class_names[idx]
                        logger.info(f"Matched agitation keyword(s): {matched_agitation} in class '{class_names[idx]}' (score: {score:.4f})")
            
            # Check for inactivity (lowest priority - only if no other labels detected)
            matched_inactivity = [kw for kw in inactivity_keywords if kw in class_name]
            if matched_inactivity and score >= MIN_KEYWORD_SCORE:
                # Inactivity needs higher score threshold (0.4) and no other labels detected
                if score >= 0.4 and detected_label == "normal":
                    if score > best_match_score:
                        best_match_score = score
                        detected_label = "inactivity"
                        matched_keywords = matched_inactivity
                        matched_class = class_names[idx]
                        logger.info(f"Matched inactivity keyword(s): {matched_inactivity} in class '{class_names[idx]}' (score: {score:.4f})")
        
        # If we found a keyword match, use it (even if score is low)
        if detected_label != "normal" and best_match_score >= MIN_KEYWORD_SCORE:
            # Ensure minimum score for the final result (boost very low scores slightly)
            final_score = max(best_match_score, 0.3)  # At least 0.3 for any keyword match
            logger.info(
                f"Mapped to care label '{detected_label}' based on keywords: {matched_keywords} "
                f"in class '{matched_class}' (original score: {best_match_score:.4f}, final score: {final_score:.4f})"
            )
            return detected_label, final_score
        
        # If no specific care label detected, use top score with generic label
        top_idx = np.argmax(mean_scores)
        top_score = float(mean_scores[top_idx])
        top_class = class_names[top_idx]
        logger.info(
            f"No care label detected (distress/medical_emergency/intrusion/fall/agitation/inactivity). "
            f"Top YAMNet class: '{top_class}' (score: {top_score:.4f}). Mapping to 'normal'."
        )
        detected_label = "normal"
        top_score = 0.5  # Default confidence for normal
        
        return detected_label, top_score
    
    async def predict(self, audio_file_path: str) -> InferenceResponse:
        """
        Predict on an audio file using YAMNet.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            InferenceResponse with label and score
        """
        logger.info(f"Running YAMNet inference on {audio_file_path}")
        
        # Ensure model is loaded
        if not self.model_loaded:
            if not self._load_yamnet_model():
                logger.error("YAMNet model not available, returning default prediction")
                return InferenceResponse(
                    label="normal",
                    score=0.5
                )
        
        # Check if file exists
        if not Path(audio_file_path).exists():
            logger.warning(f"Audio file not found: {audio_file_path}")
            return InferenceResponse(
                label="normal",
                score=0.5
            )
        
        try:
            # Preprocess audio
            waveform = self._preprocess_audio(audio_file_path)
            
            # Run YAMNet inference
            # Returns: (scores, embeddings, log_mel_spectrogram)
            scores, embeddings, log_mel_spectrogram = self.model(waveform)
            
            # Verify output shapes
            logger.debug(f"YAMNet output shapes - scores: {scores.shape}, embeddings: {embeddings.shape}, spectrogram: {log_mel_spectrogram.shape}")
            
            # Log top YAMNet predictions for debugging
            scores_np = scores.numpy()
            mean_scores = scores_np.mean(axis=0) if scores_np.ndim > 1 else scores_np
            top_indices = np.argsort(mean_scores)[::-1][:5]  # Top 5
            logger.info(f"YAMNet top 5 predictions:")
            for idx in top_indices:
                logger.info(f"  - {self.class_names[idx]}: {mean_scores[idx]:.4f}")
            
            # Map YAMNet predictions to care labels
            label, score = self._map_yamnet_to_care_labels(scores_np, self.class_names)
            
            logger.info(f"Inference result: {label} (score: {score:.4f})")
            
            return InferenceResponse(
                label=label,
                score=float(score)
            )
            
        except Exception as e:
            logger.error(f"Error during YAMNet inference: {e}", exc_info=True)
            # Fallback to default prediction on error
            return InferenceResponse(
                label="normal",
                score=0.5
            )


# Global instance
inference_service = InferenceService()
