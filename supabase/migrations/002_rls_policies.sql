-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant IDs
CREATE OR REPLACE FUNCTION get_user_tenants(user_uuid UUID)
RETURNS TABLE(tenant_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT tu.tenant_id
    FROM tenant_users tu
    WHERE tu.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to tenant
CREATE OR REPLACE FUNCTION user_has_tenant_access(user_uuid UUID, check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM tenant_users tu
        WHERE tu.user_id = user_uuid
        AND tu.tenant_id = check_tenant_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants RLS Policies
CREATE POLICY "Users can view their own tenants"
    ON tenants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenant_users tu
            WHERE tu.tenant_id = tenants.id
            AND tu.user_id = auth.uid()
        )
    );

-- Tenant Users RLS Policies
CREATE POLICY "Users can view tenant_users for their tenants"
    ON tenant_users FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

-- Users RLS Policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Brand Profiles RLS Policies
CREATE POLICY "Users can view brand profiles for their tenants"
    ON brand_profiles FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can insert brand profiles for their tenants"
    ON brand_profiles FOR INSERT
    WITH CHECK (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can update brand profiles for their tenants"
    ON brand_profiles FOR UPDATE
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

-- Content Items RLS Policies
CREATE POLICY "Users can view content items for their tenants"
    ON content_items FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can insert content items for their tenants"
    ON content_items FOR INSERT
    WITH CHECK (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can update content items for their tenants"
    ON content_items FOR UPDATE
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

-- Images RLS Policies
CREATE POLICY "Users can view images for their tenants"
    ON images FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can insert images for their tenants"
    ON images FOR INSERT
    WITH CHECK (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

-- Videos RLS Policies
CREATE POLICY "Users can view videos for their tenants"
    ON videos FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can insert videos for their tenants"
    ON videos FOR INSERT
    WITH CHECK (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

-- Scheduled Posts RLS Policies
CREATE POLICY "Users can view scheduled posts for their tenants"
    ON scheduled_posts FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can insert scheduled posts for their tenants"
    ON scheduled_posts FOR INSERT
    WITH CHECK (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can update scheduled posts for their tenants"
    ON scheduled_posts FOR UPDATE
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

-- Embeddings RLS Policies
CREATE POLICY "Users can view embeddings for their tenants"
    ON embeddings FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

CREATE POLICY "Users can insert embeddings for their tenants"
    ON embeddings FOR INSERT
    WITH CHECK (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

-- Audit Logs RLS Policies
CREATE POLICY "Users can view audit logs for their tenants"
    ON audit_logs FOR SELECT
    USING (
        user_has_tenant_access(auth.uid(), tenant_id)
    );

