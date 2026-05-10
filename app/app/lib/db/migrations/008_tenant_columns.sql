-- Migration 008: Ensure tenant_id columns required by app logic exist

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE class_memberships ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_classes_tenant_id ON classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON class_memberships(tenant_id);
