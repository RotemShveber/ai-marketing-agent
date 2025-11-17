"""
Customer Model
Represents different customers/clients that AstralAI serves
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Customer(Base):
    """Customer/Client model for multi-tenant support"""

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Customer Info
    company_name = Column(String, nullable=False, index=True)
    industry = Column(String)  # e.g., "Beauty", "Fashion", "Tech"
    website = Column(String)
    description = Column(Text)

    # Brand Identity
    brand_name = Column(String, nullable=False)
    tagline = Column(String)
    logo_url = Column(String)
    primary_color = Column(String, default="#7C3AED")
    secondary_color = Column(String, default="#EC4899")

    # Brand Voice & Style
    tone_of_voice = Column(String, default="professional")  # casual, professional, luxury, playful
    brand_values = Column(JSON)  # ["quality", "innovation", "sustainability"]
    brand_keywords = Column(JSON)  # Keywords that define the brand
    target_audience = Column(Text)  # Description of target audience

    # Platform API Keys (encrypted in production)
    facebook_access_token = Column(String)
    facebook_page_id = Column(String)
    instagram_access_token = Column(String)
    instagram_account_id = Column(String)
    tiktok_access_token = Column(String)
    youtube_api_key = Column(String)
    youtube_channel_id = Column(String)
    google_ads_customer_id = Column(String)
    google_ads_access_token = Column(String)

    # Feature Flags per Customer
    enable_auto_posting = Column(Boolean, default=False)
    enable_image_generation = Column(Boolean, default=True)
    enable_video_generation = Column(Boolean, default=True)

    # Content Preferences
    default_language = Column(String, default="en")
    supported_languages = Column(JSON, default=["en"])
    content_schedule = Column(JSON)  # Posting schedule per platform

    # Status
    is_active = Column(Boolean, default=True)
    subscription_tier = Column(String, default="basic")  # basic, pro, enterprise

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_content_generated = Column(DateTime)

    # Relationships
    users = relationship(
        "User",
        secondary="user_customers",
        back_populates="customers"
    )
    products = relationship("Product", back_populates="customer", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="customer", cascade="all, delete-orphan")
    contents = relationship("Content", back_populates="customer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Customer {self.company_name} - {self.brand_name}>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "company_name": self.company_name,
            "brand_name": self.brand_name,
            "industry": self.industry,
            "website": self.website,
            "tagline": self.tagline,
            "primary_color": self.primary_color,
            "secondary_color": self.secondary_color,
            "tone_of_voice": self.tone_of_voice,
            "target_audience": self.target_audience,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def get_platform_config(self, platform: str) -> dict:
        """Get platform-specific configuration"""
        configs = {
            "facebook": {
                "access_token": self.facebook_access_token,
                "page_id": self.facebook_page_id,
                "enabled": bool(self.facebook_access_token),
            },
            "instagram": {
                "access_token": self.instagram_access_token,
                "account_id": self.instagram_account_id,
                "enabled": bool(self.instagram_access_token),
            },
            "tiktok": {
                "access_token": self.tiktok_access_token,
                "enabled": bool(self.tiktok_access_token),
            },
            "youtube": {
                "api_key": self.youtube_api_key,
                "channel_id": self.youtube_channel_id,
                "enabled": bool(self.youtube_api_key),
            },
            "google_ads": {
                "customer_id": self.google_ads_customer_id,
                "access_token": self.google_ads_access_token,
                "enabled": bool(self.google_ads_customer_id),
            },
        }
        return configs.get(platform.lower(), {})

    def get_brand_info(self) -> dict:
        """Get brand information for content generation"""
        return {
            "name": self.brand_name,
            "company": self.company_name,
            "tagline": self.tagline,
            "values": self.brand_values or [],
            "keywords": self.brand_keywords or [],
            "tone": self.tone_of_voice,
            "target_audience": self.target_audience,
            "colors": {
                "primary": self.primary_color,
                "secondary": self.secondary_color,
            },
        }
