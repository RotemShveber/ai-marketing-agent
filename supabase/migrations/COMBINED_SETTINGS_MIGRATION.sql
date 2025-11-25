-- COMBINED SETTINGS SYSTEM MIGRATION
-- Run this entire file in Supabase SQL Editor
-- This combines all settings-related migrations into one file

-- ============================================
-- PART 1: Settings System Tables
-- ============================================

-- Platform Connections Table
CREATE TABLE IF NOT EXISTS platform_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_user_id VARCHAR(255),
    platform_username VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    connection_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_connections_tenant ON platform_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_user ON platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    content_ready_notifications BOOLEAN DEFAULT true,
    post_published_notifications BOOLEAN DEFAULT true,
    team_activity_notifications BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,

    theme VARCHAR(20) DEFAULT 'light',
    timezone VARCHAR(100) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',

    default_tone VARCHAR(50),
    default_platforms TEXT[],
    auto_save_drafts BOOLEAN DEFAULT true,

    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 480,

    settings_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE SET NULL,

    event_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50),
    event_value INTEGER DEFAULT 1,

    event_metadata JSONB DEFAULT '{}'::jsonb,
    external_event_id VARCHAR(255),

    user_country VARCHAR(100),
    user_age_range VARCHAR(50),
    user_gender VARCHAR(20),

    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON analytics_events(content_item_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_scheduled ON analytics_events(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform ON analytics_events(platform);

-- Post Analytics Summary Table
CREATE TABLE IF NOT EXISTS post_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,

    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,

    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    click_through_rate DECIMAL(5,2) DEFAULT 0.00,

    unique_viewers INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,

    date DATE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, scheduled_post_id, platform, date)
);

CREATE INDEX IF NOT EXISTS idx_post_analytics_tenant ON post_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_content ON post_analytics(content_item_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_date ON post_analytics(date);
CREATE INDEX IF NOT EXISTS idx_post_analytics_platform ON post_analytics(platform);

-- Tenant Invitations Table
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant ON tenant_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);

-- ============================================
-- PART 2: Platform Credentials Table
-- ============================================

CREATE TABLE IF NOT EXISTS platform_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,

    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,

    auth_url TEXT,
    token_url TEXT,
    scopes TEXT[],

    redirect_uri TEXT,
    credentials_metadata JSONB DEFAULT '{}'::jsonb,

    is_active BOOLEAN DEFAULT true,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(50),
    test_error_message TEXT,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_credentials_tenant ON platform_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_credentials_platform ON platform_credentials(platform);

-- ============================================
-- PART 3: Triggers and Functions
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_platform_connections_updated_at ON platform_connections;
CREATE TRIGGER update_platform_connections_updated_at
    BEFORE UPDATE ON platform_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_credentials_updated_at ON platform_credentials;
CREATE TRIGGER update_platform_credentials_updated_at
    BEFORE UPDATE ON platform_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit logging for credential changes
CREATE OR REPLACE FUNCTION log_credential_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
        VALUES (
            NEW.tenant_id,
            auth.uid(),
            'platform_credentials_created',
            'platform_credentials',
            NEW.id,
            jsonb_build_object('platform', NEW.platform)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
        VALUES (
            NEW.tenant_id,
            auth.uid(),
            'platform_credentials_updated',
            'platform_credentials',
            NEW.id,
            jsonb_build_object('platform', NEW.platform)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
        VALUES (
            OLD.tenant_id,
            auth.uid(),
            'platform_credentials_deleted',
            'platform_credentials',
            OLD.id,
            jsonb_build_object('platform', OLD.platform)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS platform_credentials_audit ON platform_credentials;
CREATE TRIGGER platform_credentials_audit
    AFTER INSERT OR UPDATE OR DELETE ON platform_credentials
    FOR EACH ROW
    EXECUTE FUNCTION log_credential_changes();

-- ============================================
-- PART 4: Row Level Security Policies
-- ============================================

-- Platform Connections RLS
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view platform connections in their tenants" ON platform_connections;
CREATE POLICY "Users can view platform connections in their tenants"
    ON platform_connections FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage platform connections in their tenants" ON platform_connections;
CREATE POLICY "Users can manage platform connections in their tenants"
    ON platform_connections FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- User Settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings"
    ON user_settings FOR ALL
    USING (user_id = auth.uid());

-- Analytics Events RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view analytics in their tenants" ON analytics_events;
CREATE POLICY "Users can view analytics in their tenants"
    ON analytics_events FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert analytics events" ON analytics_events;
CREATE POLICY "System can insert analytics events"
    ON analytics_events FOR INSERT
    WITH CHECK (true);

-- Post Analytics RLS
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view post analytics in their tenants" ON post_analytics;
CREATE POLICY "Users can view post analytics in their tenants"
    ON post_analytics FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- Tenant Invitations RLS
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invitations in their tenants" ON tenant_invitations;
CREATE POLICY "Users can view invitations in their tenants"
    ON tenant_invitations FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage invitations" ON tenant_invitations;
CREATE POLICY "Admins can manage invitations"
    ON tenant_invitations FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Platform Credentials RLS
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view platform credentials" ON platform_credentials;
CREATE POLICY "Admins can view platform credentials"
    ON platform_credentials FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Admins can manage platform credentials" ON platform_credentials;
CREATE POLICY "Admins can manage platform credentials"
    ON platform_credentials FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Settings system migration completed successfully!';
    RAISE NOTICE 'Tables created: platform_connections, user_settings, analytics_events, post_analytics, tenant_invitations, platform_credentials';
    RAISE NOTICE 'You can now use the Settings page in your application.';
END $$;
