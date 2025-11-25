# Database Setup Guide

## Running the Migrations

You need to apply the database migrations to add the new settings tables. Here's how:

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   You can find your project ref in your Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

3. **Apply all migrations**:
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard (Manual)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/20250125000002_settings_system.sql`
   - `supabase/migrations/20250125000003_platform_credentials.sql`
5. Click **Run** for each file

### Option 3: Using psql (Advanced)

If you have direct database access:

```bash
psql YOUR_DATABASE_URL -f supabase/migrations/20250125000002_settings_system.sql
psql YOUR_DATABASE_URL -f supabase/migrations/20250125000003_platform_credentials.sql
```

## Verify Setup

After running the migrations, verify the tables were created:

1. Go to Supabase Dashboard > **Table Editor**
2. You should see these new tables:
   - `platform_connections`
   - `platform_credentials`
   - `user_settings`
   - `analytics_events`
   - `post_analytics`
   - `tenant_invitations`

## What These Tables Do

- **platform_credentials**: Stores OAuth API keys configured by admins (Client ID/Secret for each social platform)
- **platform_connections**: Stores actual connected social media accounts with OAuth tokens
- **user_settings**: User preferences (notifications, theme, timezone, etc.)
- **analytics_events**: Raw analytics data from social platforms
- **post_analytics**: Aggregated analytics metrics for faster queries
- **tenant_invitations**: Pending user invitations to tenants

## Troubleshooting

### "Permission Denied" Error
Make sure you're using the correct Supabase credentials with admin access.

### "Table Already Exists" Error
The migration has already been run. You can skip this step.

### "Function does not exist" Error
Make sure you run the migrations in order. The `update_updated_at_column()` function is created in the first migration.

## After Migration

1. Restart your development server (if running)
2. Navigate to Settings > Platforms in the UI
3. Click "Manage API Credentials" to configure OAuth apps
4. Add your Facebook, TikTok, LinkedIn, Google, etc. API credentials
5. Users can now connect their social accounts!
