import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ArrowLeft, Scale, ShieldAlert, Cpu, AlertCircle } from 'lucide-react';
import { Logo, Button } from '../lib/UI.jsx';

export default function TermsOfService() {
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
              <Scale size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Terms of Service
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>
                Effective Date: October 2026 • Version 2.4
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--fg2, #cbd5e1)', lineHeight: 1.6 }}>
            These Terms of Service ("Agreement") govern your access and use of the LinkPilot backlink intelligence platform,
            automated web crawler infrastructure, outreach management tools, and related APIs. By creating an account
            or using the service, you agree to be bound by these terms.
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
              1. Platform Accounts & Workspace Security
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              When you establish a workspace, you represent that you are an authorized representative of your organization:
            </p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li><strong>Initial Account Owner:</strong> The user creating a workspace is provisioned as the primary Owner with administrative authority.</li>
              <li><strong>Credential Confidentiality:</strong> You are responsible for safeguarding your authentication credentials, API keys, and multi-factor session tokens.</li>
              <li><strong>Team Invitations:</strong> Workspace administrators are responsible for managing member roles, access permissions, and removing departed staff promptly.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              2. Acceptable Crawling & Bot Etiquette
            </h2>
            <p style={{ margin: '0 0 12px' }}>
              LinkPilot operates high-performance distributed crawler bots to verify backlink index status and detect anchor alterations:
            </p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li>Our verification bot respects <code style={{ fontSize: 13 }}>robots.txt</code> standard directives and honors polite crawl delays.</li>
              <li>You may not configure crawler jobs intended to perform Denial-of-Service (DoS), exploit server vulnerabilities, or extract confidential intranet data.</li>
              <li>Automated API requests must adhere to published workspace rate limits. Bypassing rate limits via IP proxy rotation is strictly prohibited.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              3. SEO Disavow & Search Engine Disclaimers
            </h2>
            <p style={{ margin: 0 }}>
              LinkPilot provides toxic backlink scoring algorithms, spam network heuristics, and Google Search Console
              formatted disavow file exports. You acknowledge that search engine ranking algorithms (including Google,
              Bing, and others) are proprietary and subject to continuous alteration. LinkPilot does not guarantee specific
              search ranking positions or traffic volumes.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              4. Email Outreach & Anti-Spam Compliance
            </h2>
            <p style={{ margin: 0 }}>
              When utilizing our Outreach CRM and email dispatch sequences, you agree to comply with all applicable anti-spam
              regulations (including CAN-SPAM Act and GDPR). You may only dispatch outreach messages with legitimate editorial
              or partnership intent, and must provide functional unsubscribe mechanisms.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              5. Intellectual Property & Customer Telemetry
            </h2>
            <p style={{ margin: 0 }}>
              You retain all ownership rights to your proprietary domains, target lists, custom email sequences, and client
              reports. LinkPilot retains all rights to its core platform code, crawling engines, machine learning heuristics,
              and UI designs.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg, #f8fafc)', margin: '0 0 12px' }}>
              6. Limitation of Liability & Termination
            </h2>
            <p style={{ margin: 0 }}>
              To the maximum extent permitted by applicable law, LinkPilot shall not be liable for any indirect, incidental,
              or consequential damages resulting from third-party server downtime, publisher site modifications, or search
              algorithm changes. Either party may terminate this agreement at any time by closing their workspace account.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 32, fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</Link>
          <span>•</span>
          <Link to="/cookies" style={{ color: 'inherit', textDecoration: 'underline' }}>Cookie Preferences</Link>
          <span>•</span>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
