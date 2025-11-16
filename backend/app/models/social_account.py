"""Social media account model"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class SocialAccount(Base):
    """Connected social media accounts"""

    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Platform info
    platform = Column(String, nullable=False)  # facebook, instagram, tiktok, etc.
    account_name = Column(String)
    account_id = Column(String)  # Platform-specific account ID

    # Authentication
    access_token = Column(Text)  # Encrypted
    refresh_token = Column(Text, nullable=True)  # Encrypted
    token_expires_at = Column(DateTime, nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_sync = Column(DateTime, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="social_accounts")

    def __repr__(self):
        return f"<SocialAccount {self.platform} - {self.account_name}>"
