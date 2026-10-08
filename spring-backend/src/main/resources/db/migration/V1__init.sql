-- Full PostgreSQL Schema and Seed Data
DROP TABLE IF EXISTS import_jobs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS verification_history CASCADE;
DROP TABLE IF EXISTS backlinks CASCADE;
DROP TABLE IF EXISTS exchanges CASCADE;
DROP TABLE IF EXISTS client_requests CASCADE;
DROP TABLE IF EXISTS our_requests CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'executive',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  title VARCHAR(100),
  avatar_color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  reset_token VARCHAR(255),
  reset_expires_at TIMESTAMP
);

CREATE TABLE sequences (
  code VARCHAR(50) PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  niche VARCHAR(255),
  country VARCHAR(100),
  language VARCHAR(100),
  da INTEGER,
  dr INTEGER,
  organic_traffic INTEGER,
  spam_score INTEGER,
  referring_domains INTEGER,
  domain_age_years INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  internal_notes TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags TEXT DEFAULT '[]'
);
CREATE INDEX idx_domains_domain ON domains(domain);
CREATE INDEX idx_domains_status ON domains(status);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  company VARCHAR(255),
  email VARCHAR(255),
  linkedin VARCHAR(255),
  phone VARCHAR(255),
  source VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  first_contact_at VARCHAR(50),
  last_contact_at VARCHAR(50),
  next_follow_up_at VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_contacts_domain ON contacts(domain_id);

CREATE TABLE our_requests (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  our_website VARCHAR(255) NOT NULL,
  partner_domain VARCHAR(255) NOT NULL,
  partner_page VARCHAR(500),
  target_url VARCHAR(500) NOT NULL,
  anchor_text VARCHAR(255),
  link_type VARCHAR(50) NOT NULL DEFAULT 'dofollow',
  placement_type VARCHAR(50) DEFAULT 'content',
  request_date VARCHAR(50) NOT NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  domain_id INTEGER REFERENCES domains(id) ON DELETE SET NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags TEXT DEFAULT '[]'
);
CREATE INDEX idx_our_requests_status ON our_requests(status);
CREATE INDEX idx_our_requests_domain ON our_requests(domain_id);

CREATE TABLE client_requests (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  client_domain VARCHAR(255) NOT NULL,
  our_website VARCHAR(255) NOT NULL,
  our_page VARCHAR(500),
  client_target_url VARCHAR(500) NOT NULL,
  anchor_text VARCHAR(255),
  link_type VARCHAR(50) NOT NULL DEFAULT 'dofollow',
  placement_type VARCHAR(50) DEFAULT 'content',
  request_date VARCHAR(50) NOT NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  domain_id INTEGER REFERENCES domains(id) ON DELETE SET NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags TEXT DEFAULT '[]'
);
CREATE INDEX idx_client_requests_status ON client_requests(status);
CREATE INDEX idx_client_requests_domain ON client_requests(domain_id);

CREATE TABLE exchanges (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  our_request_id INTEGER REFERENCES our_requests(id) ON DELETE SET NULL,
  client_request_id INTEGER REFERENCES client_requests(id) ON DELETE SET NULL,
  partner_domain VARCHAR(255) NOT NULL,
  exchange_type VARCHAR(50) NOT NULL DEFAULT 'link_exchange',
  exchange_date VARCHAR(50) NOT NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags TEXT DEFAULT '[]'
);
CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_exchanges_domain ON exchanges(partner_domain);

CREATE TABLE backlinks (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  exchange_id INTEGER NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  side VARCHAR(20) NOT NULL,
  referring_domain VARCHAR(255) NOT NULL,
  referring_page_url VARCHAR(500) NOT NULL,
  target_url VARCHAR(500) NOT NULL,
  anchor_text VARCHAR(255),
  link_type VARCHAR(50) NOT NULL DEFAULT 'dofollow',
  placement_type VARCHAR(50) DEFAULT 'content',
  acquisition_date VARCHAR(50) NOT NULL,
  first_seen_date VARCHAR(50),
  last_verified_date VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_backlinks_exchange ON backlinks(exchange_id);
CREATE INDEX idx_backlinks_refdomain ON backlinks(referring_domain);
CREATE INDEX idx_backlinks_target ON backlinks(target_url);
CREATE INDEX idx_backlinks_status ON backlinks(status);
CREATE INDEX idx_backlinks_anchor ON backlinks(anchor_text);

CREATE TABLE verification_history (
  id SERIAL PRIMARY KEY,
  backlink_id INTEGER NOT NULL REFERENCES backlinks(id) ON DELETE CASCADE,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  result VARCHAR(50) NOT NULL,
  http_status INTEGER,
  is_dofollow INTEGER,
  backlink_found INTEGER,
  target_matches INTEGER,
  anchor_matches INTEGER,
  notes TEXT,
  details TEXT
);
CREATE INDEX idx_verif_backlink ON verification_history(backlink_id, checked_at DESC);

CREATE TABLE follow_ups (
  id SERIAL PRIMARY KEY,
  ref VARCHAR(50) UNIQUE NOT NULL,
  domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  our_request_id INTEGER REFERENCES our_requests(id) ON DELETE CASCADE,
  client_request_id INTEGER REFERENCES client_requests(id) ON DELETE CASCADE,
  exchange_id INTEGER REFERENCES exchanges(id) ON DELETE CASCADE,
  due_date VARCHAR(50) NOT NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  kind VARCHAR(50) NOT NULL DEFAULT 'contact',
  notes TEXT,
  completed_at VARCHAR(50),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_followups_due ON follow_ups(due_date);
CREATE INDEX idx_followups_status ON follow_ups(status);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_ref TEXT,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_ref);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read);

CREATE TABLE import_jobs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  total_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  invalid_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  error_report TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT
);


