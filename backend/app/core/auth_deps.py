"""
Authentication dependencies for FastAPI
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.auth import User, UserRole
from app.models.customer import Customer


# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current authenticated user from JWT token

    Returns None if no valid token provided (for optional auth)
    Raises 401 if token is invalid
    """
    if not token:
        return None

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    # Check token type
    if payload.get("type") != "access":
        raise credentials_exception

    # Get user ID from token
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked"
        )

    return user


async def require_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    Require authenticated user (raises 401 if not authenticated)
    """
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def require_verified_user(
    current_user: User = Depends(require_user)
) -> User:
    """
    Require verified user (email verified)
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user


async def require_super_admin(
    current_user: User = Depends(require_user)
) -> User:
    """
    Require super admin user
    """
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required"
        )
    return current_user


def require_customer_access(required_role: UserRole = UserRole.VIEWER):
    """
    Factory function to create customer access dependency

    Usage:
        @router.get("/content")
        async def get_content(
            customer_id: int,
            user: User = Depends(require_customer_access(UserRole.VIEWER))
        ):
            ...
    """
    async def _require_customer_access(
        customer_id: int,
        current_user: User = Depends(require_user),
        db: Session = Depends(get_db)
    ) -> User:
        # Super admins have access to everything
        if current_user.is_super_admin:
            return current_user

        # Check if user has access to this customer
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )

        # Check if user is associated with this customer
        if customer not in current_user.customers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this customer"
            )

        # Check role permissions
        # Get user's role for this customer from association table
        from sqlalchemy import select
        from app.models.auth import user_customers

        stmt = select(user_customers.c.role).where(
            user_customers.c.user_id == current_user.id,
            user_customers.c.customer_id == customer_id
        )
        result = db.execute(stmt).first()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No role assigned for this customer"
            )

        user_role_str = result[0]
        user_role = UserRole(user_role_str)

        # Check if user has required role
        role_hierarchy = {
            UserRole.VIEWER: 1,
            UserRole.EDITOR: 2,
            UserRole.MANAGER: 3,
            UserRole.CUSTOMER_ADMIN: 4,
            UserRole.SUPER_ADMIN: 5,
        }

        if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {required_role.value}, your role: {user_role.value}"
            )

        return current_user

    return _require_customer_access


from datetime import datetime
