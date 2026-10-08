import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Logo,
  Button,
  Badge,
  SafeExternalLink,
} from '../lib/UI.jsx';
import {
  Globe,
  Shield,
  ShieldCheck,
  TrendingUp,
  Link2,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  Layers,
  Send,
  Lock,
  FileText,
  Clock,
  Menu,
  X,
  Target,
  FileCheck,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [intelligenceMetric, setIntelligenceMetric] = useState('health');

  // Handle smooth scrolling for hash anchors like /landing#intelligence
  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const faqs = [
    {
      q: 'How does LinkPilot identify high-impact backlink opportunities?',
      a: 'LinkPilot combines real-time SERP indexing, competitor link gap analysis, and referring C-class IP clustering. By analyzing domains that already link to two or more of your direct organic competitors, LinkPilot pinpoints publishers with proven willingness to link in your niche.',
    },
    {
      q: 'Does LinkPilot perform live HTTP backlink verification and risk audits?',
      a: 'Yes. Our automated verification engine regularly crawls target publisher pages over HTTP, scans the DOM for canonical anchors, tests for nofollow/sponsored attributes, calculates toxic link risk scores (0-100), and records an immutable audit history.',
    },
    {
      q: 'How does LinkPilot enforce workspace isolation and role permissions?',
      a: 'Each organization operates in strict cryptographic and database tenant isolation. Roles (Owner, Admin, SEO Manager, Analyst, Outreach Specialist, Client, and Viewer) restrict access so team members and external clients only view their authorized domains and reports.',
    },
    {
      q: 'Can I export Google Search Console compliant disavow files?',
      a: 'Yes. Toxic backlinks flagged by LinkPilot can be batched with 1-click into an RFC-compliant Google Search Console disavow text file (domain:spamdomain.com) ready for immediate submission.',
    },
    {
      q: 'How does LinkPilot secure account credentials and sessions?',
      a: 'All account credentials use industry-standard salted BCrypt password hashing. User sessions are secured with HTTP-only, SameSite cookies and cryptographically signed JWT tokens with automated expiration.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)', color: 'var(--fg, #111827)' }}>
      {/* =========================================================================
          1. NAVIGATION HEADER (DESKTOP & MOBILE RESPONSIVE)
         ========================================================================= */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          padding: '0 24px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Logo size={34} animated={true} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg, #111827)' }}>
            LinkPilot
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--fg2, #334155)',
          }}
        >
          <a href="#how-it-works" style={{ textDecoration: 'none', color: 'inherit' }}>Platform</a>
          <a href="#intelligence" style={{ textDecoration: 'none', color: 'inherit' }}>Backlink Intelligence</a>
          <a href="#competitors" style={{ textDecoration: 'none', color: 'inherit' }}>Competitor Analysis</a>
          <a href="#outreach" style={{ textDecoration: 'none', color: 'inherit' }}>Link Building</a>
          <a href="#reports" style={{ textDecoration: 'none', color: 'inherit' }}>Reports</a>
          <a href="#security" style={{ textDecoration: 'none', color: 'inherit' }}>Security</a>
          <a href="#faq" style={{ textDecoration: 'none', color: 'inherit' }}>FAQ</a>
        </nav>

        {/* Desktop Actions */}
        <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login">
            <Button variant="secondary" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="landing-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer Menu & Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 68,
              left: 0,
              right: 0,
              background: 'var(--bg2, #ffffff)',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: 'var(--shadow-lg, 0 20px 25px -5px rgba(0,0,0,0.1))',
              animation: 'fadeInDown 0.25s ease-out',
            }}
          >
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--fg, #111827)', fontSize: 15, fontWeight: 500 }}
            >
              Platform
            </a>
            <a
              href="#intelligence"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--fg, #111827)', fontSize: 15, fontWeight: 500 }}
            >
              Backlink Intelligence
            </a>
            <a
              href="#competitors"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--fg, #111827)', fontSize: 15, fontWeight: 500 }}
            >
              Competitor Analysis
            </a>
            <a
              href="#outreach"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--fg, #111827)', fontSize: 15, fontWeight: 500 }}
            >
              Link Building
            </a>
            <a
              href="#reports"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--fg, #111827)', fontSize: 15, fontWeight: 500 }}
            >
              Reports
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--fg, #111827)', fontSize: 15, fontWeight: 500 }}
            >
              Security
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--fg, #111827)', fontSize: 15, fontWeight: 500 }}
            >
              FAQ
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>Log in</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. HERO SECTION
         ========================================================================= */}
      <section
        style={{
          padding: '72px 24px 60px',
          maxWidth: 1200,
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', marginBottom: 20 }}>
          <Badge color="#635bff" bg="rgba(99, 91, 255, 0.08)">
            <Sparkles size={14} style={{ marginRight: 6 }} /> Next-Generation SEO Intelligence & Outreach
          </Badge>
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 5.5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 20px',
            maxWidth: 880,
            color: 'var(--fg, #111827)',
          }}
        >
          Build Better Backlinks.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #635bff 0%, #8b5cf6 50%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Grow Real Authority.
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2.2vw, 19px)',
            color: 'var(--fg3, #64748b)',
            lineHeight: 1.6,
            maxWidth: 720,
            margin: '0 0 32px',
          }}
        >
          Monitor backlink health, discover competitor opportunities, identify high-intent link prospects, and build
          sustainable domain authority with LinkPilot.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
          <Link to="/register">
            <Button variant="primary" size="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Start Free <ArrowRight size={18} />
            </Button>
          </Link>
          <a href="#intelligence" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Explore Platform <ChevronDown size={18} />
            </Button>
          </a>
        </div>

        {/* Dashboard Product Preview Graphic */}
        <div
          style={{
            width: '100%',
            maxWidth: 1040,
            background: 'var(--bg2, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 24,
            padding: '24px',
            boxShadow: 'var(--shadow-lg, 0 25px 50px -12px rgba(15, 23, 42, 0.12))',
            position: 'relative',
          }}
        >
          {/* Subtle Floating Hero Metric Badges */}
          <div
            className="floating-hero-badge hero-badge-top"
            style={{
              position: 'absolute',
              top: -20,
              left: -16,
              background: 'var(--bg2, #ffffff)',
              border: '1px solid rgba(99, 91, 255, 0.25)',
              borderRadius: 14,
              padding: '10px 16px',
              boxShadow: '0 14px 30px rgba(99, 91, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg, #111827)' }}>+28 New Backlinks</div>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>98.4% Live & Indexed</div>
            </div>
          </div>

          <div
            className="floating-hero-badge hero-badge-bottom"
            style={{
              position: 'absolute',
              bottom: -20,
              right: -16,
              background: 'var(--bg2, #ffffff)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 14,
              padding: '10px 16px',
              boxShadow: '0 14px 30px rgba(16, 185, 129, 0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(99, 91, 255, 0.15)',
                color: '#635bff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg, #111827)' }}>DA 74 Authority</div>
              <div style={{ fontSize: 11, color: '#635bff', fontWeight: 600 }}>0.4% Low Toxic Risk</div>
            </div>
          </div>

          {/* Top Mock Window Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 12, color: 'var(--fg4, #94a3b8)', marginLeft: 8, fontFamily: 'monospace' }}>
              linkpilot.io/workspace/dashboard • Live Backlink Telemetry
            </span>
          </div>

          {/* Metric KPI Cards in Hero Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg3, #64748b)', marginBottom: 4 }}>Domain Authority</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary, #635bff)' }}>74 <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>+6 pts</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--fg4, #94a3b8)', marginTop: 2 }}>Top 3% in SaaS Industry</div>
            </div>
            <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg3, #64748b)', marginBottom: 4 }}>Verified Live Links</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg, #111827)' }}>4,820 <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>98.4% 200 OK</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--fg4, #94a3b8)', marginTop: 2 }}>HTTP DOM & Canonical Validated</div>
            </div>
            <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg3, #64748b)', marginBottom: 4 }}>Referring Domains</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg, #111827)' }}>1,248 <span style={{ fontSize: 13, color: '#635bff', fontWeight: 600 }}>+84 net</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--fg4, #94a3b8)', marginTop: 2 }}>C-Class IP Subnet Diversity: 91%</div>
            </div>
            <div style={{ padding: 16, borderRadius: 14, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg3, #64748b)', marginBottom: 4 }}>Toxic Risk Audit</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>0.4% <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>Low Risk</span></div>
              <div style={{ fontSize: 11.5, color: 'var(--fg4, #94a3b8)', marginTop: 2 }}>Google Disavow File Ready</div>
            </div>
          </div>

          {/* Realistic Backlink Stream Rows */}
          <div style={{ borderRadius: 14, border: '1px solid var(--border, #e2e8f0)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', background: 'var(--bg3, #f1f5f9)', fontSize: 12, fontWeight: 600, color: 'var(--fg3, #64748b)', textAlign: 'left' }}>
              <span>Referring Page & Target</span>
              <span>Anchor Text</span>
              <span>Type / Rel</span>
              <span>Verification</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 16px', borderTop: '1px solid var(--border, #e2e8f0)', fontSize: 13, textAlign: 'left', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--fg, #111827)' }}>forbes.com/best-seo-tools-2026</strong>
                <span style={{ fontSize: 11.5, color: 'var(--fg4, #94a3b8)' }}>Target: /solutions/link-intelligence</span>
              </div>
              <span style={{ color: 'var(--fg2, #334155)' }}>"enterprise backlink intelligence"</span>
              <span><Badge color="#16a34a" bg="var(--green-bg, #ecfdf5)">dofollow</Badge></span>
              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><CheckCircle2 size={14} /> 200 OK Live</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '14px 16px', borderTop: '1px solid var(--border, #e2e8f0)', fontSize: 13, textAlign: 'left', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--fg, #111827)' }}>techcrunch.com/features/saas-growth</strong>
                <span style={{ fontSize: 11.5, color: 'var(--fg4, #94a3b8)' }}>Target: /</span>
              </div>
              <span style={{ color: 'var(--fg2, #334155)' }}>"LinkPilot"</span>
              <span><Badge color="#635bff" bg="rgba(99,91,255,0.1)">brand dofollow</Badge></span>
              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><CheckCircle2 size={14} /> 200 OK Live</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. HOW IT WORKS (WORKFLOW SECTION)
         ========================================================================= */}
      <section id="how-it-works" style={{ padding: '72px 24px', background: 'var(--bg2, #ffffff)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <Badge color="#635bff" bg="rgba(99, 91, 255, 0.08)">End-to-End Workflow</Badge>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
              How LinkPilot Accelerates Organic Authority
            </h2>
            <p style={{ fontSize: 15, color: 'var(--fg3, #64748b)', maxWidth: 640, margin: '0 auto' }}>
              From initial crawl ingestion to automated verification and relationship nurturing, LinkPilot turns link
              building into an exact science.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { num: '01', title: 'Connect & Ingest', desc: 'Sync Google Search Console or import raw CSV backlink logs with automatic duplicate detection.' },
              { num: '02', title: 'Network & C-Class Audit', desc: 'Cluster backlinks across C-class subnets to detect Private Blog Networks (PBNs) and footprint risks.' },
              { num: '03', title: 'Competitor Link Intersect', desc: 'Uncover domains linking to your primary competitors but not yet to your property.' },
              { num: '04', title: 'Targeted Outreach CRM', desc: 'Manage prospect pipelines, personalize pitch templates, and track outreach status in Kanban columns.' },
              { num: '05', title: 'Live HTTP Verification', desc: 'Distributed crawlers test HTTP status, DOM presence, anchor strings, and rel attributes automatically.' },
              { num: '06', title: 'Remediation & Disavow', desc: 'Export 1-click Google Disavow files to isolate toxic links and defend search engine rankings.' },
            ].map(step => (
              <div
                key={step.num}
                style={{
                  padding: 24,
                  borderRadius: 18,
                  background: 'var(--bg, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary, #635bff)', marginBottom: 12 }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: 'var(--fg, #111827)' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.6, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. INTELLIGENCE SECTION (ID="intelligence" REQUIRED BY #2 & #6)
         ========================================================================= */}
      <section
        id="intelligence"
        style={{
          padding: '80px 24px',
          background: 'var(--bg, #f8fafc)',
          borderTop: '1px solid var(--border, #e2e8f0)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Badge color="#10b981" bg="var(--green-bg, #ecfdf5)">SEO Intelligence Engine</Badge>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
              Deep Backlink & Domain Authority Telemetry
            </h2>
            <p style={{ fontSize: 15, color: 'var(--fg3, #64748b)', maxWidth: 680, margin: '0 auto' }}>
              Reachable directly at <code>/landing#intelligence</code>. Inspect backlink health, referring domains,
              anchor distribution, and competitor gap metrics in real time.
            </p>
          </div>

          {/* Interactive Metric Switcher Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { id: 'health', label: 'Backlink Health & Velocity' },
              { id: 'domains', label: 'Referring Domains & Subnets' },
              { id: 'anchors', label: 'Anchor Text Distribution' },
              { id: 'toxic', label: 'Toxic Spam & Disavow' },
            ].map(tab => (
              <Button
                key={tab.id}
                variant={intelligenceMetric === tab.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setIntelligenceMetric(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab 1: Health & Velocity */}
          {intelligenceMetric === 'health' && (
            <div
              style={{
                background: 'var(--bg2, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 20,
                padding: 32,
                boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.06))',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 28,
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Real-Time Backlink Velocity</h3>
                <p style={{ fontSize: 14, color: 'var(--fg3, #64748b)', lineHeight: 1.6, marginBottom: 18 }}>
                  Track newly discovered vs. dropped backlinks daily. LinkPilot automatically flags when high-DA
                  referring links switch to 404 Not Found, 301 Redirects, or receive unintended <code>nofollow</code> tags.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                    <CheckCircle2 size={16} color="#16a34a" /> <strong>+128 New Links</strong> acquired this month
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                    <CheckCircle2 size={16} color="#16a34a" /> <strong>-14 Lost Links</strong> flagged for reclamation
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                    <CheckCircle2 size={16} color="#16a34a" /> <strong>94.2% Net Positive</strong> link acquisition velocity
                  </div>
                </div>
              </div>
              <div style={{ padding: 24, borderRadius: 16, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg3, #64748b)', marginBottom: 12 }}>
                  30-Day Velocity Trajectory
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140, paddingTop: 20 }}>
                  {[35, 45, 60, 52, 78, 90, 85, 110, 128].map((val, idx) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${(val / 128) * 100}%`,
                          background: idx === 8 ? 'var(--primary, #635bff)' : 'rgba(99, 91, 255, 0.4)',
                          borderRadius: '4px 4px 0 0',
                          minHeight: 12,
                        }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--fg4, #94a3b8)' }}>W{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Referring Domains & Subnets */}
          {intelligenceMetric === 'domains' && (
            <div
              style={{
                background: 'var(--bg2, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 20,
                padding: 32,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Referring Domains & C-Class Diversity</h3>
              <p style={{ fontSize: 14, color: 'var(--fg3, #64748b)', lineHeight: 1.6, marginBottom: 24 }}>
                Search engines penalize link networks hosted on identical IP subnets. LinkPilot calculates your C-class
                subnet ratio to guarantee your backlink footprint is authentic and natural.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ padding: 18, borderRadius: 12, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
                  <div style={{ fontSize: 13, color: 'var(--fg3, #64748b)' }}>Unique Referring Domains</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--fg, #111827)' }}>1,248</div>
                  <span style={{ fontSize: 12, color: '#16a34a' }}>+6.8% MoM growth</span>
                </div>
                <div style={{ padding: 18, borderRadius: 12, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
                  <div style={{ fontSize: 13, color: 'var(--fg3, #64748b)' }}>Distinct C-Class Subnets</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary, #635bff)' }}>1,140</div>
                  <span style={{ fontSize: 12, color: '#16a34a' }}>91.3% Healthy Spread</span>
                </div>
                <div style={{ padding: 18, borderRadius: 12, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
                  <div style={{ fontSize: 13, color: 'var(--fg3, #64748b)' }}>PBN Risk Score</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>0.2%</div>
                  <span style={{ fontSize: 12, color: 'var(--fg4, #94a3b8)' }}>Zero footprint clustering</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Anchor Text Distribution */}
          {intelligenceMetric === 'anchors' && (
            <div
              style={{
                background: 'var(--bg2, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 20,
                padding: 32,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Anchor Text Ratio Optimization</h3>
              <p style={{ fontSize: 14, color: 'var(--fg3, #64748b)', lineHeight: 1.6, marginBottom: 24 }}>
                Protect against Google algorithmic over-optimization penalties. Monitor exact match vs. branded vs. generic anchor text ratios.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { name: 'Branded (e.g., "LinkPilot")', pct: 48, color: '#635bff' },
                  { name: 'Partial Match (e.g., "LinkPilot backlink audits")', pct: 24, color: '#06b6d4' },
                  { name: 'Exact Match (e.g., "backlink intelligence")', pct: 16, color: '#f59e0b' },
                  { name: 'Generic / URL (e.g., "website", "linkpilot.io")', pct: 12, color: '#10b981' },
                ].map(item => (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <strong style={{ color: item.color }}>{item.pct}%</strong>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--bg3, #f1f5f9)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Toxic Spam & Disavow */}
          {intelligenceMetric === 'toxic' && (
            <div
              style={{
                background: 'var(--bg2, #ffffff)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 20,
                padding: 32,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Toxic Spam Auditing & Google Disavow</h3>
              <p style={{ fontSize: 14, color: 'var(--fg3, #64748b)', lineHeight: 1.6, marginBottom: 20 }}>
                Automated heuristic scoring analyzes toxic TLDs, automated link directories, and unnatural link spikes.
                Export clean Google Disavow files in one click.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ShieldCheck size={28} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>Google Search Console Disavow Exporter</div>
                    <div style={{ fontSize: 12.5, color: 'var(--fg3, #64748b)' }}>Formatted RFC domain directives ready for upload</div>
                  </div>
                </div>
                <Link to="/register">
                  <Button variant="primary" size="sm">Audit My Backlinks</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          5. COMPETITOR INTELLIGENCE SECTION (#competitors)
         ========================================================================= */}
      <section id="competitors" style={{ padding: '80px 24px', background: 'var(--bg2, #ffffff)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Badge color="#f59e0b" bg="var(--amber-bg, #fffbeb)">Competitor Gap Analysis</Badge>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
              Uncover High-Authority Gaps Before Competitors Do
            </h2>
            <p style={{ fontSize: 15, color: 'var(--fg3, #64748b)', maxWidth: 640, margin: '0 auto' }}>
              Compare your domain directly against up to 5 industry competitors. Identify common linkers, top linked pages, and winnable link opportunities.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Target size={22} color="var(--primary, #635bff)" /> Link Intersect Matrix
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5, marginBottom: 18 }}>
                Filter for domains linking to multiple rival websites that have not yet linked to your target URL.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg2, #ffffff)', border: '1px solid var(--border, #e2e8f0)' }}>
                  <span>hubspot.com/marketing</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>DA 93 • 3 Competitors Linked</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg2, #ffffff)', border: '1px solid var(--border, #e2e8f0)' }}>
                  <span>g2.com/categories/seo-software</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>DA 90 • 4 Competitors Linked</span>
                </div>
              </div>
            </div>

            <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={22} color="#16a34a" /> Top Linked Content Ingestion
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5, marginBottom: 18 }}>
                Reverse-engineer competitor viral link magnets, benchmark content depth, and claim broken competitor backlinks.
              </p>
              <Link to="/register">
                <Button variant="primary" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Run Free Competitor Gap Check
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. LINK-BUILDING & OUTREACH CRM SECTION (#outreach)
         ========================================================================= */}
      <section id="outreach" style={{ padding: '80px 24px', background: 'var(--bg, #f8fafc)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Badge color="#ec4899" bg="rgba(236, 72, 153, 0.08)">Outreach CRM</Badge>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
              Scale High-Velocity Link Acquisition Pipelines
            </h2>
            <p style={{ fontSize: 15, color: 'var(--fg3, #64748b)', maxWidth: 640, margin: '0 auto' }}>
              Convert discovered prospects into verified backlink placements with automated email sequences, follow-ups, and opportunity scoring.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {[
              { status: 'Prospect Discovered', count: '142', color: '#635bff', desc: 'Identified via gap intersect & crawler telemetry' },
              { status: 'Pitch Dispatched', count: '58', color: '#06b6d4', desc: 'Personalized email sequences sent via SMTP' },
              { status: 'In Review / Negotiation', count: '24', color: '#f59e0b', desc: 'Publisher webmaster evaluating editorial placement' },
              { status: 'Link Acquired & Verified', count: '18', color: '#16a34a', desc: 'Confirmed 200 OK live link in target DOM' },
            ].map(col => (
              <div
                key={col.status}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: 'var(--bg2, #ffffff)',
                  border: '1px solid var(--border, #e2e8f0)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: col.color }}>{col.status}</span>
                  <span style={{ fontSize: 18, fontWeight: 800 }}>{col.count}</span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5, margin: 0 }}>
                  {col.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. REPORTING SECTION (#reports)
         ========================================================================= */}
      <section id="reports" style={{ padding: '80px 24px', background: 'var(--bg2, #ffffff)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <Badge color="#635bff" bg="rgba(99, 91, 255, 0.08)">Executive Reporting</Badge>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
            White-Label Client Reports & Scheduled Exports
          </h2>
          <p style={{ fontSize: 15, color: 'var(--fg3, #64748b)', maxWidth: 640, margin: '0 auto 40px' }}>
            Deliver polished backlink audit reports, domain velocity dashboards, and acquired placement summaries to clients and stakeholders.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, textAlign: 'left' }}>
            <div style={{ padding: 24, borderRadius: 16, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
              <FileCheck size={26} color="var(--primary, #635bff)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Scheduled Automated PDF & CSV</h3>
              <p style={{ fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5, margin: 0 }}>
                Configure weekly or monthly automated digests dispatched directly to client stakeholder emails.
              </p>
            </div>
            <div style={{ padding: 24, borderRadius: 16, background: 'var(--bg, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
              <Users size={26} color="#16a34a" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Read-Only Client Portal</h3>
              <p style={{ fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5, margin: 0 }}>
                Grant clients self-serve access to real-time backlink progress without exposing internal outreach CRM notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. SECURITY & DATA GOVERNANCE SECTION (#security)
         ========================================================================= */}
      <section id="security" style={{ padding: '80px 24px', background: 'var(--bg, #f8fafc)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Badge color="#10b981" bg="var(--green-bg, #ecfdf5)">Enterprise Governance</Badge>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
              Built for Strict Privacy, RBAC & Multi-Tenant Isolation
            </h2>
            <p style={{ fontSize: 15, color: 'var(--fg3, #64748b)', maxWidth: 680, margin: '0 auto' }}>
              We implement comprehensive defense-in-depth security standards without making unsubstantiated claims.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: <Lock size={22} color="#635bff" />, title: 'Secure Authentication', desc: 'Salted BCrypt hashing, HTTP-only JWT sessions, and anti-CSRF token verification on all mutating requests.' },
              { icon: <Shield size={22} color="#16a34a" />, title: 'Role-Based Access (RBAC)', desc: 'Granular permissions enforce least-privilege access across Owner, Admin, Manager, Analyst, and Client roles.' },
              { icon: <Layers size={22} color="#06b6d4" />, title: 'Multi-Tenant Workspace Isolation', desc: 'Strict organization boundaries prevent cross-workspace data leakage across all REST endpoints.' },
              { icon: <Clock size={22} color="#f59e0b" />, title: 'Immutable Security Audit Logs', desc: 'Every authentication event, invitation, role modification, and sensitive export is recorded in security audit trails.' },
            ].map(sec => (
              <div
                key={sec.title}
                style={{
                  padding: 24,
                  borderRadius: 18,
                  background: 'var(--bg2, #ffffff)',
                  border: '1px solid var(--border, #e2e8f0)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ marginBottom: 14 }}>{sec.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{sec.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--fg3, #64748b)', lineHeight: 1.55, margin: 0 }}>
                  {sec.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FREQUENTLY ASKED QUESTIONS (FAQ) (#faq)
         ========================================================================= */}
      <section id="faq" style={{ padding: '80px 24px', background: 'var(--bg2, #ffffff)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <Badge color="#635bff" bg="rgba(99, 91, 255, 0.08)">Common Questions</Badge>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 15, color: 'var(--fg3, #64748b)' }}>
              Everything you need to know about the LinkPilot backlink intelligence platform.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    borderRadius: 14,
                    background: 'var(--bg, #f8fafc)',
                    border: '1px solid var(--border, #e2e8f0)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? -1 : index)}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--fg, #111827)',
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        color: 'var(--fg3, #64748b)',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'var(--fg3, #64748b)', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FINAL CALL TO ACTION (CTA)
         ========================================================================= */}
      <section
        style={{
          padding: '72px 24px',
          background: 'radial-gradient(circle at top center, rgba(99, 91, 255, 0.12) 0%, var(--bg, #f8fafc) 70%)',
          textAlign: 'center',
          borderTop: '1px solid var(--border, #e2e8f0)',
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Ready to Take Command of Your Backlink Authority?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--fg3, #64748b)', lineHeight: 1.6, margin: '0 0 32px' }}>
            Join thousands of organic growth teams monitoring backlink health, discovering competitor gaps, and scaling high-impact placements.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register">
              <Button variant="primary" size="lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Get Started Free <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Sign in to Workspace</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. COMPLETE REDESIGNED FOOTER (REQUIREMENT #38)
         ========================================================================= */}
      <footer
        style={{
          background: 'var(--bg2, #ffffff)',
          borderTop: '1px solid var(--border, #e2e8f0)',
          padding: '60px 24px 36px',
        }}
      >
        <div className="landing-footer-grid">
          {/* Brand Info */}
          <div className="landing-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Logo size={32} animated={false} />
              <strong style={{ fontSize: 19, color: 'var(--fg, #111827)' }}>LinkPilot</strong>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.65, margin: 0, maxWidth: 300 }}>
              Backlink intelligence and link-building platform for modern SEO teams.
            </p>
          </div>

          {/* Product Links */}
          <div className="landing-footer-col">
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: 'var(--fg, #111827)' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: 'var(--fg3, #64748b)' }}>
              <a href="#intelligence" style={{ textDecoration: 'none', color: 'inherit' }}>Backlink Intelligence</a>
              <a href="#competitors" style={{ textDecoration: 'none', color: 'inherit' }}>Competitor Analysis</a>
              <a href="#outreach" style={{ textDecoration: 'none', color: 'inherit' }}>Link Building</a>
              <a href="#reports" style={{ textDecoration: 'none', color: 'inherit' }}>Reports</a>
              <Link to="/integrations" style={{ textDecoration: 'none', color: 'inherit' }}>Integrations</Link>
            </div>
          </div>

          {/* Company Links */}
          <div className="landing-footer-col">
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: 'var(--fg, #111827)' }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: 'var(--fg3, #64748b)' }}>
              <a href="#how-it-works" style={{ textDecoration: 'none', color: 'inherit' }}>About</a>
              <a href="mailto:support@linkpilot.io" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</a>
              <a href="#security" style={{ textDecoration: 'none', color: 'inherit' }}>Security</a>
              <a href="mailto:careers@linkpilot.io" style={{ textDecoration: 'none', color: 'inherit' }}>Careers</a>
            </div>
          </div>

          {/* Resources Links */}
          <div className="landing-footer-col">
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: 'var(--fg, #111827)' }}>Resources</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: 'var(--fg3, #64748b)' }}>
              <Link to="/backlink-checker" style={{ textDecoration: 'none', color: 'inherit' }}>Documentation</Link>
              <Link to="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>Help Center</Link>
              <a href="#intelligence" style={{ textDecoration: 'none', color: 'inherit' }}>Blog</a>
              <a href="#how-it-works" style={{ textDecoration: 'none', color: 'inherit' }}>SEO Resources</a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="landing-footer-col">
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: 'var(--fg, #111827)' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: 'var(--fg3, #64748b)' }}>
              <Link to="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>Terms of Service</Link>
              <Link to="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy Policy</Link>
              <Link to="/cookies" style={{ textDecoration: 'none', color: 'inherit' }}>Cookie Policy</Link>
              <Link to="/cookies" style={{ textDecoration: 'none', color: 'inherit' }}>Cookie Preferences</Link>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div
          className="landing-footer-bottom"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            paddingTop: 24,
            borderTop: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 12.5,
            color: 'var(--fg4, #94a3b8)',
          }}
        >
          <span>© 2026 LinkPilot Backlink Intelligence Systems. All rights reserved.</span>
          <div className="landing-footer-bottom-links" style={{ display: 'flex', gap: 18 }}>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Security & Compliance</Link>
            <Link to="/cookies" style={{ color: 'inherit', textDecoration: 'none' }}>Consent Management</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
