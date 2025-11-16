"""Campaign model"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Campaign(Base):
    """Marketing campaign model"""

    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Campaign details
    name = Column(String, nullable=False)
    description = Column(Text)
    objective = Column(String)  # awareness, engagement, conversions

    # Targeting
    target_platforms = Column(JSON)  # ["facebook", "instagram", "tiktok"]
    target_languages = Column(JSON)  # ["en", "es", "fr"]
    target_audience = Column(JSON)  # Demographics, interests

    # Timeline
    start_date = Column(DateTime)
    end_date = Column(DateTime)

    # Budget
    budget = Column(String)
    budget_currency = Column(String, default="USD")

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="campaigns")
    contents = relationship("Content", back_populates="campaign")

    def __repr__(self):
        return f"<Campaign {self.name}>"
