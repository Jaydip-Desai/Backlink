import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, Globe2, FileText, CheckCircle } from 'lucide-react';
import { Logo, Button } from '../lib/UI.jsx';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0f1019)', color: 'var(--fg, #f8fafc)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <Logo size={32} animated={false} />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>LinkPilot</span>
          </Link>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/login">
              <Button variant="secondary" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Create Account</Button>
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13.5,
            color: 'var(--fg3, #94a3b8)',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={16} /> Back to LinkPilot
        </Link>

        {/* Hero Header */}
        <div
          style={{
            background: 'var(--bg2, #181926)',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            borderRadius: 20,
            padding: '36px 32px',
            marginBottom: 32,
            boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0,0,0,0.3))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(99, 91, 255, 0.15)',
                color: 'var(--primary, #635bff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Privacy Policy
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>
                Effective Date: October 2026 • Version 2.4 (GDPR & CCPA Compliant)
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--fg2, #cbd5e1)', lineHeight: 1.6 }}>
            At LinkPilot, we take security, privacy, and backlink telemetry sovereignty seriously. This policy describes
            how we collect, use, process, and protect your information across our backlink intelligence platform,
            automated web auditing crawlers, and API services.
          </p>
        </div>

        {/* Content Sections */}
        <div
          style={{
            background: 'var(--bg2, #181926)',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            borderRadius: 20,
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            lineHeight: 1.7,
            fontSize: 14.5,
            color: 'var(--fg2, #cbd5e1)',
          }}
        >
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              1. Information We Collect
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              We collect information that you directly provide to us and telemetry generated through your use of the platform:
            </p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li><strong>Account Credentials:</strong> Full name, professional work email, encrypted password hash (Argon2 / BCrypt), and optional job title.</li>
              <li><strong>Workspace & SEO Targets:</strong> Monitored target domains, competitor root URLs, keyword anchors, outreach contact lists, and disavow rules.</li>
              <li><strong>Public Crawling Data:</strong> Public web pages, HTTP headers, anchor text strings, canonical tags, rel attributes (<code style={{ fontSize: 13 }}>nofollow</code>, <code style={{ fontSize: 13 }}>sponsored</code>), and referring IP subnets discovered by our distributed verification bot.</li>
              <li><strong>Security Telemetry:</strong> Anonymized client IP addresses, user agent headers, session activity audit logs, and CSRF authentication nonces for malware and abuse prevention.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              2. How We Use Your Data
            </h2>
            <p style={{ margin: '0 0 12px' }}>We utilize collected data strictly for operational platform requirements:</p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li>Executing periodic automated verification checks on active backlinks and publisher inventory.</li>
              <li>Calculating domain health metrics, toxic risk scores, anchor text distribution ratios, and competitor gap opportunities.</li>
              <li>Delivering automated alert notifications for lost backlinks, rel changes, or toxic link spikes.</li>
              <li>Enforcing role-based access control (RBAC) and enterprise tenant workspace boundaries.</li>
              <li>Defending LinkPilot and client properties against automated scrapers, brute force login attacks, and cross-site request forgery.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              3. Data Protection & Security Architecture
            </h2>
            <p style={{ margin: 0 }}>
              All client communications are secured over TLS 1.3 encryption. Passwords are never stored in plaintext and
              are hashed using salted BCrypt with high work factors. Sensitive authentication tokens are maintained in
              HttpOnly, SameSite=Strict cookies to guard against XSS and credential extraction.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              4. Cookies & Tracking Technologies
            </h2>
            <p style={{ margin: 0 }}>
              We use strictly necessary cookies for authentication and anti-CSRF protection, as well as optional analytics
              and preferences cookies. For a detailed breakdown of all cookie categories and to customize your choices, please
              visit our dedicated <Link to="/cookies" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>Cookie Preferences</Link> page.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              5. Your Legal Rights (GDPR & CCPA)
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              Depending on your jurisdiction, you possess explicit legal rights over your personal data:
            </p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li><strong>Right of Access & Portability:</strong> Export your full backlink inventories, audit histories, and outreach contacts in CSV / JSON format at any time.</li>
              <li><strong>Right to Rectification:</strong> Edit or update your organization profiles and member permissions via Workspace Settings.</li>
              <li><strong>Right to Erasure:</strong> Delete monitored domains, projects, and user accounts. Data is purged from active databases within 30 days.</li>
              <li><strong>Opt-Out of Non-Essential Telemetry:</strong> Toggle performance and telemetry cookies off through cookie settings.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              6. Contact Our Data Protection Officer
            </h2>
            <p style={{ margin: 0 }}>
              If you have any questions regarding this Privacy Policy or wish to exercise your data rights, please contact our
              compliance team at{' '}
              <a href="mailto:privacy@linkpilot.io" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>
                privacy@linkpilot.io
              </a>{' '}
              or via our security contact desk.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 32, fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</Link>
          <span>•</span>
          <Link to="/cookies" style={{ color: 'inherit', textDecoration: 'underline' }}>Cookie Preferences</Link>
          <span>•</span>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
