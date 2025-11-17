# AstralAI Authentication & User Management Guide

## Overview

AstralAI now includes a complete **multi-tenant authentication system** with:
- ✅ Email/Password authentication
- ✅ SSO support (Google, Microsoft, GitHub) - Ready for implementation
- ✅ JWT-based authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Multi-customer user management
- ✅ User invitations with tokens
- ✅ Beautiful login/register pages

## User Roles & Permissions

### Role Hierarchy

1. **Super Admin** (AstralAI)
   - Manages all customers
   - Full system access
   - View all analytics

2. **Customer Admin**
   - Full access to their customer organization
   - Manage users, roles, and permissions
   - Edit organization settings
   - Manage API keys and billing

3. **Manager**
   - Manage content and campaigns
   - Invite users
   - View users
   - Cannot change roles or remove users

4. **Editor**
   - Create and edit content
   - Manage products and campaigns
   - No user management access

5. **Viewer**
   - Read-only access
   - View content, products, campaigns, analytics
   - Cannot create or edit

### Permission Matrix

| Action | Viewer | Editor | Manager | Admin | Super Admin |
|--------|--------|--------|---------|-------|-------------|
| View content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create content | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete content | ❌ | ✅ | ✅ | ✅ | ✅ |
| View users | ❌ | ❌ | ✅ | ✅ | ✅ |
| Invite users | ❌ | ❌ | ✅ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ❌ | ✅ | ✅ |
| Remove users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Edit organization | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage all customers | ❌ | ❌ | ❌ | ❌ | ✅ |

## Backend Architecture

### Models

#### 1. **User Model** (`/backend/app/models/auth.py`)
```python
class User(Base):
    id: int
    email: str
    hashed_password: str (nullable for SSO users)
    full_name: str
    avatar_url: str

    # SSO
    sso_provider: SSOProvider (email, google, microsoft, github)
    sso_id: str
    sso_data: JSON

    # Security
    is_active: bool
    is_verified: bool
    is_super_admin: bool
    two_factor_enabled: bool
    last_login: datetime
    failed_login_attempts: int
    locked_until: datetime

    # Relationships
    customers: List[Customer]  # Many-to-many
    refresh_tokens: List[RefreshToken]
    audit_logs: List[AuditLog]
```

#### 2. **Customer-User Association**
Users can belong to multiple customers with different roles:
```python
user_customers = Table(
    user_id -> users.id
    customer_id -> customers.id
    role -> UserRole (viewer, editor, manager, customer_admin)
)
```

#### 3. **RefreshToken Model**
Stores refresh tokens for JWT authentication:
```python
class RefreshToken(Base):
    token: str
    expires_at: datetime
    revoked: bool
    user_agent: str
    ip_address: str
```

#### 4. **Invitation Model**
User invitations to join customer organizations:
```python
class Invitation(Base):
    email: str
    customer_id: int
    role: UserRole
    token: str (32-char random token)
    expires_at: datetime (7 days)
    accepted: bool
```

#### 5. **AuditLog Model**
Track all user actions:
```python
class AuditLog(Base):
    user_id: int
    customer_id: int
    action: str
    resource_type: str
    details: JSON
    ip_address: str
```

### API Endpoints

#### Authentication (`/api/v1/auth`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Register new user |
| `/login` | POST | Login with email/password |
| `/logout` | POST | Logout and revoke token |
| `/refresh` | POST | Refresh access token |
| `/me` | GET | Get current user info |
| `/sso/{provider}` | POST | SSO login (placeholder) |
| `/invite` | POST | Invite user to organization |

#### User Management (`/api/v1/users`)

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/customer/{id}` | GET | List customer users | Viewer |
| `/customer/{id}/user/{uid}/role` | PUT | Change user role | Customer Admin |
| `/customer/{id}/user/{uid}` | DELETE | Remove user | Customer Admin |
| `/me/permissions` | GET | Get my permissions | Any |
| `/me/profile` | PUT | Update my profile | Any |

### Security Features

#### 1. **Password Security**
```python
# Requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

# Hashing:
- Uses bcrypt via passlib
- Automatic salting
```

#### 2. **JWT Tokens**
```python
# Access Token:
- Expires: 15 minutes
- Contains: user_id, email
- Type: "access"

# Refresh Token:
- Expires: 30 days
- Stored in database
- Can be revoked
- Type: "refresh"
```

#### 3. **Account Locking**
- 5 failed login attempts → Account locked for 30 minutes
- Reset on successful login

#### 4. **Token Refresh Flow**
```
1. Access token expires after 15 minutes
2. Client sends refresh token to /auth/refresh
3. Server validates refresh token
4. Server revokes old refresh token
5. Server issues new access + refresh tokens
```

## Frontend Implementation

### Pages

1. **Login Page** (`/app/login/page.tsx`)
   - Email/password form
   - SSO buttons (Google, Microsoft, GitHub)
   - "Remember me" option
   - Forgot password link
   - Sign up link

2. **Register Page** (`/app/register/page.tsx`)
   - Full name, email, password fields
   - Password strength indicator
   - Invitation token support
   - Terms acceptance

3. **User Management** (`/app/users/page.tsx`)
   - List users in customer
   - Invite new users
   - Change user roles
   - Remove users
   - Customer selector (multi-tenant)

### Authentication Utilities (`/lib/auth.ts`)

```typescript
// Storage
saveAuth(tokens): void
loadAuth(): AuthTokens | null
clearAuth(): void
getAccessToken(): string | null
getUser(): User | null
isAuthenticated(): boolean

// API Calls
login(email, password): Promise<AuthTokens>
register(email, password, full_name, invitation?): Promise<AuthTokens>
logout(): Promise<void>
refreshAccessToken(): Promise<AuthTokens | null>
getCurrentUser(): Promise<User | null>

// Helpers
getRoleDisplayName(role): string
getRoleColor(role): string
canPerformAction(userRole, requiredRole): boolean
```

## Usage Examples

### 1. Registration Flow

**Without Invitation (New Customer)**:
```typescript
// User registers
await register("john@company.com", "SecurePass123!", "John Doe")

// Backend creates:
// 1. New User
// 2. New Customer ("John Doe's Organization")
// 3. Assigns user as CUSTOMER_ADMIN
```

**With Invitation (Join Existing Customer)**:
```typescript
// Admin invites user
const invite = await inviteUser("jane@company.com", UserRole.EDITOR, customerId)

// Invitation email sent with token
// User registers with token
await register("jane@company.com", "SecurePass123!", "Jane Doe", inviteToken)

// Backend:
// 1. Creates user
// 2. Adds user to existing customer with EDITOR role
// 3. Marks invitation as accepted
```

### 2. Login Flow

```typescript
// User logs in
const auth = await login("john@company.com", "SecurePass123!")

// Returns:
{
  access_token: "eyJ...",
  refresh_token: "eyJ...",
  token_type: "bearer",
  user: {
    id: 1,
    email: "john@company.com",
    full_name: "John Doe",
    is_super_admin: false,
    is_verified: true
  }
}

// Tokens saved to localStorage automatically
```

### 3. Protect Routes (Frontend)

```typescript
// In a page component
useEffect(() => {
  if (!isAuthenticated()) {
    router.push("/login?redirect=" + pathname)
  }
}, [])
```

### 4. Make Authenticated API Calls

```typescript
const token = getAccessToken()

const response = await fetch("/api/v1/content", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})

// If 401, refresh token automatically
if (response.status === 401) {
  const newAuth = await refreshAccessToken()
  if (newAuth) {
    // Retry request with new token
  } else {
    // Redirect to login
  }
}
```

### 5. User Management (Admin)

```typescript
// Invite user
await inviteUser({
  email: "user@company.com",
  role: UserRole.EDITOR,
  customer_id: 1
})

// Change role
await changeUserRole(customerId, userId, UserRole.MANAGER)

// Remove user
await removeUser(customerId, userId)
```

## SSO Implementation (TODO)

The system is ready for SSO, but OAuth flows need to be implemented:

### Google OAuth
```python
# Install: google-auth-oauthlib
from google.oauth2 import id_token
from google.auth.transport import requests

# Verify Google token
idinfo = id_token.verify_oauth2_token(
    token,
    requests.Request(),
    GOOGLE_CLIENT_ID
)

# Create/login user with:
# email = idinfo['email']
# full_name = idinfo['name']
# avatar = idinfo['picture']
# sso_provider = SSOProvider.GOOGLE
# sso_id = idinfo['sub']
```

### Microsoft OAuth
```python
# Install: msal
from msal import ConfidentialClientApplication

# Acquire token
app = ConfidentialClientApplication(
    client_id=MICROSOFT_CLIENT_ID,
    client_credential=MICROSOFT_CLIENT_SECRET,
    authority=MICROSOFT_AUTHORITY
)

result = app.acquire_token_by_authorization_code(
    code, scopes=["User.Read"]
)
```

### GitHub OAuth
```python
# Exchange code for token
response = requests.post(
    "https://github.com/login/oauth/access_token",
    data={
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code
    }
)

# Get user info
user_response = requests.get(
    "https://api.github.com/user",
    headers={"Authorization": f"token {access_token}"}
)
```

## Database Migration

To create the authentication tables:

```bash
# Create migration
cd backend
alembic revision --autogenerate -m "Add authentication tables"

# Run migration
alembic upgrade head
```

## Environment Variables

Add to `.env`:

```bash
# JWT
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# SSO (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_AUTHORITY=https://login.microsoftonline.com/common

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Testing

### 1. Create Super Admin
```python
# Run this in Python shell or create a script
from app.models.auth import User
from app.core.security import get_password_hash
from app.core.database import get_db

user = User(
    email="admin@astralai.com",
    hashed_password=get_password_hash("SuperSecure123!"),
    full_name="AstralAI Admin",
    is_super_admin=True,
    is_verified=True,
    is_active=True
)
db.add(user)
db.commit()
```

### 2. Test Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "full_name": "Test User"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -F "username=test@example.com" \
  -F "password=Test123!@#"
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Rotate SECRET_KEY periodically**
3. **Enable two-factor authentication** (implement TOTP)
4. **Monitor failed login attempts**
5. **Implement rate limiting** on auth endpoints
6. **Log all authentication events**
7. **Encrypt sensitive data** in database
8. **Use secure password reset** flow
9. **Implement CSRF protection**
10. **Regular security audits**

## Next Steps

- [ ] Implement actual SSO OAuth flows
- [ ] Add email verification
- [ ] Add password reset functionality
- [ ] Implement two-factor authentication (TOTP)
- [ ] Add session management page
- [ ] Implement audit log viewer
- [ ] Add rate limiting to auth endpoints
- [ ] Create email templates for invitations
- [ ] Add user profile page
- [ ] Implement user avatar uploads

---

**Built by AstralAI** | Enterprise-Grade Authentication
