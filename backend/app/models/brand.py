"""Brand assets model"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class BrandAssets(Base):
    """Brand assets and style guide model"""

    __tablename__ = "brand_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Brand identity
    brand_name = Column(String, nullable=False)
    tagline = Column(String)
    description = Column(Text)

    # Visual assets
    logo_url = Column(String)
    logo_dark_url = Column(String)  # For dark backgrounds
    watermark_url = Column(String)

    # Colors (hex codes)
    primary_color = Column(String, default="#000000")
    secondary_color = Column(String, default="#FFFFFF")
    accent_color = Column(String, default="#FF6B6B")
    background_color = Column(String, default="#FFFFFF")

    # Typography
    primary_font = Column(String, default="Inter")
    secondary_font = Column(String, default="Playfair Display")
    font_urls = Column(JSON)  # Google Fonts or custom font URLs

    # Style guide
    tone_of_voice = Column(String, default="professional")  # casual, professional, luxury
    brand_keywords = Column(JSON)  # ["luxury", "elegant", "sophisticated"]
    brand_values = Column(JSON)  # ["quality", "innovation", "sustainability"]

    # Content guidelines
    hashtag_strategy = Column(JSON)  # Platform-specific hashtags
    content_templates = Column(JSON)  # Pre-defined templates

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="brand_assets")

    def __repr__(self):
        return f"<BrandAssets {self.brand_name}>"
