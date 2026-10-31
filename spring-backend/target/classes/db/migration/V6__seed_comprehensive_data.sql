-- V6: Comprehensive Seed Data & Sequence Synchronization across all Projects and Modules

-- 1. Synchronize PostgreSQL SERIAL sequences to prevent primary key collisions
SELECT setval(pg_get_serial_sequence('competitors', 'id'), COALESCE((SELECT MAX(id) FROM competitors), 1), true);
SELECT setval(pg_get_serial_sequence('domains', 'id'), COALESCE((SELECT MAX(id) FROM domains), 1), true);
SELECT setval(pg_get_serial_sequence('backlinks', 'id'), COALESCE((SELECT MAX(id) FROM backlinks), 1), true);
SELECT setval(pg_get_serial_sequence('outreach_campaigns', 'id'), COALESCE((SELECT MAX(id) FROM outreach_campaigns), 1), true);
SELECT setval(pg_get_serial_sequence('outreach_prospects', 'id'), COALESCE((SELECT MAX(id) FROM outreach_prospects), 1), true);
SELECT setval(pg_get_serial_sequence('disavow_entries', 'id'), COALESCE((SELECT MAX(id) FROM disavow_entries), 1), true);

-- 2. Link all users to organization 1 and ensure projects belong to organization 1
UPDATE projects SET organization_id = 1 WHERE organization_id IS NULL;
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 1, u.id, u.role FROM users u
WHERE NOT EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = 1 AND om.user_id = u.id);

-- 3. Add high-authority & niche Domains
INSERT INTO domains (ref, domain, website_url, niche, country, language, da, dr, organic_traffic, spam_score, referring_domains, domain_age_years, status, internal_notes, assigned_to, added_by, tags)
SELECT * FROM (VALUES
  ('DOM-0013', 'searchenginejournal.com', 'https://www.searchenginejournal.com', 'SEO & Marketing', 'US', 'en', 89, 88, 1950000, 1, 64200, 21, 'active', 'Tier-1 SEO editorial publication', 1, 1, '["seo","editorial","tier1"]'),
  ('DOM-0014', 'ahrefs.com', 'https://ahrefs.com/blog', 'SEO & SaaS', 'SG', 'en', 90, 91, 2800000, 1, 89000, 14, 'active', 'High-authority SEO intelligence blog', 2, 1, '["seo","saas","authority"]'),
  ('DOM-0015', 'backlinko.com', 'https://backlinko.com', 'SEO & Content', 'US', 'en', 84, 86, 980000, 1, 41200, 12, 'active', 'Definitive SEO guides & link studies', 1, 1, '["seo","guides"]'),
  ('DOM-0016', 'contentmarketinginstitute.com', 'https://contentmarketinginstitute.com', 'Content Marketing', 'US', 'en', 85, 84, 720000, 1, 35800, 15, 'active', 'Enterprise content marketing authority', 3, 1, '["content","b2b"]'),
  ('DOM-0017', 'martech.org', 'https://martech.org', 'Marketing Technology', 'US', 'en', 82, 81, 540000, 2, 28400, 14, 'active', 'MarTech stack & analytics publication', 2, 1, '["martech","saas"]'),
  ('DOM-0018', 'finextra.com', 'https://www.finextra.com', 'Finance & FinTech', 'UK', 'en', 79, 78, 610000, 2, 22100, 24, 'active', 'Global FinTech news & community', 4, 1, '["fintech","finance"]'),
  ('DOM-0019', 'hackernoon.com', 'https://hackernoon.com', 'Technology & Dev', 'US', 'en', 86, 85, 2100000, 2, 54000, 9, 'active', 'Developer & startup engineering stories', 1, 1, '["tech","dev","startup"]'),
  ('DOM-0020', 'indiehackers.com', 'https://www.indiehackers.com', 'SaaS & Startups', 'US', 'en', 80, 82, 890000, 1, 29500, 8, 'active', 'Founder & SaaS growth community', 2, 1, '["saas","founders"]')
) AS v(ref, domain, website_url, niche, country, language, da, dr, organic_traffic, spam_score, referring_domains, domain_age_years, status, internal_notes, assigned_to, added_by, tags)
WHERE NOT EXISTS (SELECT 1 FROM domains d WHERE d.ref = v.ref OR d.domain = v.domain);

-- 4. Ensure existing backlinks have realistic stale last_verified_date on several rows so Verification Queue is populated
UPDATE backlinks SET last_verified_date = '2026-10-12' WHERE ref IN ('BL-0001', 'BL-0003', 'BL-0005', 'BL-0008', 'BL-0011', 'BL-0014', 'BL-0016');

-- 5. Insert New, Broken, Lost, and Project 2 Backlinks so every filter & project has rich records
INSERT INTO backlinks (ref, exchange_id, side, referring_domain, referring_page_url, target_url, anchor_text, link_type, placement_type, acquisition_date, first_seen_date, last_verified_date, status, assigned_to, notes, created_by, project_id, source_url, follow_type, http_status, da, pa, traffic, country, ip_address, subnet, asn, risk_score, broken_reason)
SELECT * FROM (VALUES
  ('BL-0020', 1, 'our', 'searchenginejournal.com', 'https://www.searchenginejournal.com/enterprise-link-building-2026/', 'https://linkpilot.io/features/intelligence', 'enterprise backlink intelligence', 'dofollow', 'editorial', '2026-10-29', '2026-10-29', '2026-10-15', 'new', 1, 'Newly discovered editorial placement', 1, 1, 'https://www.searchenginejournal.com/enterprise-link-building-2026/', 'dofollow', 200, 89, 76, 145000, 'US', '104.26.10.22', '104.26.10.0/24', 'AS13335 Cloudflare', 4, NULL),
  ('BL-0021', 2, 'our', 'backlinko.com', 'https://backlinko.com/seo-tools-guide', 'https://linkpilot.io/audit', 'LinkPilot Backlink Audit', 'dofollow', 'resource_page', '2026-10-30', '2026-10-30', '2026-10-14', 'new', 2, 'Added to Definitive SEO Tools list', 1, 1, 'https://backlinko.com/seo-tools-guide', 'dofollow', 200, 84, 79, 98000, 'US', '172.67.74.11', '172.67.74.0/24', 'AS13335 Cloudflare', 3, NULL),
  ('BL-0022', 3, 'our', 'hackernoon.com', 'https://hackernoon.com/automated-seo-telemetry-architecture', 'https://linkpilot.io/api-docs', 'automated backlink verification API', 'dofollow', 'guest_post', '2026-10-30', '2026-10-30', NULL, 'new', 1, 'Featured engineering post', 1, 1, 'https://hackernoon.com/automated-seo-telemetry-architecture', 'dofollow', 200, 86, 72, 64000, 'US', '76.76.21.21', '76.76.21.0/24', 'AS16509 Amazon-02', 6, NULL),
  ('BL-0023', 4, 'our', 'old-tech-directory.net', 'https://old-tech-directory.net/tools/seo-2024', 'https://linkpilot.io/legacy-audit', 'seo backlink checker tool', 'dofollow', 'directory', '2026-08-12', '2026-08-12', '2026-10-28', 'broken', 2, 'Publisher page returns 404 Not Found', 1, 1, 'https://old-tech-directory.net/tools/seo-2024', 'dofollow', 404, 34, 28, 1200, 'DE', '185.199.108.153', '185.199.108.0/24', 'AS54113 Fastly', 48, 'HTTP 404 Not Found'),
  ('BL-0024', 5, 'our', 'martech.org', 'https://martech.org/legacy-2025-stack-guide', 'https://linkpilot.io/integrations', 'GSC backlink integration', 'nofollow', 'editorial', '2026-09-05', '2026-09-05', '2026-10-29', 'broken', 3, 'Publisher server 502 gateway timeout', 1, 1, 'https://martech.org/legacy-2025-stack-guide', 'nofollow', 502, 82, 68, 42000, 'US', '151.101.1.69', '151.101.1.0/24', 'AS54113 Fastly', 18, 'HTTP 502 Bad Gateway'),
  ('BL-0025', 6, 'our', 'free-casino-download.xyz', 'https://free-casino-download.xyz/cheap-links-list', 'https://linkpilot.io/', 'cheap seo backlinks fast', 'dofollow', 'directory', '2026-10-01', '2026-10-01', '2026-10-25', 'live', 1, 'Flagged toxic spam link', 1, 1, 'https://free-casino-download.xyz/cheap-links-list', 'sponsored', 200, 9, 11, 80, 'RU', '185.220.101.4', '185.220.101.0/24', 'AS205100 F3Netze', 88, NULL),
  ('BL-0026', 7, 'our', 'auto-directory-bot.top', 'https://auto-directory-bot.top/links/page-99', 'https://linkpilot.io/', 'free backlink generator', 'nofollow', 'comment', '2026-10-03', '2026-10-03', '2026-10-26', 'live', 1, 'Automated scraper farm', 1, 1, 'https://auto-directory-bot.top/links/page-99', 'ugc', 200, 11, 14, 120, 'CN', '185.220.101.9', '185.220.101.0/24', 'AS205100 F3Netze', 79, NULL),
  ('BL-0027', 8, 'our', 'indiehackers.com', 'https://www.indiehackers.com/post/scaling-b2b-seo-in-2026', 'https://linkpilot.io/crm', 'LinkPilot Outreach CRM', 'ugc', 'forum', '2026-10-18', '2026-10-18', '2026-10-10', 'live', 2, 'Community founder mention', 1, 1, 'https://www.indiehackers.com/post/scaling-b2b-seo-in-2026', 'ugc', 200, 80, 71, 52000, 'US', '104.18.22.45', '104.18.22.0/24', 'AS13335 Cloudflare', 8, NULL),
  ('BL-0028', 1, 'our', 'techcrunch.com', 'https://techcrunch.com/2026/10/cloudscale-observability/', 'https://cloudscale.io/platform', 'cloud observability analytics', 'dofollow', 'editorial', '2026-10-20', '2026-10-20', '2026-10-11', 'live', 1, 'Tier-1 launch feature', 1, 2, 'https://techcrunch.com/2026/10/cloudscale-observability/', 'dofollow', 200, 93, 84, 310000, 'US', '192.0.78.12', '192.0.78.0/24', 'AS2635 Automattic', 3, NULL),
  ('BL-0029', 2, 'our', 'hackernoon.com', 'https://hackernoon.com/kubernetes-cost-telemetry-2026', 'https://cloudscale.io/kubernetes', 'CloudScale Kubernetes Telemetry', 'dofollow', 'guest_post', '2026-10-28', '2026-10-28', '2026-10-12', 'new', 2, 'Engineering guest article', 1, 2, 'https://hackernoon.com/kubernetes-cost-telemetry-2026', 'dofollow', 200, 86, 75, 84000, 'US', '76.76.21.21', '76.76.21.0/24', 'AS16509 Amazon-02', 5, NULL),
  ('BL-0030', 3, 'our', 'g2.com', 'https://www.g2.com/categories/cloud-monitoring', 'https://cloudscale.io/', 'CloudScale Analytics', 'nofollow', 'directory', '2026-09-15', '2026-09-15', '2026-10-10', 'live', 1, 'Category leader listing', 1, 2, 'https://www.g2.com/categories/cloud-monitoring', 'nofollow', 200, 90, 82, 190000, 'US', '104.16.100.12', '104.16.100.0/24', 'AS13335 Cloudflare', 4, NULL),
  ('BL-0031', 4, 'our', 'devops-weekly-archive.xyz', 'https://devops-weekly-archive.xyz/issue-412', 'https://cloudscale.io/pricing', 'cheap cloud monitoring', 'dofollow', 'directory', '2026-09-20', '2026-09-20', '2026-10-22', 'broken', 2, 'Scraper archive 404', 1, 2, 'https://devops-weekly-archive.xyz/issue-412', 'sponsored', 404, 14, 12, 210, 'NL', '185.220.101.19', '185.220.101.0/24', 'AS205100 F3Netze', 76, 'HTTP 404 Not Found'),
  ('BL-0032', 5, 'our', 'venturebeat.com', 'https://venturebeat.com/ai/cloud-infrastructure-2026/', 'https://cloudscale.io/ai-ops', 'AI infrastructure monitoring', 'dofollow', 'editorial', '2026-08-19', '2026-08-19', '2026-10-25', 'lost', 1, 'Link removed during article update', 1, 2, 'https://venturebeat.com/ai/cloud-infrastructure-2026/', 'dofollow', 200, 91, 80, 240000, 'US', '151.101.65.140', '151.101.65.0/24', 'AS54113 Fastly', 7, NULL)
) AS v(ref, exchange_id, side, referring_domain, referring_page_url, target_url, anchor_text, link_type, placement_type, acquisition_date, first_seen_date, last_verified_date, status, assigned_to, notes, created_by, project_id, source_url, follow_type, http_status, da, pa, traffic, country, ip_address, subnet, asn, risk_score, broken_reason)
WHERE NOT EXISTS (SELECT 1 FROM backlinks b WHERE b.ref = v.ref);

-- 6. Seed Outreach Campaigns for both Project 1 & Project 2
INSERT INTO outreach_campaigns (project_id, name, description, status, target_links_count, acquired_links_count, created_by)
SELECT * FROM (VALUES
  (1, 'Q4 Tier-1 SaaS Editorial Outreach', 'High-authority guest editorial and link insertion campaign targeting DA 70+ SaaS publications.', 'active', 25, 11, 1),
  (1, 'Competitor Link Intersect Reclamation', 'Targeting publishers linking to Ahrefs, Semrush, and Moz that do not yet link to LinkPilot.', 'active', 40, 16, 1),
  (1, 'Broken Link Replacement Sprint', 'Replacing 404 dead outbound SEO resource links on marketing blogs with LinkPilot guides.', 'active', 20, 8, 2),
  (2, 'CloudScale DevOps Authority Push', 'Editorial backlink campaign targeting Kubernetes, cloud-native, and SRE publications.', 'active', 30, 12, 1)
) AS v(project_id, name, description, status, target_links_count, acquired_links_count, created_by)
WHERE NOT EXISTS (SELECT 1 FROM outreach_campaigns c WHERE c.name = v.name);

-- 7. Seed Outreach Prospects across all stages & both projects
INSERT INTO outreach_prospects (project_id, campaign_id, domain, url, opportunity_type, contact_name, contact_email, da, dr, stage, priority, notes, follow_up_date, created_by)
SELECT * FROM (VALUES
  (1, 1, 'searchenginejournal.com', 'https://www.searchenginejournal.com/seo-tools/', 'guest_post', 'Danny Goodwin', 'editor@searchenginejournal.com', 89, 88, 'acquired', 'high', 'Published in Q4 roundup article', '2026-11-05', 1),
  (1, 1, 'backlinko.com', 'https://backlinko.com/link-building-tools', 'resource_page', 'Brian Editorial', 'outreach@backlinko.com', 84, 86, 'negotiating', 'high', 'Reviewing our interactive toxic risk calculator', '2026-11-02', 1),
  (1, 2, 'contentmarketinginstitute.com', 'https://contentmarketinginstitute.com/articles/', 'competitor_backlink', 'Stephanie Stahl', 'editorial@contentmarketinginstitute.com', 85, 84, 'replied', 'high', 'Interested in co-authored data study', '2026-11-03', 2),
  (1, 2, 'martech.org', 'https://martech.org/seo-analytics-platforms/', 'unlinked_mention', 'Constantine Von', 'tips@martech.org', 82, 81, 'followup', 'medium', 'Sent follow-up #1 regarding brand mention hyperlink', '2026-11-04', 2),
  (1, 3, 'hackernoon.com', 'https://hackernoon.com/tagged/seo', 'broken_link', 'David Smooke', 'stories@hackernoon.com', 86, 85, 'qualified', 'medium', 'Found 2 dead outbound links on SEO hub', '2026-11-06', 1),
  (2, 4, 'techcrunch.com', 'https://techcrunch.com/category/enterprise/', 'guest_post', 'Ron Miller', 'enterprise@techcrunch.com', 93, 92, 'acquired', 'high', 'Live link in enterprise observability feature', '2026-11-05', 1),
  (2, 4, 'indiehackers.com', 'https://www.indiehackers.com/cloud', 'resource_page', 'Channing Allen', 'community@indiehackers.com', 80, 82, 'contacted', 'medium', 'Pitched CloudScale startup telemetry benchmark', '2026-11-04', 2)
) AS v(project_id, campaign_id, domain, url, opportunity_type, contact_name, contact_email, da, dr, stage, priority, notes, follow_up_date, created_by)
WHERE NOT EXISTS (SELECT 1 FROM outreach_prospects p WHERE p.domain = v.domain AND p.project_id = v.project_id);

-- 8. Seed Competitors & Disavow Entries for Project 2 as well
INSERT INTO competitors (project_id, domain, name, da, dr, backlinks_count, ref_domains_count, organic_traffic)
SELECT * FROM (VALUES
  (1, 'majestic.com', 'Majestic SEO', 87, 88, 92000, 18400, 420000),
  (2, 'datadoghq.com', 'Datadog', 91, 90, 185000, 29400, 1650000),
  (2, 'newrelic.com', 'New Relic', 89, 88, 142000, 24100, 1120000),
  (2, 'grafana.com', 'Grafana Labs', 88, 89, 128000, 21800, 1340000)
) AS v(project_id, domain, name, da, dr, backlinks_count, ref_domains_count, organic_traffic)
WHERE NOT EXISTS (SELECT 1 FROM competitors c WHERE c.project_id = v.project_id AND c.domain = v.domain);

INSERT INTO disavow_entries (project_id, entry_type, value, comment, status, created_by)
SELECT * FROM (VALUES
  (1, 'domain', 'spam-seo-network.bid', 'PBN cluster on identical C-class subnet 185.220.101.0/24', 'active', 1),
  (1, 'domain', 'cheap-guest-posts-247.xyz', 'Paid link farm with unnatural casino/loan anchors', 'active', 1),
  (2, 'domain', 'devops-weekly-archive.xyz', 'Automated scraper domain injecting commercial anchors', 'active', 1),
  (2, 'domain', 'free-cloud-cracks.top', 'Malicious mirror site with high spam score (89%)', 'active', 1)
) AS v(project_id, entry_type, value, comment, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM disavow_entries d WHERE d.project_id = v.project_id AND d.value = v.value);

-- 9. Seed Verification History
INSERT INTO verification_history (backlink_id, checked_at, checked_by, result, http_status, is_dofollow, backlink_found, target_matches, anchor_matches, notes)
SELECT b.id, CURRENT_TIMESTAMP - (b.id || ' hours')::interval, 1,
       CASE WHEN b.status = 'lost' OR b.status = 'broken' THEN 'lost' ELSE 'live' END,
       COALESCE(b.http_status, 200),
       CASE WHEN b.link_type = 'dofollow' THEN 1 ELSE 0 END,
       CASE WHEN b.status = 'lost' OR b.status = 'broken' THEN 0 ELSE 1 END,
       1, 1,
       CASE WHEN b.status = 'lost' THEN 'Automated HTTP check: target anchor missing from DOM.'
            WHEN b.status = 'broken' THEN 'Automated HTTP check: publisher URL returned HTTP ' || COALESCE(b.http_status, 404)
            ELSE 'Automated HTTP check: 200 OK, canonical & dofollow verified in DOM.' END
FROM backlinks b
WHERE NOT EXISTS (SELECT 1 FROM verification_history vh WHERE vh.backlink_id = b.id)
LIMIT 20;

-- 10. Seed Notifications for all users
INSERT INTO notifications (user_id, type, title, message, link, is_read)
SELECT u.id, v.type, v.title, v.message, v.link, v.is_read
FROM users u
CROSS JOIN (VALUES
  ('backlink_live', 'New High-DA Backlink Verified', 'searchenginejournal.com (DA 89) linked to /features/intelligence with dofollow status.', '/backlinks', 0),
  ('exchange_balanced', 'Exchange EXC-0004 Completed', 'Reciprocal placement on techimply.com verified 200 OK Live.', '/exchanges', 0),
  ('toxic_alert', '2 Toxic Backlinks Flagged', 'Heuristic audit detected 2 high-risk links (score >= 75) ready for disavow review.', '/audit', 0),
  ('followup_due', 'Outreach Follow-up Due Today', 'Scheduled check-in with Brian Editorial at backlinko.com.', '/followups', 1)
) AS v(type, title, message, link, is_read)
WHERE NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.title = v.title);

-- 11. Seed System Settings
INSERT INTO settings (key, value) VALUES
  ('default_our_website', 'linkpilot.io'),
  ('allow_registration', 'true'),
  ('verification_interval_days', '7'),
  ('toxic_risk_threshold', '70')
ON CONFLICT (key) DO NOTHING;

-- 12. Update custom sequences table
UPDATE sequences SET value = 35 WHERE code = 'backlink' AND value < 35;
UPDATE sequences SET value = 25 WHERE code = 'domain' AND value < 25;
