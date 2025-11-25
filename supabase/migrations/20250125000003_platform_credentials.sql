-- Platform API Credentials Table
-- Allows tenants to configure their own OAuth apps for each platform

CREATE TABLE platform_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_ads'

    -- OAuth Configuration
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL, -- Should be encrypted in production

    -- OAuth URLs (optional overrides)
    auth_url TEXT,
    token_url TEXT,
    scopes TEXT[], -- Default scopes for this platform

    -- Additional Configuration
    redirect_uri TEXT, -- Custom redirect URI if needed
    credentials_metadata JSONB DEFAULT '{}'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(50), -- 'success', 'failed', null
    test_error_message TEXT,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One set of credentials per platform per tenant
    UNIQUE(tenant_id, platform)
);

CREATE INDEX idx_platform_credentials_tenant ON platform_credentials(tenant_id);
CREATE INDEX idx_platform_credentials_platform ON platform_credentials(platform);

-- Updated_at trigger
CREATE TRIGGER update_platform_credentials_updated_at
    BEFORE UPDATE ON platform_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view credentials
CREATE POLICY "Admins can view platform credentials"
    ON platform_credentials FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Only owners and admins can manage credentials
CREATE POLICY "Admins can manage platform credentials"
    ON platform_credentials FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

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

CREATE TRIGGER platform_credentials_audit
    AFTER INSERT OR UPDATE OR DELETE ON platform_credentials
    FOR EACH ROW
    EXECUTE FUNCTION log_credential_changes();

COMMENT ON TABLE platform_credentials IS 'Stores OAuth API credentials configured by tenants for each platform';
