"""Policy engine for alert decision making."""
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.event import Event
from app.models.alert import Alert
from app.models.alert_type import AlertType
# Audit logs removed - not needed
from app.schemas.inference import InferenceResponse
from app.config import settings
from decimal import Decimal

logger = logging.getLogger(__name__)


class PolicyEngine:
    """
    Policy engine that evaluates inference results and creates alerts.
    
    Rules:
    - Threshold-based: If inference score exceeds threshold, create alert
    - Aggregation: If N events within T seconds, create aggregated alert
    """
    
    def __init__(self):
        """Initialize the policy engine."""
        self.threshold = settings.policy_threshold
        self.aggregation_window = timedelta(seconds=settings.policy_aggregation_window_seconds)
        self.min_events_for_alert = settings.policy_min_events_for_alert
    
    async def evaluate(
        self,
        db: AsyncSession,
        event_id: int,
        house_id: int,
        device_id: int,
        inference_result: InferenceResponse,
        event_timestamp: datetime
    ) -> Optional[int]:
        """
        Evaluate inference result and create alert if conditions are met.
        
        Args:
            db: Database session
            event_id: ID of the event
            house_id: ID of the house
            device_id: ID of the device
            inference_result: Result from inference service
            event_timestamp: Timestamp of the event
            
        Returns:
            Alert ID if alert was created, None otherwise
        """
        # Map inference label to alert type name
        label_to_type_name = {
            "distress": "distress",
            "inactivity": "inactivity",
            "alarm": "alarm",
            "fall": "fall",
        }
        
        alert_type_name = label_to_type_name.get(inference_result.label, "anomaly")
        
        # Get alert_type_id from alert_types table
        alert_type_query = select(AlertType).where(AlertType.type_name == alert_type_name)
        alert_type_result = await db.execute(alert_type_query)
        alert_type = alert_type_result.scalar_one_or_none()
        
        # If alert type doesn't exist, create a default one or use a fallback
        if not alert_type:
            logger.warning(f"Alert type '{alert_type_name}' not found, using default")
            # For MVP, we'll need at least one alert_type in the database
            # You may want to create default alert types via migration
            return None
        
        alert_type_id = alert_type.alert_type_id
        
        # Determine severity based on score
        if inference_result.score >= 0.85:
            severity = "high"
        elif inference_result.score >= 0.70:
            severity = "medium"
        else:
            severity = "low"
        
        # Check threshold
        if inference_result.score < self.threshold:
            logger.info(f"Event {event_id}: Score {inference_result.score} below threshold {self.threshold}, no alert")
            return None
        
        # Check aggregation window for similar events
        window_start = event_timestamp - self.aggregation_window
        
        # Query for recent similar events in the same house
        # We need to check raw_data for inference label since it's stored there
        similar_events_query = select(func.count(Event.event_id)).where(
            Event.house_id == house_id,
            Event.device_id == device_id,
            Event.created_at >= window_start,
            Event.created_at <= event_timestamp,
            Event.is_processed == True
        )
        
        result = await db.execute(similar_events_query)
        similar_event_count = result.scalar() or 0
        
        # Check if we should create an alert
        should_create_alert = False
        policy_rule = ""
        
        if similar_event_count >= self.min_events_for_alert:
            should_create_alert = True
            policy_rule = f"aggregation: {similar_event_count} events in {self.aggregation_window.total_seconds()}s window"
        elif inference_result.score >= self.threshold:
            should_create_alert = True
            policy_rule = f"threshold: score {inference_result.score:.2f} >= {self.threshold}"
        
        if not should_create_alert:
            logger.info(f"Event {event_id}: Policy conditions not met, no alert")
            return None
        
        # Get device location
        from app.models.device import Device
        device_query = select(Device).where(Device.device_id == device_id)
        device_result = await db.execute(device_query)
        device = device_result.scalar_one_or_none()
        
        # Create alert
        alert = Alert(
            house_id=house_id,
            device_id=device_id,
            event_id=event_id,
            alert_type_id=alert_type_id,
            rule_id=None,  # Can be set if using alert_rules table
            severity=severity,
            status="active",
            confidence_score=Decimal(str(inference_result.score)),
        )
        
        db.add(alert)
        await db.flush()  # Flush to get the alert_id
        
        logger.info(f"Created alert {alert.alert_id} for event {event_id} (policy: {policy_rule})")
        
        return alert.alert_id


# Global instance
policy_engine = PolicyEngine()
