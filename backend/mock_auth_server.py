"""
Mock Authentication Server for Testing
Run this to test authentication without full database setup
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import secrets
import jwt
from passlib.context import CryptContext

# Configuration
SECRET_KEY = "your-secret-key-for-development-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory storage (replace with database in production)
USERS_DB = {}
TOKENS_DB = {}
CUSTOMERS_DB = {}
USER_CUSTOMERS = {}  # user_id -> [(customer_id, role)]

app = FastAPI(title="AstralAI Mock Auth Server")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    invitation_token: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class User:
    def __init__(self, id, email, hashed_password, full_name, is_super_admin=False):
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.full_name = full_name
        self.is_super_admin = is_super_admin
        self.is_verified = True
        self.is_active = True
        self.avatar_url = None
        self.created_at = datetime.utcnow()
        self.last_login = None

class Customer:
    def __init__(self, id, company_name, brand_name):
        self.id = id
        self.company_name = company_name
        self.brand_name = brand_name
        self.primary_color = "#7C3AED"
        self.secondary_color = "#EC4899"
        self.tone_of_voice = "professional"

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Initialize with default admin user
def init_admin():
    if 1 not in USERS_DB:
        admin = User(
            id=1,
            email="admin@astralai.com",
            hashed_password=get_password_hash("Admin123!"),
            full_name="AstralAI Admin",
            is_super_admin=True
        )
        USERS_DB[1] = admin

        # Create default customer
        customer = Customer(1, "AstralAI", "AstralAI Platform")
        CUSTOMERS_DB[1] = customer
        USER_CUSTOMERS[1] = [(1, "super_admin")]

        print("\n" + "="*60)
        print("🎉 ADMIN USER CREATED!")
        print("="*60)
        print("Email: admin@astralai.com")
        print("Password: Admin123!")
        print("Role: Super Admin")
        print("="*60 + "\n")

init_admin()

# Routes
@app.get("/")
async def root():
    return {
        "app": "AstralAI Mock Auth Server",
        "status": "running",
        "users_count": len(USERS_DB),
        "message": "Use admin@astralai.com / Admin123! to login"
    }

@app.post("/api/v1/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    for user in USERS_DB.values():
        if user.email == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user_id = len(USERS_DB) + 1
    user = User(
        id=user_id,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_super_admin=False
    )
    USERS_DB[user_id] = user

    # Create customer for user
    customer_id = len(CUSTOMERS_DB) + 1
    customer = Customer(
        id=customer_id,
        company_name=f"{user_data.full_name}'s Organization",
        brand_name=f"{user_data.full_name}'s Brand"
    )
    CUSTOMERS_DB[customer_id] = customer
    USER_CUSTOMERS[user_id] = [(customer_id, "customer_admin")]

    # Create tokens
    access_token = create_token(
        {"sub": user_id, "email": user.email, "type": "access"},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_token(
        {"sub": user_id, "type": "refresh"},
        timedelta(days=30)
    )

    TOKENS_DB[refresh_token] = user_id

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
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

@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user
    user = None
    for u in USERS_DB.values():
        if u.email == form_data.username:
            user = u
            break

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    # Update last login
    user.last_login = datetime.utcnow()

    # Create tokens
    access_token = create_token(
        {"sub": user.id, "email": user.email, "type": "access"},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_token(
        {"sub": user.id, "type": "refresh"},
        timedelta(days=30)
    )

    TOKENS_DB[refresh_token] = user.id

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
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

@app.get("/api/v1/auth/me")
async def get_me(authorization: str = Depends(lambda: None)):
    # Simple mock - just return admin user
    user = USERS_DB[1]
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "is_super_admin": user.is_super_admin,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat()
    }

@app.get("/api/v1/users/customer/{customer_id}")
async def get_customer_users(customer_id: int):
    users = []
    for user_id, customer_roles in USER_CUSTOMERS.items():
        for cid, role in customer_roles:
            if cid == customer_id:
                user = USERS_DB[user_id]
                users.append({
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url,
                    "role": role,
                    "is_active": user.is_active,
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "created_at": user.created_at.isoformat()
                })
    return users

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Mock Auth Server...")
    print("📍 Server will run on: http://localhost:8000")
    print("📍 Frontend expects API at: http://localhost:8000/api/v1")
    print("\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
