"""
User Management API endpoints
Manage users within customer organizations
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.database import get_db
from app.core.auth_deps import require_user, require_customer_access
from app.models.auth import User, UserRole, user_customers
from app.models.customer import Customer


router = APIRouter(prefix="/users", tags=["User Management"])


# ==================== Request/Response Models ====================

class UserInCustomer(BaseModel):
    """User with their role in a specific customer"""
    id: int
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: UserRole
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateUserRole(BaseModel):
    role: UserRole


class UpdateUserStatus(BaseModel):
    is_active: bool


class UserPermissions(BaseModel):
    """User's permissions for a customer"""
    customer_id: int
    customer_name: str
    role: UserRole
    permissions: List[str]


# ==================== Endpoints ====================

@router.get("/customer/{customer_id}", response_model=List[UserInCustomer])
async def get_customer_users(
    customer_id: int,
    current_user: User = Depends(require_customer_access(UserRole.VIEWER)),
    db: Session = Depends(get_db)
):
    """
    Get all users for a specific customer

    Requires at least VIEWER role
    """
    # Get all users for this customer
    stmt = select(
        User.id,
        User.email,
        User.full_name,
        User.avatar_url,
        user_customers.c.role,
        User.is_active,
        User.last_login,
        User.created_at
    ).select_from(User).join(
        user_customers,
        User.id == user_customers.c.user_id
    ).where(
        user_customers.c.customer_id == customer_id
    ).order_by(User.created_at.desc())

    result = db.execute(stmt).all()

    users = []
    for row in result:
        users.append({
            "id": row[0],
            "email": row[1],
            "full_name": row[2],
            "avatar_url": row[3],
            "role": UserRole(row[4]),
            "is_active": row[5],
            "last_login": row[6],
            "created_at": row[7]
        })

    return users


@router.put("/customer/{customer_id}/user/{user_id}/role")
async def update_user_role(
    customer_id: int,
    user_id: int,
    role_data: UpdateUserRole,
    current_user: User = Depends(require_customer_access(UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Update a user's role within a customer organization

    Requires CUSTOMER_ADMIN role
    """
    # Check if target user exists and has access to this customer
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if user is part of this customer
    stmt = select(user_customers).where(
        user_customers.c.user_id == user_id,
        user_customers.c.customer_id == customer_id
    )
    result = db.execute(stmt).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not part of this customer"
        )

    # Don't allow changing own role
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )

    # Update role
    stmt = user_customers.update().where(
        user_customers.c.user_id == user_id,
        user_customers.c.customer_id == customer_id
    ).values(role=role_data.role.value)

    db.execute(stmt)
    db.commit()

    return {"message": "User role updated successfully"}


@router.delete("/customer/{customer_id}/user/{user_id}")
async def remove_user_from_customer(
    customer_id: int,
    user_id: int,
    current_user: User = Depends(require_customer_access(UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Remove a user from a customer organization

    Requires CUSTOMER_ADMIN role
    """
    # Don't allow removing yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from the organization"
        )

    # Check if user is part of this customer
    stmt = select(user_customers).where(
        user_customers.c.user_id == user_id,
        user_customers.c.customer_id == customer_id
    )
    result = db.execute(stmt).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not part of this customer"
        )

    # Check if this is the last admin
    admin_count_stmt = select(user_customers).where(
        user_customers.c.customer_id == customer_id,
        user_customers.c.role == UserRole.CUSTOMER_ADMIN.value
    )
    admin_count = len(db.execute(admin_count_stmt).all())

    if admin_count <= 1 and result.role == UserRole.CUSTOMER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the last admin from the organization"
        )

    # Remove user from customer
    stmt = user_customers.delete().where(
        user_customers.c.user_id == user_id,
        user_customers.c.customer_id == customer_id
    )
    db.execute(stmt)
    db.commit()

    return {"message": "User removed from organization successfully"}


@router.get("/me/permissions", response_model=List[UserPermissions])
async def get_my_permissions(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's permissions across all customers
    """
    # Get all customers user has access to
    stmt = select(
        Customer.id,
        Customer.company_name,
        user_customers.c.role
    ).select_from(Customer).join(
        user_customers,
        Customer.id == user_customers.c.customer_id
    ).where(
        user_customers.c.user_id == current_user.id
    )

    result = db.execute(stmt).all()

    permissions_list = []
    for row in result:
        customer_id, company_name, role_str = row
        role = UserRole(role_str)

        # Define permissions based on role
        permissions = get_role_permissions(role)

        permissions_list.append({
            "customer_id": customer_id,
            "customer_name": company_name,
            "role": role,
            "permissions": permissions
        })

    return permissions_list


@router.put("/me/profile")
async def update_my_profile(
    full_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile
    """
    if full_name is not None:
        current_user.full_name = full_name

    if avatar_url is not None:
        current_user.avatar_url = avatar_url

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url
    }


# ==================== Helper Functions ====================

def get_role_permissions(role: UserRole) -> List[str]:
    """Get list of permissions for a role"""
    permissions = {
        UserRole.VIEWER: [
            "view_content",
            "view_products",
            "view_campaigns",
            "view_analytics"
        ],
        UserRole.EDITOR: [
            "view_content",
            "view_products",
            "view_campaigns",
            "view_analytics",
            "create_content",
            "edit_content",
            "delete_content",
            "create_products",
            "edit_products"
        ],
        UserRole.MANAGER: [
            "view_content",
            "view_products",
            "view_campaigns",
            "view_analytics",
            "create_content",
            "edit_content",
            "delete_content",
            "create_products",
            "edit_products",
            "delete_products",
            "create_campaigns",
            "edit_campaigns",
            "delete_campaigns",
            "view_users",
            "invite_users"
        ],
        UserRole.CUSTOMER_ADMIN: [
            "view_content",
            "view_products",
            "view_campaigns",
            "view_analytics",
            "create_content",
            "edit_content",
            "delete_content",
            "create_products",
            "edit_products",
            "delete_products",
            "create_campaigns",
            "edit_campaigns",
            "delete_campaigns",
            "view_users",
            "invite_users",
            "manage_users",
            "change_roles",
            "remove_users",
            "edit_organization",
            "manage_billing",
            "manage_api_keys"
        ],
        UserRole.SUPER_ADMIN: [
            "all_permissions",
            "manage_all_customers",
            "view_all_analytics",
            "system_settings"
        ]
    }

    return permissions.get(role, [])
