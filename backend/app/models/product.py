"""Product model"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    """Product model for perfumes and beauty products"""

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Product details
    name = Column(String, nullable=False, index=True)
    category = Column(String, default="Perfume")  # Perfume, Beauty, etc.
    description = Column(Text)

    # Perfume-specific
    fragrance_notes = Column(JSON)  # {"top": [], "middle": [], "base": []}
    scent_family = Column(String)  # Floral, Oriental, Fresh, etc.

    # Media
    primary_image_url = Column(String)  # Main product image
    additional_images = Column(JSON)  # List of additional image URLs

    # Metadata
    sku = Column(String, unique=True, index=True)
    price = Column(String)  # Store as string to handle currency
    tags = Column(JSON)  # ["luxury", "women", "summer"]

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="products")
    contents = relationship("Content", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product {self.name}>"
