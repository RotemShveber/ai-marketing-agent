"""Content and ContentVersion models"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ContentType(str, enum.Enum):
    """Content type enumeration"""
    TEXT = "text"  # Captions, ad copy
    IMAGE = "image"  # Generated/edited images
    VIDEO = "video"  # Generated videos


class ContentStatus(str, enum.Enum):
    """Content status enumeration"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"


class Platform(str, enum.Enum):
    """Social media platform enumeration"""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    GOOGLE_ADS = "google_ads"
    YOUTUBE = "youtube"


class Content(Base):
    """Main content model"""

    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)

    # Content details
    content_type = Column(SQLEnum(ContentType), nullable=False)
    platform = Column(SQLEnum(Platform), nullable=False)
    status = Column(SQLEnum(ContentStatus), default=ContentStatus.DRAFT)

    # AI generation metadata
    prompt_used = Column(Text)  # The prompt that generated this
    ai_model = Column(String)  # gpt-4, claude-3, etc.
    generation_params = Column(JSON)  # Temperature, etc.

    # Publishing
    scheduled_for = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    platform_post_id = Column(String, nullable=True)  # ID from social platform

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="contents")
    campaign = relationship("Campaign", back_populates="contents")
    versions = relationship("ContentVersion", back_populates="content", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Content {self.content_type} for {self.platform}>"


class ContentVersion(Base):
    """Content version model - stores multiple variations"""

    __tablename__ = "content_versions"

    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False)

    # Version info
    version_number = Column(Integer, default=1)
    is_active = Column(Integer, default=False)  # Currently selected version

    # Actual content
    text_content = Column(Text, nullable=True)  # Caption, ad copy
    media_url = Column(String, nullable=True)  # URL to image/video
    thumbnail_url = Column(String, nullable=True)  # For videos

    # Language
    language = Column(String, default="en")

    # Performance (if published)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    engagement_rate = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    content = relationship("Content", back_populates="versions")

    def __repr__(self):
        return f"<ContentVersion {self.version_number}>"
