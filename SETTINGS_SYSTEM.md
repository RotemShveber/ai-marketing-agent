# Settings System Documentation

This document provides a comprehensive overview of the Settings System implemented for the AI Marketing Agent SaaS Platform.

## Overview

The Settings System provides a complete solution for managing:
- **User Management**: Invite, manage roles, and remove team members
- **Analytics Dashboard**: Track content performance across all platforms
- **Platform Connections**: OAuth integration with social media platforms
- **Account Settings**: Personal profile, notifications, and preferences

## Architecture

### Database Schema

The system adds 5 new tables to support settings functionality:

#### 1. `platform_connections`
Stores OAuth credentials and connection status for social media platforms.

```sql
- id: UUID (PK)
- tenant_id: UUID (FK to tenants)
- user_id: UUID (FK to users)
- platform: VARCHAR(50) - Platform name (instagram, facebook, tiktok, linkedin, youtube, google_ads)
- platform_user_id: VARCHAR(255) - Platform's user ID
- platform_username: VARCHAR(255) - Display name/handle
- access_token: TEXT - Encrypted OAuth token
- refresh_token: TEXT - Encrypted refresh token
- token_expires_at: TIMESTAMP
- scopes: TEXT[] - Granted OAuth scopes
- is_active: BOOLEAN
- last_sync_at: TIMESTAMP
- connection_metadata: JSONB
- created_at, updated_at: TIMESTAMP
```

#### 2. `user_settings`
Stores user-specific preferences and settings.

```sql
- id: UUID (PK)
- user_id: UUID (FK to users) UNIQUE
- tenant_id: UUID (FK to tenants)
- email_notifications: BOOLEAN
- push_notifications: BOOLEAN
- content_ready_notifications: BOOLEAN
- post_published_notifications: BOOLEAN
- team_activity_notifications: BOOLEAN
- weekly_digest: BOOLEAN
- theme: VARCHAR(20) - 'light', 'dark', 'auto'
- timezone: VARCHAR(100)
- language: VARCHAR(10)
- default_tone: VARCHAR(50)
- default_platforms: TEXT[]
- auto_save_drafts: BOOLEAN
- two_factor_enabled: BOOLEAN
- session_timeout_minutes: INTEGER
- settings_metadata: JSONB
- created_at, updated_at: TIMESTAMP
```

#### 3. `analytics_events`
Tracks content performance and engagement metrics.

```sql
- id: UUID (PK)
- tenant_id: UUID (FK to tenants)
- content_item_id: UUID (FK to content_items)
- scheduled_post_id: UUID (FK to scheduled_posts)
- event_type: VARCHAR(50) - 'view', 'like', 'comment', 'share', 'click', 'impression'
- platform: VARCHAR(50)
- event_value: INTEGER
- event_metadata: JSONB
- external_event_id: VARCHAR(255)
- user_country, user_age_range, user_gender: VARCHAR
- event_timestamp: TIMESTAMP
- created_at: TIMESTAMP
```

#### 4. `post_analytics`
Pre-aggregated analytics for faster queries.

```sql
- id: UUID (PK)
- tenant_id: UUID (FK to tenants)
- content_item_id: UUID (FK to content_items)
- scheduled_post_id: UUID (FK to scheduled_posts)
- platform: VARCHAR(50)
- views, likes, comments, shares, clicks, impressions: INTEGER
- unique_viewers, reach: INTEGER
- engagement_rate, click_through_rate: DECIMAL(5,2)
- date: DATE
- last_updated, created_at: TIMESTAMP
```

#### 5. `tenant_invitations`
For inviting new users to tenants.

```sql
- id: UUID (PK)
- tenant_id: UUID (FK to tenants)
- invited_by: UUID (FK to users)
- email: VARCHAR(255)
- role: VARCHAR(50) - 'admin', 'member', 'viewer'
- token: VARCHAR(255) UNIQUE
- expires_at: TIMESTAMP
- accepted_at: TIMESTAMP
- created_at: TIMESTAMP
```

### Security

All tables implement Row Level Security (RLS) policies:
- Users can only access data for tenants they belong to
- Admin/Owner roles required for sensitive operations
- Token-based invitation system with expiration
- Audit logs for all critical actions

## API Endpoints

### User Management

#### GET `/api/settings/users`
List all users in a tenant.

**Query Parameters:**
- `tenantId` (required): UUID of the tenant

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "role": "admin",
      "joined_at": "2025-01-25T00:00:00Z"
    }
  ]
}
```

#### POST `/api/settings/users/invite`
Invite a user to join the tenant.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "email": "newuser@example.com",
  "role": "member"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "newuser@example.com",
    "role": "member",
    "expires_at": "2025-02-01T00:00:00Z",
    "invitation_url": "https://app.com/invite/token"
  }
}
```

#### PATCH `/api/settings/users/role`
Update a user's role.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "userId": "uuid",
  "newRole": "admin"
}
```

#### DELETE `/api/settings/users`
Remove a user from the tenant.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "userId": "uuid"
}
```

### Analytics

#### GET `/api/settings/analytics`
Get analytics overview for a tenant.

**Query Parameters:**
- `tenantId` (required): UUID of the tenant
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `platform` (optional): Filter by platform

**Response:**
```json
{
  "totals": {
    "views": 10000,
    "likes": 500,
    "comments": 100,
    "shares": 50,
    "clicks": 200,
    "impressions": 15000,
    "reach": 8000
  },
  "averages": {
    "engagement_rate": 4.33,
    "click_through_rate": 1.33
  },
  "by_platform": [
    {
      "platform": "instagram",
      "views": 5000,
      "likes": 300,
      "posts_count": 10
    }
  ],
  "records": []
}
```

#### POST `/api/settings/analytics`
Record an analytics event (for webhook integrations).

**Request Body:**
```json
{
  "tenantId": "uuid",
  "scheduledPostId": "uuid",
  "eventType": "like",
  "platform": "instagram",
  "eventValue": 1,
  "eventMetadata": {}
}
```

#### GET `/api/settings/analytics/top-posts`
Get top performing posts.

**Query Parameters:**
- `tenantId` (required): UUID of the tenant
- `metric` (optional): Metric to sort by (default: engagement_rate)
- `limit` (optional): Number of posts to return (default: 10)
- `platform` (optional): Filter by platform
- `startDate`, `endDate` (optional): Date range

### Platform Connections

#### GET `/api/settings/platforms`
List connected platforms.

**Query Parameters:**
- `tenantId` (required): UUID of the tenant

**Response:**
```json
{
  "connections": [
    {
      "id": "uuid",
      "platform": "instagram",
      "platform_user_id": "123456",
      "platform_username": "myaccount",
      "is_active": true,
      "is_expired": false,
      "last_sync_at": "2025-01-25T00:00:00Z",
      "token_expires_at": "2025-03-01T00:00:00Z",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/settings/platforms/oauth-url`
Get OAuth authorization URL for a platform.

**Request Body:**
```json
{
  "platform": "instagram",
  "redirectUri": "https://app.com/api/oauth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "oauth_url": "https://facebook.com/oauth/...",
  "platform": "instagram"
}
```

#### POST `/api/settings/platforms/connect`
Connect a platform via OAuth (called after OAuth callback).

**Request Body:**
```json
{
  "tenantId": "uuid",
  "platform": "instagram",
  "code": "oauth_authorization_code",
  "redirectUri": "https://app.com/api/oauth/callback"
}
```

#### DELETE `/api/settings/platforms`
Disconnect a platform.

**Request Body:**
```json
{
  "tenantId": "uuid",
  "connectionId": "uuid"
}
```

### User Preferences

#### GET `/api/settings/preferences`
Get user preferences (creates defaults if not exists).

**Response:**
```json
{
  "settings": {
    "email_notifications": true,
    "push_notifications": true,
    "content_ready_notifications": true,
    "post_published_notifications": true,
    "team_activity_notifications": false,
    "weekly_digest": true,
    "theme": "light",
    "timezone": "UTC",
    "language": "en",
    "auto_save_drafts": true,
    "two_factor_enabled": false,
    "session_timeout_minutes": 480
  }
}
```

#### PATCH `/api/settings/preferences`
Update user preferences.

**Request Body:** (all fields optional)
```json
{
  "email_notifications": false,
  "theme": "dark",
  "timezone": "America/New_York"
}
```

### Profile

#### GET `/api/settings/profile`
Get user profile.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://..."
  },
  "tenants": [
    {
      "id": "uuid",
      "name": "My Company",
      "slug": "my-company",
      "role": "owner"
    }
  ]
}
```

#### PATCH `/api/settings/profile`
Update user profile.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "avatar_url": "https://..."
}
```

## Frontend Components

### Settings Page Structure

```
/dashboard/[tenantId]/settings
└── SettingsContent (Main container with tabs)
    ├── AccountSettings (Profile, notifications, preferences, security)
    ├── UserManagement (Team member management)
    ├── AnalyticsDashboard (Performance metrics)
    └── PlatformConnections (Social media OAuth)
```

### Component Details

#### `SettingsContent`
Main container with tabbed navigation between different settings sections.

**Props:**
- `tenantId: string` - Current tenant ID

**Features:**
- Tab navigation (Account, Team, Analytics, Platforms, Notifications)
- Responsive design
- Gradient UI theme

#### `AccountSettings`
Manage user profile, notifications, display preferences, and security settings.

**Sections:**
1. **Profile**: Email, full name, avatar URL
2. **Notifications**: Email and push notification preferences
3. **Preferences**: Theme, timezone, language, content defaults
4. **Security**: 2FA, session timeout, danger zone

#### `UserManagement`
Invite and manage team members with role-based access control.

**Features:**
- View all team members with roles
- Invite new members via email
- Update user roles (admin, member, viewer)
- Remove team members
- View pending invitations
- Role-based permissions enforcement

#### `AnalyticsDashboard`
View content performance metrics and analytics.

**Features:**
- Key metrics cards (views, likes, engagement rate, CTR)
- Date range filtering (7d, 30d, 90d)
- Platform filtering
- Performance by platform breakdown
- Engagement breakdown
- Top performing posts with detailed metrics

#### `PlatformConnections`
Connect and manage social media platform integrations.

**Features:**
- Grid view of all supported platforms
- OAuth connection flow
- Connection status indicators
- Disconnect functionality
- Token expiration warnings
- Setup instructions for OAuth credentials

## OAuth Integration

### Supported Platforms

1. **Instagram / Facebook** - Via Facebook OAuth
2. **TikTok** - TikTok OAuth
3. **LinkedIn** - LinkedIn OAuth 2.0
4. **YouTube** - Google OAuth
5. **Google Ads** - Google Ads API OAuth

### Setup Instructions

Add these environment variables to `.env.local`:

```env
# Facebook (for Instagram and Facebook)
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Google (for YouTube)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Google Ads
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
```

### OAuth Flow

1. User clicks "Connect" on a platform
2. Frontend calls `/api/settings/platforms/oauth-url` to get OAuth URL
3. OAuth URL opens in popup window
4. User authorizes app on platform
5. Platform redirects to callback URL with authorization code
6. Frontend calls `/api/settings/platforms/connect` with code
7. Backend exchanges code for access token
8. Token stored encrypted in database
9. Connection appears as active in UI

### Implementing OAuth Exchange

The current implementation includes placeholders for OAuth token exchange. To complete the integration:

1. **Implement token exchange** in `/app/api/settings/platforms/connect/route.ts`:
   - Exchange authorization code for access token
   - Store tokens securely (consider encryption)
   - Handle token refresh logic

2. **Create OAuth callback route** at `/app/api/oauth/callback/route.ts`:
   - Receive authorization code from platform
   - Validate state parameter
   - Send message to parent window with result

3. **Implement token refresh**:
   - Create scheduled job to refresh expiring tokens
   - Update tokens before they expire
   - Handle refresh token rotation

## Usage Examples

### Inviting a Team Member

```typescript
const response = await fetch('/api/settings/users/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    email: 'newmember@example.com',
    role: 'member'
  })
})

const data = await response.json()
console.log('Invitation URL:', data.invitation.invitation_url)
```

### Recording Analytics Event

```typescript
// From webhook or scheduled job
await fetch('/api/settings/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    scheduledPostId: 'post-uuid',
    eventType: 'like',
    platform: 'instagram',
    eventValue: 1
  })
})
```

### Getting Analytics Data

```typescript
const params = new URLSearchParams({
  tenantId: 'tenant-uuid',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  platform: 'instagram'
})

const response = await fetch(`/api/settings/analytics?${params}`)
const data = await response.json()

console.log('Total views:', data.totals.views)
console.log('Engagement rate:', data.averages.engagement_rate)
```

## Next Steps

To fully complete the settings system:

1. **Implement OAuth callbacks** - Complete the OAuth flow for each platform
2. **Add email service** - Send invitation emails using a service like SendGrid or AWS SES
3. **Token encryption** - Encrypt access tokens before storing in database
4. **Webhook handlers** - Create endpoints to receive analytics data from platforms
5. **Token refresh job** - Implement automated token refresh before expiration
6. **Charts library** - Add charts/graphs to analytics dashboard (e.g., Chart.js, Recharts)
7. **Export functionality** - Allow users to export analytics data as CSV/PDF
8. **Audit log viewer** - Create UI to view audit logs
9. **Billing integration** - Add billing/subscription management (Stripe)
10. **Advanced permissions** - Implement granular permissions system

## File Structure

```
├── supabase/migrations/
│   └── 20250125000002_settings_system.sql
├── app/
│   ├── api/settings/
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   ├── role/route.ts
│   │   │   └── invite/route.ts
│   │   ├── analytics/
│   │   │   ├── route.ts
│   │   │   └── top-posts/route.ts
│   │   ├── platforms/
│   │   │   ├── route.ts
│   │   │   ├── connect/route.ts
│   │   │   └── oauth-url/route.ts
│   │   ├── preferences/route.ts
│   │   └── profile/route.ts
│   └── dashboard/[tenantId]/settings/
│       └── page.tsx
└── components/dashboard/
    ├── SettingsContent.tsx
    └── settings/
        ├── AccountSettings.tsx
        ├── UserManagement.tsx
        ├── AnalyticsDashboard.tsx
        └── PlatformConnections.tsx
```

## Testing

Before deploying to production:

1. **Run database migration**:
   ```bash
   # Using Supabase CLI
   supabase db reset
   ```

2. **Test user management**:
   - Invite a user
   - Update roles
   - Remove users
   - Verify RLS policies

3. **Test analytics**:
   - Record test events
   - Verify aggregation
   - Test date range filtering

4. **Test OAuth flow**:
   - Configure OAuth credentials
   - Test connection flow
   - Verify token storage

5. **Test preferences**:
   - Update settings
   - Verify persistence
   - Test default creation

## Troubleshooting

### Database Issues
- Ensure migration has been applied
- Check RLS policies are not blocking queries
- Verify foreign key relationships

### OAuth Issues
- Verify environment variables are set
- Check redirect URIs match OAuth app configuration
- Ensure popup blockers are disabled

### API Errors
- Check authentication is working
- Verify tenant access permissions
- Review server logs for detailed errors

## Support

For questions or issues with the settings system, please refer to:
- Database schema: `supabase/migrations/20250125000002_settings_system.sql`
- API documentation: This file
- Component code: `components/dashboard/settings/`
