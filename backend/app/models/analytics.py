"""Analytics model"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship

from app.core.database import Base


class AnalyticsEvent(Base):
    """Analytics events for tracking performance"""

    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=True)

    # Event details
    event_type = Column(String, nullable=False)  # impression, click, engagement, conversion
    platform = Column(String, nullable=False)

    # Metrics
    value = Column(Float, default=0.0)
    metadata = Column(JSON)  # Additional event data

    # Timestamp
    event_timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AnalyticsEvent {self.event_type} on {self.platform}>"
