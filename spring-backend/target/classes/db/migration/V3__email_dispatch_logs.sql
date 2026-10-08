-- LinkPilot Email System Migration
-- V3: Email dispatch logs for transactional & outreach emails

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'sent', -- 'sent', 'queued', 'failed'
  email_type VARCHAR(100) NOT NULL DEFAULT 'system', -- 'password_reset', 'verification', 'outreach', 'alert'
  metadata TEXT,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
