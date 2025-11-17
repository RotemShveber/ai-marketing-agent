"""
Authentication API endpoints
Handles login, registration, SSO, and token management
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_invitation_token,
    validate_password_strength,
)
from app.core.auth_deps import get_current_user, require_user
from app.models.auth import User, RefreshToken, SSOProvider, UserRole, Invitation
from app.models.customer import Customer
from app.core.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])


# ==================== Request/Response Models ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    invitation_token: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class SSOLoginRequest(BaseModel):
    provider: SSOProvider
    code: str  # Authorization code from OAuth flow
    redirect_uri: str


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: UserRole
    customer_id: int


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    sso_provider: SSOProvider
    is_verified: bool
    is_super_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Helper Functions ====================

def create_tokens_for_user(
    user: User,
    db: Session,
    request: Request
) -> dict:
    """Create access and refresh tokens for a user"""
    # Create access token (15 minutes)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=15)
    )

    # Create refresh token (30 days)
    refresh_token_str = create_refresh_token(
        data={"sub": user.id},
        expires_delta=timedelta(days=30)
    )

    # Store refresh token in database
    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=30),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None
    )
    db.add(refresh_token)

    # Update last login
    user.last_login = datetime.utcnow()
    user.last_login_ip = request.client.host if request.client else None
    user.failed_login_attempts = 0

    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "is_super_admin": user.is_super_admin,
            "is_verified": user.is_verified,
        }
    }


# ==================== Public Endpoints ====================

@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new user account

    - If invitation_token is provided, user is added to that customer
    - Otherwise, creates a new customer for the user
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Check invitation token if provided
    invitation = None
    if user_data.invitation_token:
        invitation = db.query(Invitation).filter(
            Invitation.token == user_data.invitation_token,
            Invitation.accepted == False,
            Invitation.expires_at > datetime.utcnow()
        ).first()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invitation token"
            )

        if invitation.email.lower() != user_data.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation email does not match"
            )

    # Create user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        sso_provider=SSOProvider.EMAIL,
        is_verified=False,  # Require email verification
    )
    db.add(user)
    db.flush()  # Get user ID

    # Handle invitation or create new customer
    if invitation:
        # Add user to invited customer with specified role
        from app.models.auth import user_customers
        stmt = user_customers.insert().values(
            user_id=user.id,
            customer_id=invitation.customer_id,
            role=invitation.role.value
        )
        db.execute(stmt)

        # Mark invitation as accepted
        invitation.accepted = True
        invitation.accepted_at = datetime.utcnow()
    else:
        # Create a new customer for this user
        customer = Customer(
            company_name=f"{user_data.full_name}'s Organization",
            brand_name=f"{user_data.full_name}'s Brand",
            primary_color="#7C3AED",
            secondary_color="#EC4899",
            tone_of_voice="professional",
        )
        db.add(customer)
        db.flush()

        # Add user as admin of their customer
        from app.models.auth import user_customers
        stmt = user_customers.insert().values(
            user_id=user.id,
            customer_id=customer.id,
            role=UserRole.CUSTOMER_ADMIN.value
        )
        db.execute(stmt)

    db.commit()
    db.refresh(user)

    # Create tokens
    tokens = create_tokens_for_user(user, db, request)

    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Login with email and password

    Returns JWT access token and refresh token
    """
    # Get user
    user = db.query(User).filter(User.email == form_data.username).first()

    # Check if user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password or ""):
        # Increment failed login attempts
        if user:
            user.failed_login_attempts += 1

            # Lock account after 5 failed attempts
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=30)
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account locked due to too many failed login attempts. Try again in 30 minutes."
                )

            db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked. Try again later."
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Create tokens
    tokens = create_tokens_for_user(user, db, request)

    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    # Decode refresh token
    payload = decode_token(token_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Check if refresh token exists in database
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_data.refresh_token,
        RefreshToken.revoked == False
    ).first()

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or revoked"
        )

    # Check if token is expired
    if refresh_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )

    # Get user
    user = db.query(User).filter(User.id == refresh_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Revoke old refresh token
    refresh_token.revoked = True
    refresh_token.revoked_at = datetime.utcnow()

    # Create new tokens
    tokens = create_tokens_for_user(user, db, request)

    return tokens


@router.post("/logout")
async def logout(
    refresh_token: str,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Logout user by revoking refresh token
    """
    # Revoke the refresh token
    token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token,
        RefreshToken.user_id == current_user.id
    ).first()

    if token:
        token.revoked = True
        token.revoked_at = datetime.utcnow()
        db.commit()

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(require_user)
):
    """
    Get current user information
    """
    return current_user


@router.post("/sso/{provider}")
async def sso_login(
    provider: SSOProvider,
    code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle SSO login for Google, Microsoft, or GitHub

    This is a placeholder - you'll need to implement actual OAuth flows
    """
    # TODO: Implement actual SSO providers
    # For now, this is a placeholder

    if provider == SSOProvider.GOOGLE:
        # Implement Google OAuth
        pass
    elif provider == SSOProvider.MICROSOFT:
        # Implement Microsoft OAuth
        pass
    elif provider == SSOProvider.GITHUB:
        # Implement GitHub OAuth
        pass

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"SSO provider {provider} not yet implemented"
    )


# ==================== Protected Endpoints ====================

@router.post("/invite")
async def invite_user(
    invite_data: InviteUserRequest,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Invite a user to join a customer organization

    Requires CUSTOMER_ADMIN or MANAGER role
    """
    # Check if current user has permission to invite
    # (This should use the require_customer_access dependency in production)

    # Generate invitation token
    token = generate_invitation_token()

    # Create invitation
    invitation = Invitation(
        customer_id=invite_data.customer_id,
        email=invite_data.email,
        role=invite_data.role,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        invited_by_id=current_user.id
    )

    db.add(invitation)
    db.commit()

    # TODO: Send invitation email

    return {
        "message": "Invitation sent",
        "invitation_token": token,
        "expires_at": invitation.expires_at
    }
