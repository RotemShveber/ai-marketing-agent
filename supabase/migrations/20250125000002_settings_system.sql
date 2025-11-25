-- Settings System Migration
-- Adds tables for platform connections, user settings, and analytics

-- Platform Connections Table
-- Stores OAuth credentials and connection status for social media platforms
CREATE TABLE platform_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_ads'
    platform_user_id VARCHAR(255), -- Platform's user ID
    platform_username VARCHAR(255), -- Display name/handle
    access_token TEXT, -- Encrypted OAuth token
    refresh_token TEXT, -- Encrypted refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[], -- Granted OAuth scopes
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    connection_metadata JSONB DEFAULT '{}'::jsonb, -- Additional platform-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, platform, platform_user_id)
);

CREATE INDEX idx_platform_connections_tenant ON platform_connections(tenant_id);
CREATE INDEX idx_platform_connections_user ON platform_connections(user_id);
CREATE INDEX idx_platform_connections_platform ON platform_connections(platform);

-- User Settings Table
-- Stores user-specific preferences and settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    content_ready_notifications BOOLEAN DEFAULT true,
    post_published_notifications BOOLEAN DEFAULT true,
    team_activity_notifications BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,

    -- Display Preferences
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
    timezone VARCHAR(100) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',

    -- Content Preferences
    default_tone VARCHAR(50),
    default_platforms TEXT[], -- Default selected platforms
    auto_save_drafts BOOLEAN DEFAULT true,

    -- Privacy & Security
    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours

    -- Other Settings
    settings_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);

-- Analytics Events Table
-- Tracks content performance and engagement metrics
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE SET NULL,

    event_type VARCHAR(50) NOT NULL, -- 'view', 'like', 'comment', 'share', 'click', 'impression'
    platform VARCHAR(50), -- Platform where event occurred
    event_value INTEGER DEFAULT 1, -- Numeric value (e.g., view count)

    -- Event Metadata
    event_metadata JSONB DEFAULT '{}'::jsonb, -- Additional event data
    external_event_id VARCHAR(255), -- Platform's event ID

    -- User Demographics (if available)
    user_country VARCHAR(100),
    user_age_range VARCHAR(50),
    user_gender VARCHAR(20),

    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_content ON analytics_events(content_item_id);
CREATE INDEX idx_analytics_events_scheduled ON analytics_events(scheduled_post_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(event_timestamp);
CREATE INDEX idx_analytics_events_platform ON analytics_events(platform);

-- Post Analytics Summary Table
-- Pre-aggregated analytics for faster queries
CREATE TABLE post_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,

    -- Engagement Metrics
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,

    -- Calculated Metrics
    engagement_rate DECIMAL(5,2) DEFAULT 0.00, -- (likes + comments + shares) / impressions * 100
    click_through_rate DECIMAL(5,2) DEFAULT 0.00, -- clicks / impressions * 100

    -- Reach & Audience
    unique_viewers INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,

    date DATE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, scheduled_post_id, platform, date)
);

CREATE INDEX idx_post_analytics_tenant ON post_analytics(tenant_id);
CREATE INDEX idx_post_analytics_content ON post_analytics(content_item_id);
CREATE INDEX idx_post_analytics_date ON post_analytics(date);
CREATE INDEX idx_post_analytics_platform ON post_analytics(platform);

-- Tenant Invitations Table
-- For inviting new users to tenants
CREATE TABLE tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

CREATE INDEX idx_tenant_invitations_tenant ON tenant_invitations(tenant_id);
CREATE INDEX idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX idx_tenant_invitations_token ON tenant_invitations(token);

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_platform_connections_updated_at
    BEFORE UPDATE ON platform_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Platform Connections RLS
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view platform connections in their tenants"
    ON platform_connections FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

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

CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own settings"
    ON user_settings FOR ALL
    USING (user_id = auth.uid());

-- Analytics Events RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics in their tenants"
    ON analytics_events FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert analytics events"
    ON analytics_events FOR INSERT
    WITH CHECK (true); -- Allow system to insert, we'll validate in application

-- Post Analytics RLS
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view post analytics in their tenants"
    ON post_analytics FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    );

-- Tenant Invitations RLS
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations in their tenants"
    ON tenant_invitations FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins can manage invitations"
    ON tenant_invitations FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Comments
COMMENT ON TABLE platform_connections IS 'Stores OAuth connections to social media platforms';
COMMENT ON TABLE user_settings IS 'User-specific preferences and settings';
COMMENT ON TABLE analytics_events IS 'Raw analytics events from social media platforms';
COMMENT ON TABLE post_analytics IS 'Aggregated analytics data for posts';
COMMENT ON TABLE tenant_invitations IS 'Pending invitations for users to join tenants';
