"""
Simple Authentication Server for Testing (No Database Required!)
Run: python3 simple_auth_server.py
"""
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import secrets

app = FastAPI(title="AstralAI Simple Auth Server")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
USERS = {}
SESSIONS = {}
CUSTOMERS = {}  # Store customers here
USER_CUSTOMERS = {}  # Map user_id -> [(customer_id, role)]

# Models
class LoginRequest(BaseModel):
    username: str  # email
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

class CreateTestUserRequest(BaseModel):
    email: str
    full_name: str
    role: str  # editor, manager, viewer
    customer_id: int

class CreateCustomerRequest(BaseModel):
    company_name: str
    brand_name: str
    industry: str = "Retail"
    primary_color: str = "#7C3AED"
    secondary_color: str = "#EC4899"
    tone_of_voice: str = "professional"

# Helper functions
def hash_password(password: str) -> str:
    """Simple hash for demo (use proper hashing in production!)"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Generate a random token"""
    return secrets.token_urlsafe(32)

# Initialize admin user
USERS["admin@astralai.com"] = {
    "id": 1,
    "email": "admin@astralai.com",
    "password": hash_password("Admin123!"),
    "full_name": "AstralAI Admin",
    "is_super_admin": True,
    "is_verified": True,
    "avatar_url": None,
    "created_at": datetime.utcnow().isoformat()
}

print("\n" + "="*70)
print("🎉 SIMPLE AUTH SERVER READY!")
print("="*70)
print("\n📝 PRE-CREATED ADMIN USER:")
print("   Email:    admin@astralai.com")
print("   Password: Admin123!")
print("   Role:     Super Admin")
print("\n📍 Server URL: http://localhost:8000")
print("📍 API Base:   http://localhost:8000/api/v1")
print("\n💡 TIP: Go to http://localhost:3000/login and use the credentials above!")
print("="*70 + "\n")

# Routes
@app.get("/")
async def root():
    return {
        "app": "AstralAI Simple Auth Server",
        "status": "✅ Running",
        "users_count": len(USERS),
        "sessions_count": len(SESSIONS),
        "admin_credentials": {
            "email": "admin@astralai.com",
            "password": "Admin123!"
        },
        "message": "Go to http://localhost:3000/login to test!"
    }

@app.post("/api/v1/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    """Login endpoint (OAuth2 password flow compatible)"""
    print(f"Login attempt: username={username}")

    # Find user
    user = USERS.get(username)

    if not user or user["password"] != hash_password(password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Generate tokens
    access_token = generate_token()
    refresh_token = generate_token()

    # Store session
    SESSIONS[access_token] = {
        "user_id": user["id"],
        "email": user["email"],
        "expires": (datetime.utcnow() + timedelta(hours=24)).isoformat()
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user["avatar_url"],
            "is_super_admin": user["is_super_admin"],
            "is_verified": user["is_verified"]
        }
    }

@app.post("/api/v1/auth/register")
async def register(data: RegisterRequest):
    """Register new user"""
    # Check if exists
    if data.email in USERS:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user_id = len(USERS) + 1
    USERS[data.email] = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "full_name": data.full_name,
        "is_super_admin": False,
        "is_verified": True,
        "avatar_url": None,
        "created_at": datetime.utcnow().isoformat()
    }

    # Auto-login
    access_token = generate_token()
    refresh_token = generate_token()

    SESSIONS[access_token] = {
        "user_id": user_id,
        "email": data.email,
        "expires": (datetime.utcnow() + timedelta(hours=24)).isoformat()
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": data.email,
            "full_name": data.full_name,
            "avatar_url": None,
            "is_super_admin": False,
            "is_verified": True
        }
    }

@app.get("/api/v1/auth/me")
async def get_me():
    """Get current user (mock - returns admin)"""
    user = USERS["admin@astralai.com"]
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "avatar_url": user["avatar_url"],
        "is_super_admin": user["is_super_admin"],
        "is_verified": user["is_verified"],
        "created_at": user["created_at"]
    }

@app.get("/api/v1/users/customer/{customer_id}")
async def get_customer_users(customer_id: int):
    """Get users for a specific customer"""
    users = []

    for user_id, customer_roles in USER_CUSTOMERS.items():
        for cid, role in customer_roles:
            if cid == customer_id:
                # Find the user
                user = None
                for u in USERS.values():
                    if u["id"] == user_id:
                        user = u
                        break

                if user:
                    users.append({
                        "id": user["id"],
                        "email": user["email"],
                        "full_name": user["full_name"],
                        "avatar_url": user.get("avatar_url"),
                        "role": role,
                        "is_active": True,
                        "last_login": datetime.utcnow().isoformat(),
                        "created_at": user["created_at"]
                    })

    return users

@app.post("/api/v1/customers")
async def create_customer(data: CreateCustomerRequest):
    """Create a new customer (Admin only)"""
    customer_id = len(CUSTOMERS) + 1
    CUSTOMERS[customer_id] = {
        "id": customer_id,
        "company_name": data.company_name,
        "brand_name": data.brand_name,
        "industry": data.industry,
        "primary_color": data.primary_color,
        "secondary_color": data.secondary_color,
        "tone_of_voice": data.tone_of_voice,
        "created_at": datetime.utcnow().isoformat()
    }

    return CUSTOMERS[customer_id]

@app.get("/api/v1/customers")
async def get_customers():
    """Get all customers (Admin only)"""
    return list(CUSTOMERS.values())

@app.get("/api/v1/customers/{customer_id}")
async def get_customer(customer_id: int):
    """Get a specific customer"""
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CUSTOMERS[customer_id]

@app.put("/api/v1/customers/{customer_id}")
async def update_customer(customer_id: int, data: CreateCustomerRequest):
    """Update a customer (Admin only)"""
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")

    CUSTOMERS[customer_id].update({
        "company_name": data.company_name,
        "brand_name": data.brand_name,
        "industry": data.industry,
        "primary_color": data.primary_color,
        "secondary_color": data.secondary_color,
        "tone_of_voice": data.tone_of_voice,
    })

    return CUSTOMERS[customer_id]

@app.delete("/api/v1/customers/{customer_id}")
async def delete_customer(customer_id: int):
    """Delete a customer (Admin only)"""
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")

    del CUSTOMERS[customer_id]
    # Also remove all user associations
    for user_id in list(USER_CUSTOMERS.keys()):
        USER_CUSTOMERS[user_id] = [(cid, role) for cid, role in USER_CUSTOMERS[user_id] if cid != customer_id]

    return {"message": "Customer deleted successfully"}

@app.post("/api/v1/users/create-test-user")
async def create_test_user(data: CreateTestUserRequest):
    """Create a test user for testing purposes (Admin only)"""
    # Check if exists
    if data.email in USERS:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if customer exists
    if data.customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Generate a simple password
    password = "Test123!"

    # Create user
    user_id = len(USERS) + 1
    USERS[data.email] = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(password),
        "full_name": data.full_name,
        "is_super_admin": False,
        "is_verified": True,
        "avatar_url": None,
        "created_at": datetime.utcnow().isoformat()
    }

    # Associate user with customer
    if user_id not in USER_CUSTOMERS:
        USER_CUSTOMERS[user_id] = []
    USER_CUSTOMERS[user_id].append((data.customer_id, data.role))

    customer = CUSTOMERS[data.customer_id]

    return {
        "id": user_id,
        "email": data.email,
        "password": password,  # Return password for testing
        "full_name": data.full_name,
        "role": data.role,
        "customer_id": data.customer_id,
        "customer_name": customer["brand_name"],
        "message": "Test user created successfully! Use this password to login."
    }

@app.post("/api/v1/auth/login-as/{user_id}")
async def login_as_user(user_id: int):
    """Admin feature: Login as another user for testing (Admin only)"""
    # Find user by ID
    user = None
    for u in USERS.values():
        if u["id"] == user_id:
            user = u
            break

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate tokens for this user
    access_token = generate_token()
    refresh_token = generate_token()

    SESSIONS[access_token] = {
        "user_id": user["id"],
        "email": user["email"],
        "expires": (datetime.utcnow() + timedelta(hours=24)).isoformat()
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "avatar_url": user.get("avatar_url"),
            "is_super_admin": user.get("is_super_admin", False),
            "is_verified": user.get("is_verified", True)
        }
    }

@app.get("/debug/users")
async def debug_users():
    """Debug: View all users"""
    return {
        "total_users": len(USERS),
        "users": [
            {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user.get("role", "N/A"),
                "customer_name": user.get("customer_name", "N/A"),
                "is_super_admin": user["is_super_admin"]
            }
            for user in USERS.values()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
