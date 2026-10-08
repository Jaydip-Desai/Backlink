-- LinkPilot V4: Role-Based Architecture, Organizations, User Profiles, and Invitations

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(100) DEFAULT 'business', -- 'business', 'agency', 'consultant', 'enterprise'
    industry VARCHAR(100),
    company_size VARCHAR(50),
    website VARCHAR(500),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    country VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'UTC',
    preferred_language VARCHAR(50) DEFAULT 'English',
    job_title VARCHAR(150),
    experience_level VARCHAR(50),
    specialization VARCHAR(255),
    primary_responsibilities TEXT,
    outreach_email VARCHAR(255),
    sender_name VARCHAR(255),
    sender_company VARCHAR(255),
    sender_website VARCHAR(500),
    default_signature TEXT,
    target_industries TEXT,
    agency_services TEXT,
    client_count INTEGER DEFAULT 0,
    agency_team_size VARCHAR(50),
    primary_seo_goal VARCHAR(255),
    monthly_link_goal INTEGER DEFAULT 10,
    notification_preferences TEXT,
    profile_completion_pct INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_invitations (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    inviter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON workspace_invitations(email);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- Default organization for existing admin if present
INSERT INTO organizations (id, name, org_type, industry, website, created_at)
SELECT 1, 'LinkPilot HQ', 'agency', 'SaaS / Marketing', 'https://linkpilot.io', CURRENT_TIMESTAMP
ON CONFLICT (id) DO NOTHING;

INSERT INTO organization_members (organization_id, user_id, role)
SELECT 1, u.id, u.role FROM users u WHERE u.id = 1
ON CONFLICT (organization_id, user_id) DO NOTHING;

UPDATE projects SET organization_id = 1 WHERE organization_id IS NULL;
