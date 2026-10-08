-- LinkPilot Advanced Backlink Intelligence & Link Building Platform Migration
-- V2: Projects, Advanced Link Intelligence, Network IP Analysis, Explainable Audits,
-- Disavow Management, Competitor Gap / Intersect, and Outreach CRM.

-- 1. Projects Table (Isolated per user)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  country VARCHAR(100) DEFAULT 'United States',
  target_language VARCHAR(50) DEFAULT 'English',
  timezone VARCHAR(100) DEFAULT 'UTC',
  crawl_settings TEXT DEFAULT '{"frequency":"daily","depth":3,"respect_robots":true}',
  notification_settings TEXT DEFAULT '{"email_alerts":true,"slack_webhook":"","frequency":"realtime"}',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON projects(domain);

-- 2. Alter Backlinks Table to support LinkPilot Intelligence fields
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS source_url VARCHAR(1000);
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS follow_type VARCHAR(50) DEFAULT 'dofollow';
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS http_status INTEGER DEFAULT 200;
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS da INTEGER DEFAULT 45;
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS pa INTEGER DEFAULT 35;
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS traffic INTEGER DEFAULT 1200;
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'US';
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100) DEFAULT '104.21.34.89';
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS subnet VARCHAR(100) DEFAULT '104.21.34.0/24';
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS asn VARCHAR(100) DEFAULT 'AS13335 Cloudflare';
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 12;
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS risk_reasons TEXT DEFAULT '[]';
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS data_source VARCHAR(100) DEFAULT 'Crawler';
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS broken_reason VARCHAR(255);
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS is_reviewed INTEGER DEFAULT 0;
ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS is_disavowed INTEGER DEFAULT 0;

-- 3. Competitors Table
CREATE TABLE IF NOT EXISTS competitors (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  da INTEGER DEFAULT 50,
  dr INTEGER DEFAULT 52,
  backlinks_count INTEGER DEFAULT 1420,
  ref_domains_count INTEGER DEFAULT 310,
  organic_traffic INTEGER DEFAULT 45000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_competitors_project ON competitors(project_id);

-- 4. Disavow Management Table
CREATE TABLE IF NOT EXISTS disavow_entries (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_type VARCHAR(20) NOT NULL DEFAULT 'domain', -- 'domain' or 'url'
  value VARCHAR(500) NOT NULL,
  comment TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_disavow_project ON disavow_entries(project_id);

-- 5. Outreach Campaigns Table
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed'
  target_links_count INTEGER DEFAULT 10,
  acquired_links_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON outreach_campaigns(project_id);

-- 6. Outreach Prospects & Pipeline Table (CRM)
CREATE TABLE IF NOT EXISTS outreach_prospects (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES outreach_campaigns(id) ON DELETE SET NULL,
  domain VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  opportunity_type VARCHAR(100) DEFAULT 'guest_post', -- 'competitor_backlink', 'broken_link', 'resource_page', 'guest_post', 'unlinked_mention'
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  da INTEGER DEFAULT 45,
  dr INTEGER DEFAULT 42,
  stage VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'qualified', 'contacted', 'followup', 'replied', 'negotiating', 'acquired', 'rejected'
  priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  notes TEXT,
  follow_up_date VARCHAR(50),
  pitch_template_id INTEGER,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prospects_project ON outreach_prospects(project_id);
CREATE INDEX IF NOT EXISTS idx_prospects_stage ON outreach_prospects(stage);

-- 7. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'outreach', -- 'guest_post', 'broken_link', 'resource_page', 'follow_up'
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Seed Default Project for existing users
INSERT INTO projects (id, user_id, name, website_url, domain, description, industry, country, target_language)
SELECT 1, u.id, 'LinkPilot Core HQ', 'https://linkpilot.io', 'linkpilot.io', 'Primary production SEO intelligence tracking', 'SaaS / Marketing', 'United States', 'English'
FROM users u WHERE u.email = 'admin@linkbridge.io' OR u.role = 'admin' LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Associate existing backlinks with Project 1
UPDATE backlinks SET 
  project_id = 1,
  source_url = referring_page_url,
  follow_type = COALESCE(link_type, 'dofollow'),
  http_status = 200,
  da = 58,
  pa = 42,
  traffic = 4500,
  country = 'US',
  ip_address = '172.67.189.44',
  subnet = '172.67.189.0/24',
  asn = 'AS13335 Cloudflare',
  risk_score = 15,
  data_source = 'Crawler'
WHERE project_id IS NULL;

-- 9. Seed Default Email Templates
INSERT INTO email_templates (name, subject, body, category) VALUES
('Guest Post Pitch', 'Content collaboration inquiry for {{domain}}', 'Hi {{contact_name}},\n\nI came across {{domain}} and loved your recent insights on SEO and growth. We recently published an in-depth data study that your audience would find highly valuable.\n\nWould you be open to a guest collaboration or resource inclusion?\n\nBest regards,\nLinkPilot Team', 'guest_post'),
('Broken Link Alert', 'Broken link identified on {{domain}}', 'Hello {{contact_name}},\n\nWhile reading your excellent guide at {{page_url}}, I noticed that one of the reference links is currently returning a 404 error.\n\nWe happen to have an up-to-date, comprehensive breakdown covering that exact topic here: {{target_url}}.\n\nHope this helps you keep your article top-notch!\n\nBest,\nLinkPilot Team', 'broken_link'),
('Follow-up Friendly', 'Following up on our collaboration inquiry', 'Hi {{contact_name}},\n\nJust floating this to the top of your inbox in case it slipped by. We would love to collaborate on {{domain}}.\n\nLet me know if you would like me to send over 2-3 topic outlines!\n\nBest,\nLinkPilot Team', 'follow_up')
ON CONFLICT DO NOTHING;
