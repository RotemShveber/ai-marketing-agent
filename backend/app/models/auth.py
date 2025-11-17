"""
Authentication and Authorization Models
Multi-tenant user management with SSO support
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum

from app.core.database import Base


class UserRole(str, Enum):
    """User roles within a customer organization"""
    SUPER_ADMIN = "super_admin"  # AstralAI admin (manages all customers)
    CUSTOMER_ADMIN = "customer_admin"  # Customer organization admin
    MANAGER = "manager"  # Can manage content and users
    EDITOR = "editor"  # Can create and edit content
    VIEWER = "viewer"  # Read-only access


class SSOProvider(str, Enum):
    """Supported SSO providers"""
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    GITHUB = "github"
    EMAIL = "email"  # Traditional email/password


# Association table for user-customer many-to-many relationship
user_customers = Table(
    'user_customers',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('customer_id', Integer, ForeignKey('customers.id', ondelete='CASCADE')),
    Column('role', String, default=UserRole.VIEWER.value),
    Column('created_at', DateTime, default=datetime.utcnow),
)


class User(Base):
    """User account with SSO support"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for SSO users
    full_name = Column(String)
    avatar_url = Column(String)

    # SSO Information
    sso_provider = Column(SQLEnum(SSOProvider), default=SSOProvider.EMAIL)
    sso_id = Column(String, unique=True, nullable=True)  # Provider's user ID
    sso_data = Column(JSON, nullable=True)  # Additional SSO data

    # Account Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_super_admin = Column(Boolean, default=False)  # AstralAI super admin

    # Security
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    last_login_ip = Column(String, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Relationships
    customers = relationship(
        "Customer",
        secondary=user_customers,
        back_populates="users"
    )
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"

    def has_customer_access(self, customer_id: int) -> bool:
        """Check if user has access to a customer"""
        if self.is_super_admin:
            return True
        return any(c.id == customer_id for c in self.customers)

    def get_customer_role(self, customer_id: int) -> UserRole | None:
        """Get user's role for a specific customer"""
        if self.is_super_admin:
            return UserRole.SUPER_ADMIN

        # Query the association table to get role
        from sqlalchemy import select
        from app.core.database import get_db

        # This would need to be implemented properly in a route
        return None

    def can_perform_action(self, customer_id: int, required_role: UserRole) -> bool:
        """Check if user has sufficient permissions"""
        if self.is_super_admin:
            return True

        user_role = self.get_customer_role(customer_id)
        if not user_role:
            return False

        # Role hierarchy
        role_hierarchy = {
            UserRole.VIEWER: 1,
            UserRole.EDITOR: 2,
            UserRole.MANAGER: 3,
            UserRole.CUSTOMER_ADMIN: 4,
            UserRole.SUPER_ADMIN: 5,
        }

        return role_hierarchy.get(user_role, 0) >= role_hierarchy.get(required_role, 0)


class RefreshToken(Base):
    """Refresh tokens for JWT authentication"""

    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime, nullable=True)

    # Device/session tracking
    user_agent = Column(String)
    ip_address = Column(String)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken {self.token[:20]}...>"


class AuditLog(Base):
    """Audit log for tracking user actions"""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)

    # Action details
    action = Column(String, nullable=False)  # "login", "create_content", "delete_user", etc.
    resource_type = Column(String)  # "content", "user", "customer", etc.
    resource_id = Column(String)
    details = Column(JSON)

    # Request metadata
    ip_address = Column(String)
    user_agent = Column(String)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog {self.action} by user {self.user_id}>"


class Invitation(Base):
    """User invitations to join a customer organization"""

    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    email = Column(String, nullable=False, index=True)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER)

    # Invitation token
    token = Column(String, unique=True, index=True, nullable=False)

    # Status
    accepted = Column(Boolean, default=False)
    accepted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)

    # Who sent the invitation
    invited_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Invitation {self.email} to customer {self.customer_id}>"
