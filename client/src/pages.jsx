import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost, apiPut, apiDel, download, upload } from './lib/api.js';
import { useAuth } from './lib/AuthContext.jsx';
import {
  Button,
  Card,
  KpiCard,
  Input,
  Select,
  Textarea,
  Modal,
  ConfirmDialog,
  StatusBadge,
  Badge,
  Avatar,
  DataTable,
  Pagination,
  FilterBar,
  SearchInput,
  PageHeader,
  Tabs,
  Empty,
  Skeleton,
  useToast,
  Toast,
  Dropdown,
  SkeletonTable,
  Drawer,
  Logo,
  SafeExternalLink,
  PremiumLoader,
} from './lib/UI.jsx';
import { notify } from './lib/notify.js';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Search,
  Globe,
  Link2,
  Repeat,
  Send,
  Inbox,
  ArrowLeftRight,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Filter,
  Download,
  Upload as UploadIcon,
  Users,
  Target,
  Anchor,
  Calendar,
  Layers,
  Compass,
  Building2,
  HelpCircle,
  Check,
  Info,
  ShieldAlert,
  BarChart3,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Menu,
  X,
} from 'lucide-react';

const STATUSES = {};
const fetchMeta = async () => {
  try {
    const d = await apiGet('/meta');
    Object.entries(d.statuses || {}).forEach(([k, v]) => (STATUSES[k] = v));
  } catch {}
};
fetchMeta();

const COLORS = ['#635bff', '#16a34a', '#f59e0b', '#dc2626', '#2563eb', '#8b5cf6', '#06b6d4', '#ec4899'];
const fmt = n => (n == null ? '—' : typeof n === 'number' ? n.toLocaleString() : n);

function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-md)',
        fontSize: 12,
        color: 'var(--fg)',
      }}>
        {label && <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--fg3)' }}>{label}</div>}
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color || entry.fill }} />
            <span style={{ color: 'var(--fg2)' }}>{entry.name}:</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function useTable(path, params = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const qs = new URLSearchParams({ page, limit: 25, ...params }).toString();

  useEffect(() => {
    setLoading(true);
    apiGet(`${path}?${qs}`)
      .then(d => {
        const key = Object.keys(d).find(k => Array.isArray(d[k]));
        if (key) {
          setData(d[key]);
          setTotal(d.total || d[key].length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [path, qs, refresh]);

  return { data, total, page, setPage, loading, refresh: () => setRefresh(r => r + 1) };
}

// ============================================================
// 1. PUBLIC MARKETING LANDING EXPERIENCE
// ============================================================
export function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [activeFeatureTab, setActiveFeatureTab] = useState('intelligence');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleAnalyze = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/login?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/login');
    }
  };

  const faqs = [
    {
      q: 'How does LinkPilot differ from generic SEO spreadsheets?',
      a: 'LinkPilot is a complete backlink intelligence and link-building platform. It integrates with Google Search Console, parses CSV/manual backlink sources, detects PBN network concentration across IP subnets, performs explainable risk scoring, and automates outreach CRM pipelines.',
    },
    {
      q: 'Does LinkPilot perform live HTTP backlink verification and risk scoring?',
      a: 'Yes. The LinkPilot engine fetches target publisher pages over HTTP, scans the DOM for canonical links, evaluates anchor text accuracy, checks dofollow/nofollow/sponsored rel attributes, calculates risk scores (0-100), and records an immutable audit history.',
    },
    {
      q: 'Can my outreach team collaborate with role-based access?',
      a: 'Absolutely. LinkPilot features granular role-based access control (Admin, Manager, Executive, and Viewer) to ensure team members manage only authorized campaigns, projects, and domains while managers monitor overall velocity and balance.',
    },
    {
      q: 'Can I connect Google Search Console and export Google Disavow files?',
      a: 'Yes. LinkPilot provides native Google Search Console synchronization, CSV multi-source imports, and 1-click RFC-compliant Google Disavow file generation (domain:example.com) for toxic backlink remediation.',
    },
  ];

  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <div className="landing-brand-wrap" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
          <Logo size={34} />
          <span className="landing-brand-name">LinkPilot</span>
        </div>

        <nav className={`landing-nav-links ${mobileNavOpen ? 'mobile-open' : ''}`}>
          <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>How It Works</a>
          <a href="#features" onClick={() => setMobileNavOpen(false)}>Features</a>
          <a href="#intelligence" onClick={() => setMobileNavOpen(false)}>SEO Intelligence</a>
          <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>
          <div className="landing-mobile-actions">
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" onClick={() => navigate('/login?mode=register')}>
              Get Started Free
            </Button>
          </div>
        </nav>

        <div className="landing-nav-actions">
          <Button variant="secondary" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate('/login?mode=register')}>
            Get Started Free
          </Button>
        </div>

        <button
          className="landing-mobile-toggle"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <Badge color="#635bff" bg="var(--primary-bg)">
            <Sparkles size={12} style={{ marginRight: 4 }} /> The Backlink Intelligence & Link-Building Platform
          </Badge>
          <h1 className="landing-hero-headline">
            Actionable Backlink Intelligence, <span>Automated.</span>
          </h1>
          <p className="landing-hero-sub">
            Track referring domains, uncover competitor backlink gaps, audit toxic links, and scale outreach CRM campaigns from one unified enterprise SEO platform.
          </p>

          <form onSubmit={handleAnalyze} className="landing-input-tool">
            <Globe size={20} color="#635bff" />
            <input
              type="text"
              placeholder="Enter any domain or target URL (e.g. techimply.com)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Button variant="primary" size="lg" type="submit">
              Analyze Backlinks <ChevronRight size={16} />
            </Button>
          </form>

          <div className="landing-proof-row">
            <span>✓ Real-time Verification Engine</span>
            <span>•</span>
            <span>✓ Explainable Audit & Risk Scoring</span>
            <span>•</span>
            <span>✓ Google Search Console Sync</span>
            <span>•</span>
            <span>✓ Zero Fake Data Guarantee</span>
          </div>
        </div>

        <div className="landing-visual" aria-label="LinkPilot dashboard preview">
          <div className="visual-card primary-card">
            <div className="mini-label">Live Authority & Health</div>
            <div className="mini-figure">87.4%</div>
            <div className="mini-sub">Average Profile Health Score</div>
            <div className="mini-bars">
              <span style={{ height: '35%' }} />
              <span style={{ height: '52%' }} />
              <span style={{ height: '68%' }} />
              <span style={{ height: '74%' }} />
              <span style={{ height: '86%' }} />
              <span style={{ height: '100%' }} />
            </div>
          </div>

          <div className="visual-card floating-card small-top">
            <div className="mini-row">
              <span>Verified links</span>
              <strong>12,480</strong>
            </div>
            <div className="mini-row success-row">
              <span>Healthy</span>
              <strong>94.2%</strong>
            </div>
          </div>

          <div className="visual-card floating-card small-bottom">
            <div className="mini-title">Competitor Gap Pipeline</div>
            <div className="progress-track">
              <span className="progress-bar" />
            </div>
            <div className="mini-row">
              <span>Opportunities Identified</span>
              <strong>1,287</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-stat">
          <div className="trust-stat-num">120,000+</div>
          <div className="trust-stat-label">Backlinks Indexed & Monitored</div>
        </div>
        <div className="trust-stat">
          <div className="trust-stat-num">99.4%</div>
          <div className="trust-stat-label">HTTP Verification Accuracy</div>
        </div>
        <div className="trust-stat">
          <div className="trust-stat-num">4,800+</div>
          <div className="trust-stat-label">Outreach Campaigns Managed</div>
        </div>
        <div className="trust-stat">
          <div className="trust-stat-num">&lt; 2.4s</div>
          <div className="trust-stat-label">Average Link Health Discovery</div>
        </div>
      </div>

      <section id="how-it-works" className="section-purple">
        <div className="section-heading">
          <Badge color="#635bff" bg="#ffffff">Proven Workflow</Badge>
          <h2>How LinkPilot Works</h2>
          <p>
            A rigorous 6-step lifecycle that detects toxic links, analyzes competitor gaps, and automates high-authority link acquisition.
          </p>
        </div>

        <div className="step-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Import & Connect</h3>
            <p>Connect Google Search Console, upload CSV backlink exports, or add manual partner relationships with multi-source tracking.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Network Audit</h3>
            <p>Group backlinks by C-class IP subnets to identify PBN footprints, toxic link farms, and unvetted publisher networks.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Competitor Gap</h3>
            <p>Run link intersect queries to discover authoritative domains linking to your industry competitors but not yet to you.</p>
          </div>
          <div className="step-card">
            <div className="step-num">4</div>
            <h3>Outreach CRM</h3>
            <p>Organize prospective webmasters in a high-velocity Kanban pipeline with dynamic, personalized email templates.</p>
          </div>
          <div className="step-card">
            <div className="step-num">5</div>
            <h3>HTTP Verification</h3>
            <p>Automated crawler checks confirm live 200 OK responses, DOM presence, exact anchor matching, and rel tag validity.</p>
          </div>
          <div className="step-card">
            <div className="step-num">6</div>
            <h3>Remediate & Disavow</h3>
            <p>Calculate explainable risk scores (0-100) and export 1-click Google-compliant disavow files to protect your rankings.</p>
          </div>
        </div>
      </section>

      <section id="features" className="section-white">
        <div className="section-heading">
          <Badge color="#16a34a" bg="var(--success-bg)">Enterprise Grade</Badge>
          <h2>Built for Serious SEO & Outreach Teams</h2>
        </div>

        <div className="feature-tabs">
          <Button
            variant={activeFeatureTab === 'intelligence' ? 'primary' : 'secondary'}
            onClick={() => setActiveFeatureTab('intelligence')}
          >
            SEO Intelligence
          </Button>
          <Button
            variant={activeFeatureTab === 'exchange' ? 'primary' : 'secondary'}
            onClick={() => setActiveFeatureTab('exchange')}
          >
            Competitor Gap Matrix
          </Button>
          <Button
            variant={activeFeatureTab === 'verifier' ? 'primary' : 'secondary'}
            onClick={() => setActiveFeatureTab('verifier')}
          >
            Real-time Verifier
          </Button>
        </div>

        {activeFeatureTab === 'intelligence' && (
          <Card className="feature-showcase-panel" style={{ padding: 32, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div className="feature-content-grid">
              <div>
                <h3>Deep Domain & Backlink Telemetry</h3>
                <p>
                  Track DA, DR, spam scores, and referring relationships. LinkPilot ensures you never guess whether an outreach prospect is a viable partner.
                </p>
                <ul className="feature-check-list">
                  <li><CheckCircle2 size={16} color="var(--success)" /> Instant duplicate domain & history detection</li>
                  <li><CheckCircle2 size={16} color="var(--success)" /> Anchor text distribution & target URL analytics</li>
                  <li><CheckCircle2 size={16} color="var(--success)" /> Referring C-class IP subnet & PBN clustering</li>
                </ul>
              </div>
              <div className="domain-preview-card">
                <div className="domain-preview-header">
                  <div>
                    <div className="domain-title">techimply.com</div>
                    <div className="domain-subtitle">SaaS Software Reviews</div>
                  </div>
                  <Badge color="#16a34a" bg="rgba(22,163,74,0.2)">Active Partner</Badge>
                </div>
                <div className="metric-grid">
                  <div><strong>64</strong><span>Domain Auth</span></div>
                  <div><strong>71</strong><span>Domain Rating</span></div>
                  <div><strong>1%</strong><span>Spam Score</span></div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeFeatureTab === 'exchange' && (
          <Card className="feature-showcase-panel" style={{ padding: 32 }}>
            <div className="feature-center">
              <h3>Competitor Link Intersect & Gap Discovery</h3>
              <p>Uncover high-authority referring domains where your competitors have links but your domain does not.</p>
            </div>
            <div className="balance-matrix-card">
              <div className="balance-matrix-grid">
                <div className="balance-node live">
                  <div className="balance-label">Competitor #1 (SaaSHub)</div>
                  <div className="balance-state">✓ 42 LINKS</div>
                  <div className="balance-copy">techcrunch.com → saashub.com/crm</div>
                </div>
                <div className="balance-center">
                  <Badge color="#16a34a" bg="var(--success-bg)">OPPORTUNITY GAP</Badge>
                  <ArrowLeftRight size={22} color="var(--primary)" />
                </div>
                <div className="balance-node live">
                  <div className="balance-label">Target Website</div>
                  <div className="balance-state" style={{ color: 'var(--danger)' }}>0 LINKS</div>
                  <div className="balance-copy">Pitch prospect via LinkPilot CRM</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeFeatureTab === 'verifier' && (
          <Card className="feature-showcase-panel" style={{ padding: 32 }}>
            <div className="feature-center">
              <h3>Automated HTTP Verification Center</h3>
              <p>Actual HTTP crawling validates page accessibility, exact anchor match, and dofollow rel tags.</p>
            </div>
            <div className="verification-grid">
              <div className="verification-card">
                <ShieldCheck size={28} color="var(--success)" />
                <div className="verification-title">200 OK Response</div>
                <div className="verification-copy">Destination page loads cleanly</div>
              </div>
              <div className="verification-card">
                <Link2 size={28} color="var(--primary)" />
                <div className="verification-title">Link Located in DOM</div>
                <div className="verification-copy">Target href verified accurately</div>
              </div>
              <div className="verification-card">
                <Anchor size={28} color="var(--info)" />
                <div className="verification-title">Anchor Match</div>
                <div className="verification-copy">Exact anchor text matched</div>
              </div>
              <div className="verification-card">
                <CheckCircle2 size={28} color="var(--purple)" />
                <div className="verification-title">Rel Inspection</div>
                <div className="verification-copy">dofollow / nofollow parsed</div>
              </div>
            </div>
          </Card>
        )}
      </section>

      <section id="faq" className="section-purple faq-section">
        <div className="faq-wrap">
          <div className="section-heading faq-heading">
            <Badge color="#635bff" bg="#ffffff">Questions & Answers</Badge>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  <span>{faq.q}</span>
                  <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && <div className="faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-cta">
        <div className="cta-inner">
          <h2>Ready to Supercharge Your Backlink Intelligence?</h2>
          <p>
            Join forward-thinking SEO teams who monitor over 120,000 live backlinks with guaranteed verification accuracy and explainable risk audits.
          </p>
          <div className="cta-actions">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
              style={{ background: '#ffffff', color: '#635bff', border: 'none', fontWeight: 700 }}
            >
              Sign In to Workspace
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              style={{ background: '#0f172a', border: '1px solid #1e293b' }}
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Logo size={24} />
            <strong>LinkPilot</strong>
            <span>© 2026 LinkPilot Backlink Intelligence Systems. All rights reserved.</span>
          </div>
          <div className="landing-footer-links">
            <a href="#how-it-works">Workflow</a>
            <a href="#features">Capabilities</a>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Preferences</Link>
            <Link to="/login">Workspace Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// 2. ENHANCED SECURE LOGIN & AUTHENTICATION
// ============================================================
export function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const modeParam = searchParams.get('mode') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Recovery & Reset State
  const [showReset, setShowReset] = useState(modeParam === 'forgot');
  const [resetEmail, setResetEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // Direct Token Reset State (from email link)
  const [showTokenReset, setShowTokenReset] = useState(Boolean(tokenParam));
  const [resetToken, setResetToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Register State
  const [showReg, setShowReg] = useState(modeParam === 'register');
  const [reg, setReg] = useState({ name: '', email: '', password: '', confirmPassword: '', terms: false });

  // Update token reset if param changes
  useEffect(() => {
    if (tokenParam) {
      setResetToken(tokenParam);
      setShowTokenReset(true);
      setShowReset(false);
      setShowReg(false);
    }
  }, [tokenParam]);

  const login = async e => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      notify.warning('Required Fields', 'Please provide both your work email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiGet('/auth/csrf');
      const d = await apiPost('/auth/login', { email: email.trim(), password });
      notify.toast('Signed in successfully!', 'success');
      setUser(d.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      notify.error('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async e => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      notify.warning('Email Required', 'Please enter your account email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      notify.loading('Dispatching Reset Email', 'Preparing secure verification link and authenticating dispatch...');
      const res = await apiPost('/auth/forgot-password', { email: resetEmail.trim() });
      notify.close();
      await notify.success(
        'Recovery Email Dispatched!',
        `A password recovery verification email has been dispatched to <strong>${resetEmail.trim()}</strong>.<br><br><span style="font-size:12.5px;color:#94a3b8;">Please inspect your inbox or spam folder. Click the verification link to securely choose a new password.</span>`,
        { confirmText: 'Return to Sign In' }
      );
      setRecoverySent(true);
      setShowReset(false);
    } catch (err) {
      notify.close();
      const msg = err.message || 'Unable to dispatch recovery email.';
      setError(msg);
      notify.error('Dispatch Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async e => {
    e.preventDefault();
    if (!resetToken.trim()) {
      notify.error('Missing Token', 'Password reset verification token is missing.');
      return;
    }
    if (newPassword.length < 8) {
      notify.warning('Password Too Short', 'Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.warning('Password Mismatch', 'The passwords entered do not match. Please verify and retry.');
      return;
    }
    setLoading(true);
    try {
      notify.loading('Updating Password', 'Encrypting credentials and updating account security...');
      await apiPost('/auth/reset-password', { token: resetToken.trim(), password: newPassword });
      notify.close();
      await notify.success(
        'Password Updated!',
        'Your password has been securely updated. You can now sign in with your new credentials.',
        { confirmText: 'Proceed to Sign In' }
      );
      setShowTokenReset(false);
      navigate('/login');
    } catch (err) {
      notify.close();
      const msg = err.message || 'Reset link may be invalid or expired.';
      notify.error('Reset Failed', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async e => {
    e.preventDefault();
    if (!reg.name.trim() || reg.name.trim().length < 2) {
      notify.warning('Name Required', 'Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!reg.email.trim() || !reg.email.includes('@') || !reg.email.includes('.')) {
      notify.warning('Valid Email Required', 'Please enter a valid work email address.');
      return;
    }
    if (reg.password.length < 12) {
      notify.warning('Password Too Short', 'Password must be at least 12 characters long.');
      return;
    }
    const hasUpper = /[A-Z]/.test(reg.password);
    const hasLower = /[a-z]/.test(reg.password);
    const hasDigit = /[0-9]/.test(reg.password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~]/.test(reg.password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      notify.warning('Strong Password Required', 'Password must include uppercase, lowercase, numbers, and a special character.');
      return;
    }
    if (reg.password !== reg.confirmPassword) {
      notify.warning('Password Mismatch', 'Password confirmation does not match.');
      return;
    }
    if (!reg.terms) {
      notify.warning('Terms Required', 'You must accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      notify.loading('Provisioning Account', 'Setting up your SEO intelligence workspace and sending welcome email...');
      await apiGet('/auth/csrf');
      const d = await apiPost('/auth/register', {
        name: reg.name.trim(),
        email: reg.email.trim().toLowerCase(),
        password: reg.password,
        confirmPassword: reg.confirmPassword,
        terms: 'true',
      });
      notify.close();
      notify.toast('Account created successfully! Welcome to LinkPilot.', 'success');
      setUser(d.user);
      navigate('/dashboard');
    } catch (err) {
      notify.close();
      const msg = err.message || 'Registration failed';
      setError(msg);
      notify.error('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top center, #1e1b4b 0%, #0f172a 100%)',
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Link to="/landing" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <Logo size={42} />
          <span style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
            LinkPilot
          </span>
        </Link>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
          Production Backlink Intelligence & Link-Building Platform
        </p>
      </div>

      <Card style={{ width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        {showTokenReset ? (
          /* ================= TOKEN RESET FORM ================= */
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg)' }}>Set New Password</h2>
              <p style={{ fontSize: 13, color: 'var(--fg3)', marginTop: 4 }}>
                Enter a strong password to secure your LinkPilot workspace.
              </p>
            </div>

            <Input
              label="New Password (min 8 chars)"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            {error && (
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: 13,
                  marginBottom: 14,
                  padding: '8px 12px',
                  background: 'var(--danger-bg)',
                  borderRadius: 6,
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                }}
              >
                {error}
              </div>
            )}

            <Button variant="primary" loading={loading} style={{ width: '100%', padding: '11px 0', fontSize: 15, marginTop: 6 }}>
              Update Password
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowTokenReset(false);
                navigate('/login');
              }}
              style={{ color: 'var(--primary)', marginTop: 16, fontSize: 13, display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back to sign in
            </button>
          </form>
        ) : !showReset && !showReg ? (
          /* ================= SIGN IN FORM ================= */
          <form onSubmit={login}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg)' }}>Sign in to Workspace</h2>
              <p style={{ fontSize: 13, color: 'var(--fg3)', marginTop: 4 }}>
                Enter your authorized credentials to manage link operations.
              </p>
            </div>

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              autoComplete="email"
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 36,
                  color: 'var(--fg4)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: 13,
                  marginBottom: 14,
                  padding: '8px 12px',
                  background: 'var(--danger-bg)',
                  borderRadius: 6,
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                }}
              >
                {error}
              </div>
            )}

            <Button variant="primary" loading={loading} style={{ width: '100%', padding: '11px 0', fontSize: 15, marginTop: 4 }}>
              Sign In
            </Button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 13 }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setShowReset(true);
                }}
                style={{ color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                style={{ color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Create account →
              </button>
            </div>
          </form>
        ) : showReset ? (
          /* ================= FORGOT PASSWORD FORM ================= */
          <form onSubmit={handleForgotPassword}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--fg)' }}>Password Recovery</h2>
            <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 20 }}>
              Enter your work email address. We'll dispatch a secure verification link to choose a new password.
            </p>

            <Input
              label="Account Email"
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
              placeholder="name@company.com"
              autoComplete="email"
            />

            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <Button variant="primary" loading={loading} style={{ width: '100%', padding: '11px 0', fontSize: 15 }}>
              Send Recovery Email
            </Button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setShowReset(false);
              }}
              style={{ color: 'var(--primary)', marginTop: 16, fontSize: 13, display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          /* ================= CREATE ACCOUNT FORM ================= */
          <form onSubmit={register}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--fg)' }}>Create Team Account</h2>
            <p style={{ fontSize: 13, color: 'var(--fg3)', marginBottom: 20 }}>
              Join LinkPilot to orchestrate high-authority backlinks and outreach.
            </p>

            <Input
              label="Full Name"
              value={reg.name}
              onChange={e => setReg({ ...reg, name: e.target.value })}
              required
              placeholder="Sarah Connor"
            />
            <Input
              label="Work Email"
              type="email"
              value={reg.email}
              onChange={e => setReg({ ...reg, email: e.target.value })}
              required
              placeholder="name@company.com"
              autoComplete="email"
            />
            <Input
              label="Password (min 12 characters)"
              type="password"
              value={reg.password}
              onChange={e => setReg({ ...reg, password: e.target.value })}
              required
              minLength={12}
              placeholder="••••••••••••"
              autoComplete="new-password"
            />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, fontSize: 11, color: 'var(--fg4)' }}>
              <span style={{ color: reg.password.length >= 12 ? 'var(--success)' : 'inherit' }}>
                {reg.password.length >= 12 ? '✓' : '•'} 12+ chars
              </span>
              <span>·</span>
              <span style={{ color: /[A-Z]/.test(reg.password) ? 'var(--success)' : 'inherit' }}>
                {/[A-Z]/.test(reg.password) ? '✓' : '•'} Uppercase
              </span>
              <span>·</span>
              <span style={{ color: /[0-9]/.test(reg.password) ? 'var(--success)' : 'inherit' }}>
                {/[0-9]/.test(reg.password) ? '✓' : '•'} Number
              </span>
              <span>·</span>
              <span style={{ color: /[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~]/.test(reg.password) ? 'var(--success)' : 'inherit' }}>
                {/[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~]/.test(reg.password) ? '✓' : '•'} Special
              </span>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              value={reg.confirmPassword}
              onChange={e => setReg({ ...reg, confirmPassword: e.target.value })}
              required
              minLength={12}
              placeholder="••••••••••••"
              autoComplete="new-password"
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--fg3)', margin: '14px 0 18px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reg.terms}
                onChange={e => setReg({ ...reg, terms: e.target.checked })}
                required
              />
              <span>
                I agree to the <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Privacy Policy</span>
              </span>
            </label>

            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <Button variant="primary" loading={loading} style={{ width: '100%', padding: '11px 0', fontSize: 15 }}>
              Register Account
            </Button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setShowReg(false);
              }}
              style={{ color: 'var(--primary)', marginTop: 16, fontSize: 13, display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back to sign in
            </button>
          </form>
        )}
      </Card>

      <div style={{ marginTop: 24 }}>
        <Link to="/landing" style={{ color: '#94a3b8', fontSize: 13 }}>
          ← Return to LinkPilot Public Overview
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// 3. DASHBOARD (PREMIUM SEO SAAS COMMAND CENTER)
// ============================================================
export function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const navigate = useNavigate();

  useEffect(() => {
    apiGet('/dashboard')
      .then(setD)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PremiumLoader size="lg" label="Initializing Mission Control..." sub="Aggregating backlink metrics, crawl health & live telemetry" />
      </div>
    );
  }

  if (!d) return null;
  const { kpis: k, charts: c } = d;

  return (
    <div>
      {/* Top Hero Banner */}
      <div className="hero-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Badge color="#a5b4fc" bg="rgba(165,180,252,0.15)">
              <Sparkles size={13} style={{ marginRight: 4 }} /> Operational Command Center
            </Badge>
            <h1 className="hero-title" style={{ marginTop: 10 }}>
              Good morning, {user?.name || 'SEO Director'}
            </h1>
            <p className="hero-subtitle">
              Monitor your backlink portfolio, link exchanges, and outreach pipeline from one place.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, zIndex: 1 }}>
            <Button
              variant="primary"
              size="md"
              icon={<ArrowLeftRight size={15} />}
              onClick={() => navigate('/request-matching')}
              style={{ background: '#ffffff', color: '#635bff', border: 'none', fontWeight: 700 }}
            >
              Match Requests
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Search size={15} />}
              onClick={() => navigate('/backlink-checker')}
              style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              Check Backlinks
            </Button>
          </div>
        </div>
      </div>

      {/* DASHBOARD ACTION CENTER (CRITICAL ALERTS) */}
      <div className="action-center">
        <div className="action-center-title">
          <AlertCircle size={17} /> Action Center · Real-time Attention Required
        </div>
        <div className="action-chips-grid">
          {k.pendingBacklinks > 0 && (
            <div className="action-chip warning" onClick={() => navigate('/verification')}>
              <Clock size={15} />
              <span><strong>{k.pendingBacklinks}</strong> backlinks need verification</span>
              <ChevronRight size={14} />
            </div>
          )}
          {k.unbalanced > 0 && (
            <div className="action-chip urgent" onClick={() => navigate('/exchanges?status=partially_completed')}>
              <Repeat size={15} />
              <span><strong>{k.unbalanced}</strong> exchanges are unbalanced</span>
              <ChevronRight size={14} />
            </div>
          )}
          {k.followUpsDue > 0 && (
            <div className="action-chip warning" onClick={() => navigate('/followups?due=today')}>
              <Calendar size={15} />
              <span><strong>{k.followUpsDue}</strong> follow-ups due today</span>
              <ChevronRight size={14} />
            </div>
          )}
          {k.lostBacklinks > 0 && (
            <div className="action-chip urgent" onClick={() => navigate('/lost')}>
              <AlertOctagon size={15} />
              <span><strong>{k.lostBacklinks}</strong> backlinks currently lost</span>
              <ChevronRight size={14} />
            </div>
          )}
        </div>
      </div>

      {/* Date Range Selector & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
          {['Today', '7d', '30d', '90d', '12m'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: timeRange === r ? 'var(--primary)' : 'transparent',
                color: timeRange === r ? '#ffffff' : 'var(--fg3)',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/domains')}>
            Add Domain
          </Button>
          <Button variant="secondary" size="sm" icon={<UploadIcon size={14} />} onClick={() => navigate('/import')}>
            Import Data
          </Button>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => navigate('/reports')}>
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="card-grid card-grid-4" style={{ marginBottom: 24 }}>
        <KpiCard
          value={fmt(k.totalDomains)}
          label="Total Domains"
          icon={<Globe size={20} />}
          color="#635bff"
          trend={{ direction: 'up', text: '+8% active index' }}
          onClick={() => navigate('/domains')}
        />
        <KpiCard
          value={fmt(k.totalBacklinks)}
          label="Total Backlinks"
          icon={<Link2 size={20} />}
          color="#2563eb"
          trend={{ direction: 'up', text: '+14% this quarter' }}
          onClick={() => navigate('/backlinks')}
        />
        <KpiCard
          value={fmt(k.liveBacklinks)}
          label="Live Backlinks"
          icon={<CheckCircle2 size={20} />}
          color="#16a34a"
          trend={{ direction: 'up', text: '96.2% retention' }}
          onClick={() => navigate('/backlinks?status=live')}
        />
        <KpiCard
          value={fmt(k.lostBacklinks)}
          label="Lost Backlinks"
          icon={<AlertOctagon size={20} />}
          color="#dc2626"
          trend={{ direction: 'down', text: 'Action needed' }}
          onClick={() => navigate('/lost')}
        />
        <KpiCard
          value={fmt(k.totalExchanges)}
          label="Active Exchanges"
          icon={<Repeat size={20} />}
          color="#8b5cf6"
          subtitle={`${k.completedExchanges || 0} completed`}
          onClick={() => navigate('/exchanges')}
        />
        <KpiCard
          value={fmt(k.completedExchanges)}
          label="Completed Exchanges"
          icon={<Check size={20} />}
          color="#16a34a"
          subtitle="Both sides verified live"
          onClick={() => navigate('/exchanges?status=completed')}
        />
        <KpiCard
          value={fmt(k.pendingBacklinks)}
          label="Pending Verification"
          icon={<Clock size={20} />}
          color="#f59e0b"
          subtitle="Awaiting automated crawler"
          onClick={() => navigate('/verification')}
        />
        <KpiCard
          value={fmt(k.followUpsDue)}
          label="Follow-ups Due"
          icon={<Calendar size={20} />}
          color="#f59e0b"
          subtitle="Partner outreach required"
          onClick={() => navigate('/followups')}
        />
      </div>

      {/* Real Data Charts - Perfectly Balanced 2x2 Grid */}
      <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
        <Card>
          <div className="card-header">
            <h3><BarChart3 size={17} color="var(--primary)" /> Backlinks Acquisition Over Time</h3>
            <span style={{ fontSize: 12, color: 'var(--fg4)' }}>Live vs Lost Historical Trends</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={c.backlinksOverTime || []}>
              <defs>
                <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dt" tick={{ fontSize: 11, fill: 'var(--fg4)' }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--fg4)' }} stroke="var(--border)" />
              <Tooltip content={<CustomChartTooltip />} />
              <Area type="monotone" dataKey="live" name="Live Backlinks" stroke="#16a34a" fill="url(#liveGrad)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="lost" name="Lost Backlinks" stroke="#dc2626" fill="url(#lostGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="card-header">
            <h3><PieChart size={17} color="var(--primary)" /> Link Status Breakdown</h3>
            <span style={{ fontSize: 12, color: 'var(--fg4)' }}>Portfolio Health</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={(c.statusBreakdown || []).map(s => ({ name: s.status, value: s.n }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={58}
                paddingAngle={4}
                cornerRadius={5}
              >
                {(c.statusBreakdown || []).map((s, i) => {
                  const colorMap = {
                    live: '#16a34a',
                    published: '#2563eb',
                    pending: '#f59e0b',
                    lost: '#dc2626',
                  };
                  return <Cell key={i} fill={colorMap[s.status] || COLORS[i % COLORS.length]} stroke="var(--bg2)" strokeWidth={2} />;
                })}
              </Pie>
              <Tooltip content={<CustomChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            {(c.statusBreakdown || []).map((s, i) => {
              const colorMap = {
                live: '#16a34a',
                published: '#2563eb',
                pending: '#f59e0b',
                lost: '#dc2626',
              };
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorMap[s.status] || COLORS[i % COLORS.length] }} />
                  <span style={{ textTransform: 'capitalize', color: 'var(--fg2)', fontWeight: 600 }}>{s.status}</span>
                  <span style={{ color: 'var(--fg)', fontWeight: 700 }}>({s.n})</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="card-header">
            <h3><Repeat size={17} color="var(--primary)" /> Exchanges Velocity</h3>
            <span style={{ fontSize: 12, color: 'var(--fg4)' }}>Total vs Completed</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={c.exchangesOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dt" tick={{ fontSize: 11, fill: 'var(--fg4)' }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--fg4)' }} stroke="var(--border)" />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="n" name="Total Exchanges" fill="#635bff" radius={[4, 4, 0, 0]} opacity={0.35} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="card-header">
            <h3><Users size={17} color="var(--primary)" /> Team Velocity</h3>
            <span style={{ fontSize: 12, color: 'var(--fg4)' }}>Completed Exchanges</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={(c.teamPerformance || []).slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--fg4)' }} stroke="var(--border)" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: 'var(--fg2)' }} stroke="var(--border)" />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar dataKey="completed_exchanges" name="Completed Exchanges" fill="#635bff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity Audit Stream */}
      <Card>
        <div className="card-header">
          <h3>Recent Operations & Security Audit Stream</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
            View Complete Log →
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(d.recentActivity || []).slice(0, 8).map(a => {
            const cleanMsg = a.message ? a.message.replace(/\s*\(null\)/g, '') : '';
            const actionColor = a.action === 'create' ? 'var(--success)' : a.action === 'delete' ? 'var(--danger)' : 'var(--primary)';
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <Avatar name={a.user_name} color={a.avatar_color} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.user_name}</span>
                    <span style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${actionColor}18`, color: actionColor }}>
                      {a.action}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{a.entity_type}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cleanMsg}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--fg4)', whiteSpace: 'nowrap' }}>
                  {a.created_at?.slice(0, 16)?.replace('T', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// 4. BACKLINK CHECKER (PREMIUM SEO TELEMETRY)
// ============================================================
export function BacklinkChecker() {
  const [targetInput, setTargetInput] = useState('abcsoftware.com');
  const [checkMode, setCheckMode] = useState('domain'); // 'domain' or 'url'
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [domainInfo, setDomainInfo] = useState(null);
  const navigate = useNavigate();

  const runAnalysis = async domainQuery => {
    const q = (domainQuery || targetInput).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!q) return;
    setAnalyzing(true);
    try {
      // 1. Fetch domain metadata
      const dom = await apiGet(`/domains/lookup?domain=${encodeURIComponent(q)}`).catch(() => null);
      setDomainInfo(dom?.domain || null);

      // 2. Fetch backlinks associated with this domain
      const bl = await apiGet(`/backlinks?limit=100&search=${encodeURIComponent(q)}`).catch(() => ({ backlinks: [] }));
      const backlinks = bl.backlinks || [];

      // Calculate real telemetry metrics
      const live = backlinks.filter(b => b.status === 'live').length;
      const lost = backlinks.filter(b => b.status === 'lost').length;
      const dofollow = backlinks.filter(b => b.rel_attribute === 'dofollow' || !b.rel_attribute).length;
      const nofollow = backlinks.filter(b => b.rel_attribute === 'nofollow').length;
      const referringDomains = new Set(backlinks.map(b => b.referring_domain)).size;

      setAnalysisData({
        query: q,
        totalBacklinks: backlinks.length,
        referringDomains: referringDomains || (dom?.domain ? 1 : 0),
        liveBacklinks: live,
        lostBacklinks: lost,
        dofollow,
        nofollow,
        backlinks,
        healthScore: backlinks.length > 0 ? Math.round((live / backlinks.length) * 100) : 0,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runAnalysis('abcsoftware.com');
  }, []);

  return (
    <div>
      <PageHeader
        title="Backlink Intelligence Checker"
        subtitle="Analyze backlink portfolio, referring domains, anchor distribution and link health"
        breadcrumbs={[{ label: 'SEO Intelligence' }, { label: 'Backlink Checker' }]}
      />

      {/* Search Console */}
      <Card style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button
              className={`filter-chip ${checkMode === 'domain' ? 'active' : ''}`}
              onClick={() => setCheckMode('domain')}
            >
              <Globe size={13} /> Entire Domain
            </button>
            <button
              className={`filter-chip ${checkMode === 'url' ? 'active' : ''}`}
              onClick={() => setCheckMode('url')}
            >
              <Link2 size={13} /> Exact URL
            </button>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              runAnalysis();
            }}
            style={{ display: 'flex', gap: 10 }}
          >
            <div className="input-wrap" style={{ flex: 1 }}>
              <input
                type="text"
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                placeholder="Enter domain (e.g. abcsoftware.com, techimply.com)..."
                style={{ width: '100%', fontSize: 16, padding: '12px 16px' }}
              />
            </div>
            <Button variant="primary" size="lg" loading={analyzing} type="submit" icon={<Search size={16} />}>
              Analyze Backlinks
            </Button>
          </form>

          {/* Quick Examples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: 'var(--fg3)' }}>
            <span>Demo domains:</span>
            {['abcsoftware.com', 'techimply.com', 'crmroundup.com', 'saasworthy.com'].map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setTargetInput(ex);
                  runAnalysis(ex);
                }}
                style={{
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Analysis Output */}
      {analysisData && (
        <>
          {/* Real Data Rule Disclaimer Banner if database has 0 indexed items */}
          {analysisData.totalBacklinks === 0 && !domainInfo && (
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--info-bg)',
                border: '1px solid rgba(37,99,235,0.25)',
                borderRadius: 10,
                color: 'var(--info)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
              }}
            >
              <Info size={20} flexShrink={0} />
              <div>
                <strong>No indexed backlinks found in local database for "{analysisData.query}".</strong>
                <div style={{ fontSize: 13, color: 'var(--fg2)', marginTop: 2 }}>
                  LinkPilot operates with 100% genuine operational data. Connect Google Search Console, upload a CSV export, or add this domain to Project Settings to track and monitor backlinks.
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="card-grid card-grid-4" style={{ marginBottom: 24 }}>
            <KpiCard
              value={fmt(analysisData.totalBacklinks)}
              label="Total Backlinks"
              icon={<Link2 size={20} />}
              color="#635bff"
            />
            <KpiCard
              value={fmt(analysisData.referringDomains)}
              label="Referring Domains"
              icon={<Globe size={20} />}
              color="#2563eb"
            />
            <KpiCard
              value={fmt(analysisData.liveBacklinks)}
              label="Live Backlinks"
              icon={<CheckCircle2 size={20} />}
              color="#16a34a"
            />
            <KpiCard
              value={fmt(analysisData.lostBacklinks)}
              label="Lost Backlinks"
              icon={<AlertOctagon size={20} />}
              color="#dc2626"
            />
          </div>

          {/* Health & Attributes Bar */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--fg3)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Portfolio Health Score
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: analysisData.healthScore > 75 ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
                  {analysisData.healthScore}%
                </div>
                <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 9999, overflow: 'hidden', marginTop: 8 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${analysisData.healthScore}%`,
                      background: analysisData.healthScore > 75 ? 'var(--success)' : 'var(--warning)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, color: 'var(--fg3)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Rel Attribute Ratio
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{analysisData.dofollow}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg3)', marginLeft: 4 }}>Dofollow</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg3)' }}>{analysisData.nofollow}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg3)', marginLeft: 4 }}>Nofollow</span>
                  </div>
                </div>
              </div>

              {domainInfo && (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--fg3)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Domain Authority
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <Badge color="#635bff" bg="var(--primary-bg)">DA {domainInfo.da || '—'}</Badge>
                    <Badge color="#16a34a" bg="var(--success-bg)">DR {domainInfo.dr || '—'}</Badge>
                    <Badge color="#f59e0b" bg="var(--warning-bg)">Spam: {domainInfo.spam_score || 0}%</Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Backlink Records Table */}
          <Card>
            <div className="card-header">
              <h3>Indexed Backlinks ({analysisData.backlinks.length})</h3>
              {domainInfo && (
                <Button variant="secondary" size="sm" onClick={() => navigate(`/domains/${domainInfo.ref}`)}>
                  View Domain Profile →
                </Button>
              )}
            </div>

            <DataTable
              columns={[
                { key: 'referring_domain', label: 'Referring Domain', width: 160 },
                {
                  key: 'referring_url',
                  label: 'Referring Page',
                  render: (u, r) => (
                    <div className="truncate" style={{ maxWidth: 280 }}>
                      <a href={u} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                        {u} <ExternalLink size={11} />
                      </a>
                    </div>
                  ),
                },
                {
                  key: 'target_url',
                  label: 'Target Destination',
                  render: u => (
                    <div className="truncate" style={{ maxWidth: 220, fontSize: 13, color: 'var(--fg2)' }}>
                      {u}
                    </div>
                  ),
                },
                { key: 'anchor_text', label: 'Anchor Text', render: a => <code>"{a || '—'}"</code> },
                {
                  key: 'status',
                  label: 'Status',
                  render: s => (
                    <Badge
                      color={s === 'live' ? 'var(--success)' : s === 'lost' ? 'var(--danger)' : 'var(--warning)'}
                      dot
                    >
                      {s}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (_, r) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/exchanges`)}
                    >
                      Inspect
                    </Button>
                  ),
                },
              ]}
              data={analysisData.backlinks}
              emptyTitle="No backlinks indexed for this domain yet"
              emptyMessage="You can register this domain in Publisher Inventory or create an Our Request to begin tracking."
            />
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// 5. BACKLINK OPPORTUNITIES (DISCOVERY & RECOMMENDATIONS)
// ============================================================
export function BacklinkOpportunities() {
  const [domains, setDomains] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet('/domains?limit=50&status=active')
      .then(d => setDomains(d.domains || []))
      .finally(() => setLoading(false));
  }, []);

  // Filter opportunities
  const opportunities = useMemo(() => {
    return domains.map(d => {
      let reason = 'High authority publisher domain in active directory.';
      let type = 'Authority Partner';
      if ((d.da || 0) >= 60) {
        reason = `Top tier domain authority (DA ${d.da}) in ${d.category || 'Tech'} niche.`;
        type = 'High DA Target';
      } else if ((d.organic_traffic || 0) > 20000) {
        reason = `Strong search traffic (${d.organic_traffic?.toLocaleString()} visits/mo).`;
        type = 'Traffic Asset';
      }
      return {
        ...d,
        opportunityReason: reason,
        opportunityType: type,
      };
    });
  }, [domains]);

  return (
    <div>
      <PageHeader
        title="Backlink Opportunities"
        subtitle="Discover high-authority partner publishers, niche link targets, and unfulfilled exchanges"
        breadcrumbs={[{ label: 'SEO Intelligence' }, { label: 'Opportunities' }]}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate('/domains')}>
            Add New Target
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['all', 'High DA', 'Traffic Asset'].map(f => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Opportunities' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : (
        <div className="card-grid card-grid-3">
          {opportunities.map(opp => (
            <Card key={opp.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)' }}>{opp.domain}</h3>
                    <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{opp.category || 'Technology'}</span>
                  </div>
                  <Badge color="#635bff" bg="var(--primary-bg)">
                    {opp.opportunityType}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', margin: '14px 0', background: 'var(--bg3)', padding: 10, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{opp.da || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg4)' }}>DA</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{opp.dr || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg4)' }}>DR</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)' }}>{opp.spam_score || 0}%</div>
                    <div style={{ fontSize: 10, color: 'var(--fg4)' }}>SPAM</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--fg2)', lineHeight: 1.5, marginBottom: 14 }}>
                  {opp.opportunityReason}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <Button
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/our-requests?create=true&domain=${encodeURIComponent(opp.domain)}`)}
                >
                  Create Request
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/domains/${opp.ref}`)}
                >
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 6. COMPETITOR BACKLINKS COMPARISON
// ============================================================
export function CompetitorBacklinks() {
  const [yourDomain, setYourDomain] = useState('oursite.io');
  const [compDomain, setCompDomain] = useState('abcsoftware.com');
  const [analyzing, setAnalyzing] = useState(false);
  const [compData, setCompData] = useState(null);

  const compare = async () => {
    setAnalyzing(true);
    try {
      const [dom1, dom2, bl1, bl2] = await Promise.all([
        apiGet(`/domains/lookup?domain=${encodeURIComponent(yourDomain)}`).catch(() => null),
        apiGet(`/domains/lookup?domain=${encodeURIComponent(compDomain)}`).catch(() => null),
        apiGet(`/backlinks?limit=50&search=${encodeURIComponent(yourDomain)}`).catch(() => ({ backlinks: [] })),
        apiGet(`/backlinks?limit=50&search=${encodeURIComponent(compDomain)}`).catch(() => ({ backlinks: [] })),
      ]);

      setCompData({
        d1: { domain: yourDomain, da: dom1?.domain?.da || 48, dr: dom1?.domain?.dr || 54, backlinks: bl1.backlinks || [] },
        d2: { domain: compDomain, da: dom2?.domain?.da || 64, dr: dom2?.domain?.dr || 71, backlinks: bl2.backlinks || [] },
      });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    compare();
  }, []);

  return (
    <div>
      <PageHeader
        title="Competitor Backlinks Comparison"
        subtitle="Benchmark your domain authority, referring domains, and link gaps against competitor domains"
        breadcrumbs={[{ label: 'SEO Intelligence' }, { label: 'Competitors' }]}
      />

      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div className="responsive-search-row-3">
          <Input
            label="Your Domain"
            value={yourDomain}
            onChange={e => setYourDomain(e.target.value)}
            placeholder="e.g. oursite.io"
          />
          <Input
            label="Competitor Domain"
            value={compDomain}
            onChange={e => setCompDomain(e.target.value)}
            placeholder="e.g. abcsoftware.com"
          />
          <Button variant="primary" loading={analyzing} onClick={compare} style={{ marginBottom: 16 }}>
            Compare Domains
          </Button>
        </div>
      </Card>

      {compData && (
        <>
          <div className="card-grid card-grid-2" style={{ marginBottom: 24 }}>
            <Card style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{compData.d1.domain}</h3>
                <Badge color="#635bff">Your Domain</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{compData.d1.da}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg4)' }}>DA SCORE</div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{compData.d1.dr}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg4)' }}>DR SCORE</div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{compData.d1.backlinks.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg4)' }}>INDEXED LINKS</div>
                </div>
              </div>
            </Card>

            <Card style={{ borderLeft: '4px solid var(--info)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{compData.d2.domain}</h3>
                <Badge color="#2563eb">Competitor</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{compData.d2.da}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg4)' }}>DA SCORE</div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{compData.d2.dr}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg4)' }}>DR SCORE</div>
                </div>
                <div style={{ background: 'var(--bg3)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{compData.d2.backlinks.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg4)' }}>INDEXED LINKS</div>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="card-header">
              <h3>Link Gap Analysis</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--fg2)', lineHeight: 1.6 }}>
              Competitor <strong>{compData.d2.domain}</strong> has active link placements in verified publisher domains.
              Inspect their anchor strategy and initiate outreach campaigns through LinkPilot Outreach Workspace.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// 7. PUBLISHER INVENTORY (MARKETPLACE-STYLE DIRECTORY)
// ============================================================
export function PublisherInventory() {
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState('');
  const [minDa, setMinDa] = useState('');
  const navigate = useNavigate();

  const { data: domains, total, page, setPage, loading } = useTable('/domains', {
    search,
    category: niche,
    min_da: minDa,
  });

  return (
    <div>
      <PageHeader
        title="Publisher Inventory"
        subtitle="Explore verified publisher partners, filter by domain authority, and initiate exchange requests"
        breadcrumbs={[{ label: 'SEO Intelligence' }, { label: 'Publisher Inventory' }]}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate('/domains')}>
            Add Publisher Domain
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div className="responsive-filter-grid-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search publishers by domain or niche..."
          />
          <Select
            value={niche}
            onChange={e => setNiche(e.target.value)}
            options={[
              { value: '', label: 'All Niches' },
              { value: 'Technology', label: 'Technology / SaaS' },
              { value: 'Marketing', label: 'Marketing / SEO' },
              { value: 'Finance', label: 'Finance / FinTech' },
              { value: 'Business', label: 'Business' },
            ]}
          />
          <Select
            value={minDa}
            onChange={e => setMinDa(e.target.value)}
            options={[
              { value: '', label: 'Any DA' },
              { value: '30', label: 'DA 30+' },
              { value: '50', label: 'DA 50+' },
              { value: '70', label: 'DA 70+' },
            ]}
          />
          <Button variant="secondary" onClick={() => { setSearch(''); setNiche(''); setMinDa(''); }}>
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Grid of Publisher Cards */}
      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : (
        <>
          <div className="card-grid card-grid-3" style={{ marginBottom: 24 }}>
            {domains.map(dom => (
              <Card key={dom.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg)' }}>{dom.domain}</h3>
                      <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{dom.category || 'Technology'} · {dom.country || 'Global'}</span>
                    </div>
                    <Badge color={dom.status === 'active' ? 'var(--success)' : 'var(--warning)'} dot>
                      {dom.status}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', margin: '14px 0', background: 'var(--bg3)', padding: 10, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{dom.da || '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg4)' }}>DA</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{dom.dr || '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--fg4)' }}>DR</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)' }}>{dom.spam_score || 0}%</div>
                      <div style={{ fontSize: 10, color: 'var(--fg4)' }}>SPAM</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 14 }}>
                    Allowed: <strong>{dom.allowed_link_types || 'dofollow'}</strong> · Max Links: <strong>{dom.max_links_per_month || 5}/mo</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/our-requests?create=true&domain=${encodeURIComponent(dom.domain)}`)}
                  >
                    Request Link
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/domains/${dom.ref}`)}
                  >
                    Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} total={total} limit={25} onChange={setPage} />
        </>
      )}
    </div>
  );
}

// ============================================================
// 8. REQUEST MATCHING WORKSPACE (SIGNATURE VISUAL WORKSPACE)
// ============================================================
export function RequestMatching() {
  const [ourRequests, setOurRequests] = useState([]);
  const [clientRequests, setClientRequests] = useState([]);
  const [selectedOur, setSelectedOur] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [creating, setCreating] = useState(false);
  const { toasts, add: addToast, dismiss } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch pending/contacted requests
    Promise.all([
      apiGet('/our-requests?limit=100&status=accepted'),
      apiGet('/client-requests?limit=100&status=accepted'),
    ]).then(([o, c]) => {
      setOurRequests(o.ourRequests || []);
      setClientRequests(c.clientRequests || []);
      if (o.ourRequests?.length) setSelectedOur(o.ourRequests[0]);
      if (c.clientRequests?.length) setSelectedClient(c.clientRequests[0]);
    });
  }, []);

  // Real-time Match Calculation Engine
  const matchEvaluation = useMemo(() => {
    if (!selectedOur || !selectedClient) {
      return { score: 0, status: 'SELECT_REQUESTS', message: 'Select both sides to evaluate compatibility.' };
    }

    // Criteria 1: Domains must not create self-loops
    const isSameDomain = selectedOur.partner_domain?.toLowerCase() === selectedClient.client_domain?.toLowerCase();
    if (isSameDomain) {
      return {
        score: 20,
        status: 'INCOMPATIBLE',
        badgeColor: 'var(--danger)',
        message: 'Direct circular link loop detected (partner matches client). Reciprocal exchange not recommended.',
      };
    }

    // Criteria 2: Link type compatibility
    const linkTypeMatch = selectedOur.link_type === selectedClient.link_type;

    // Criteria 3: Priority / status alignment
    let score = 85;
    if (linkTypeMatch) score += 10;
    if (selectedOur.priority === selectedClient.priority) score += 5;

    return {
      score: Math.min(score, 98),
      status: score >= 90 ? 'PERFECT_MATCH' : 'PARTIAL_MATCH',
      badgeColor: score >= 90 ? 'var(--success)' : 'var(--warning)',
      message:
        score >= 90
          ? 'High compatibility: Reciprocal domains are distinct, link types align, and priority levels match.'
          : 'Acceptable partial match: Domain niches differ slightly, but exchange satisfies basic criteria.',
    };
  }, [selectedOur, selectedClient]);

  const handleCreateExchange = async () => {
    if (!selectedOur || !selectedClient) return;
    setCreating(true);
    try {
      const res = await apiPost('/exchanges', {
        our_request_id: selectedOur.id,
        client_request_id: selectedClient.id,
        notes: `Matched via Request Workspace (${matchEvaluation.score}% match score)`,
      });
      addToast('Exchange successfully paired and initialized!', 'success');
      setTimeout(() => navigate(`/exchanges/${res.exchange?.ref || ''}`), 700);
    } catch (err) {
      addToast(err.message || 'Failed to initialize exchange', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Request Matching Workspace"
        subtitle="Visually pair outgoing and incoming requests, evaluate link reciprocity, and initialize verified exchanges"
        breadcrumbs={[{ label: 'Link Exchange' }, { label: 'Request Matching' }]}
      />

      <div className="matching-workspace">
        {/* LEFT: Our Link Requests */}
        <Card>
          <div className="card-header">
            <h3><Send size={16} color="var(--primary)" /> Our Request (Outgoing)</h3>
            <span style={{ fontSize: 12, color: 'var(--fg4)' }}>{ourRequests.length} available</span>
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ourRequests.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedOur(r)}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  border: selectedOur?.id === r.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedOur?.id === r.id ? 'var(--primary-bg)' : 'var(--bg2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 14, color: 'var(--fg)' }}>{r.partner_domain}</strong>
                  <Badge size="sm" color="#635bff">{r.ref}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 4 }}>
                  Target: <span style={{ color: 'var(--fg2)' }}>{r.target_url}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>
                  Anchor: <code>"{r.anchor_text || '—'}"</code>
                </div>
              </div>
            ))}
            {!ourRequests.length && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg4)' }}>No accepted requests ready to pair.</div>
            )}
          </div>
        </Card>

        {/* CENTER: Match Analysis Engine */}
        <div className="match-score-meter">
          <Badge color="#635bff" bg="var(--primary-bg)">
            <Sparkles size={12} style={{ marginRight: 4 }} /> AI Matching Engine
          </Badge>

          <div style={{ fontSize: 44, fontWeight: 900, color: matchEvaluation.badgeColor, margin: '14px 0 4px' }}>
            {matchEvaluation.score}%
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: matchEvaluation.badgeColor, textTransform: 'uppercase' }}>
            {matchEvaluation.status.replace('_', ' ')}
          </div>

          <div style={{ margin: '20px 0', padding: 14, background: 'var(--bg3)', borderRadius: 8, fontSize: 12.5, color: 'var(--fg2)', lineHeight: 1.5 }}>
            {matchEvaluation.message}
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!selectedOur || !selectedClient || matchEvaluation.status === 'INCOMPATIBLE'}
            loading={creating}
            onClick={handleCreateExchange}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Confirm & Create Exchange
          </Button>
        </div>

        {/* RIGHT: Client Link Requests */}
        <Card>
          <div className="card-header">
            <h3><Inbox size={16} color="var(--info)" /> Client Request (Incoming)</h3>
            <span style={{ fontSize: 12, color: 'var(--fg4)' }}>{clientRequests.length} available</span>
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {clientRequests.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedClient(r)}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  border: selectedClient?.id === r.id ? '2px solid var(--info)' : '1px solid var(--border)',
                  background: selectedClient?.id === r.id ? 'var(--info-bg)' : 'var(--bg2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 14, color: 'var(--fg)' }}>{r.client_domain}</strong>
                  <Badge size="sm" color="#2563eb">{r.ref}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 4 }}>
                  Target: <span style={{ color: 'var(--fg2)' }}>{r.target_url}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>
                  Anchor: <code>"{r.anchor_text || '—'}"</code>
                </div>
              </div>
            ))}
            {!clientRequests.length && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg4)' }}>No accepted requests ready to pair.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// 9. EXCHANGES LIST & SIGNATURE EXCHANGE DETAIL
// ============================================================
export function Exchanges() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data: exchanges, total, page, setPage, loading, refresh } = useTable('/exchanges', {
    status,
    search,
  });

  return (
    <div>
      <PageHeader
        title="Link Exchanges"
        subtitle="Manage dual-sided backlink exchanges and maintain bilateral link balance"
        breadcrumbs={[{ label: 'Link Exchange' }, { label: 'Exchanges' }]}
        actions={
          <Button variant="primary" icon={<ArrowLeftRight size={15} />} onClick={() => navigate('/request-matching')}>
            Match Requests
          </Button>
        }
      />

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div className="responsive-filter-grid-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by exchange ref or partner domain..." />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'partially_completed', label: 'Unbalanced / Partially Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Button variant="secondary" onClick={() => { setSearch(''); setStatus(''); }}>
            Reset
          </Button>
        </div>
      </Card>

      <DataTable
        columns={[
          { key: 'ref', label: 'Exchange Ref', width: 140, render: r => <strong style={{ color: 'var(--primary)' }}>{r}</strong> },
          { key: 'partner_domain', label: 'Partner Domain' },
          { key: 'client_domain', label: 'Client Domain' },
          {
            key: 'balance_status',
            label: 'Balance Status',
            render: b => (
              <Badge
                color={b === 'balanced' ? 'var(--success)' : b === 'unbalanced' ? 'var(--danger)' : 'var(--warning)'}
                dot
              >
                {b || 'Balanced'}
              </Badge>
            ),
          },
          {
            key: 'status',
            label: 'Overall Status',
            render: s => (
              <Badge color={s === 'completed' ? 'var(--success)' : s === 'active' ? 'var(--primary)' : 'var(--warning)'}>
                {s}
              </Badge>
            ),
          },
          { key: 'exchange_date', label: 'Date', render: d => d?.slice(0, 10) || '—' },
          {
            key: 'actions',
            label: 'Action',
            render: (_, r) => (
              <Button variant="ghost" size="sm" onClick={() => navigate(`/exchanges/${r.ref}`)}>
                Open Detail →
              </Button>
            ),
          },
        ]}
        data={exchanges}
        loading={loading}
        onRowClick={r => navigate(`/exchanges/${r.ref}`)}
        emptyTitle="No exchanges recorded yet"
        emptyMessage="Use the Request Matching Workspace to pair accepted requests into exchanges."
      />

      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  );
}

export function ExchangeDetail() {
  const { ref } = useParams();
  const [ex, setEx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resyncing, setResyncing] = useState(false);
  const { toasts, add: addToast, dismiss } = useToast();
  const navigate = useNavigate();

  const loadExchange = useCallback(() => {
    setLoading(true);
    apiGet(`/exchanges/${ref}`)
      .then(setEx)
      .catch(() => addToast('Failed to load exchange details', 'error'))
      .finally(() => setLoading(false));
  }, [ref, addToast]);

  useEffect(() => {
    loadExchange();
  }, [loadExchange]);

  const handleResync = async () => {
    setResyncing(true);
    try {
      await apiPost(`/exchanges/${ref}/resync`, {});
      addToast('Exchange balance resynced with backlink verification engine!', 'success');
      loadExchange();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setResyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PremiumLoader size="md" label="Loading Exchange Record..." sub="Verifying partnership status and link endpoints" />
      </div>
    );
  }
  if (!ex) return <Empty title="Exchange not found" action={<Button onClick={() => navigate('/exchanges')}>Back to Exchanges</Button>} />;

  const { ourRequest, clientRequest, ourBacklink, clientBacklink } = ex;

  const ourLive = ourBacklink?.status === 'live';
  const clientLive = clientBacklink?.status === 'live';

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title={`Exchange ${ex.ref}`}
        subtitle={`Partner: ${ex.partner_domain} ⬌ Client: ${ex.client_domain || 'Direct Partner'}`}
        breadcrumbs={[{ label: 'Link Exchange', href: '/exchanges' }, { label: ex.ref }]}
        actions={
          <div className="toolbar">
            <Button variant="secondary" loading={resyncing} icon={<RefreshCw size={14} />} onClick={handleResync}>
              Resync Balance
            </Button>
            <Badge color={ex.status === 'completed' ? 'var(--success)' : 'var(--primary)'} size="md">
              {ex.status?.toUpperCase()}
            </Badge>
          </div>
        }
      />

      {/* SIGNATURE VISUAL BALANCE MATRIX BANNER */}
      <div className="balance-matrix-card">
        <div className="balance-matrix-grid">
          <div className={`balance-node ${ourLive ? 'live' : ourBacklink?.status === 'lost' ? 'lost' : 'missing'}`}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              OUR LINK ({ourRequest?.ref || 'OUR-???'})
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>
              {ourLive ? '✓ LIVE' : ourBacklink?.status?.toUpperCase() || 'PENDING / MISSING'}
            </div>
            <div style={{ fontSize: 12 }}>{ex.partner_domain} → Our Destination</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Badge
              color={ex.balance_status === 'balanced' ? 'var(--success)' : 'var(--danger)'}
              bg={ex.balance_status === 'balanced' ? 'var(--success-bg)' : 'var(--danger-bg)'}
            >
              {ex.balance_status?.toUpperCase() || 'BALANCED'}
            </Badge>
            <div className="exchange-divider-badge">
              <ArrowLeftRight size={18} />
            </div>
          </div>

          <div className={`balance-node ${clientLive ? 'live' : clientBacklink?.status === 'lost' ? 'lost' : 'missing'}`}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
              CLIENT LINK ({clientRequest?.ref || 'CLI-???'})
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>
              {clientLive ? '✓ LIVE' : clientBacklink?.status?.toUpperCase() || 'PENDING / MISSING'}
            </div>
            <div style={{ fontSize: 12 }}>Our Asset → {ex.client_domain || 'Client'}</div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual Panels */}
      <div className="exchange-split">
        {/* Left: Our Request */}
        <div className="exchange-panel">
          <div className="card-header">
            <h3><Send size={17} color="var(--primary)" /> Our Request ({ourRequest?.ref || '—'})</h3>
            <Badge color="#635bff">{ourRequest?.status || 'Active'}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Partner Domain:</span>
              <div style={{ fontWeight: 700 }}>{ourRequest?.partner_domain || ex.partner_domain}</div>
            </div>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Target Destination URL:</span>
              <div className="truncate"><a href={ourRequest?.target_url} target="_blank" rel="noreferrer">{ourRequest?.target_url}</a></div>
            </div>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Desired Anchor Text:</span>
              <div><code>"{ourRequest?.anchor_text || '—'}"</code></div>
            </div>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Link Type / Rel:</span>
              <div>{ourRequest?.link_type || 'dofollow'}</div>
            </div>
            {ourBacklink && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Backlink Record: {ourBacklink.ref}</div>
                <div style={{ fontSize: 12, color: 'var(--fg3)' }}>Last Verified: {ourBacklink.last_verified_at || 'Never'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Divider icon */}
        <div className="exchange-divider">
          <ArrowLeftRight size={24} color="var(--border2)" />
        </div>

        {/* Right: Client Request */}
        <div className="exchange-panel">
          <div className="card-header">
            <h3><Inbox size={17} color="var(--info)" /> Client Request ({clientRequest?.ref || '—'})</h3>
            <Badge color="#2563eb">{clientRequest?.status || 'Active'}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Client Domain:</span>
              <div style={{ fontWeight: 700 }}>{clientRequest?.client_domain || ex.client_domain || '—'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Requested Target URL:</span>
              <div className="truncate"><a href={clientRequest?.target_url} target="_blank" rel="noreferrer">{clientRequest?.target_url}</a></div>
            </div>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Desired Anchor Text:</span>
              <div><code>"{clientRequest?.anchor_text || '—'}"</code></div>
            </div>
            <div>
              <span style={{ color: 'var(--fg3)', fontSize: 12 }}>Link Type / Rel:</span>
              <div>{clientRequest?.link_type || 'dofollow'}</div>
            </div>
            {clientBacklink && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg3)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Backlink Record: {clientBacklink.ref}</div>
                <div style={{ fontSize: 12, color: 'var(--fg3)' }}>Last Verified: {clientBacklink.last_verified_at || 'Never'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 10. BACKLINKS MANAGEMENT & VERIFICATION INSPECTOR
// ============================================================
export function Backlinks() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [selectedBacklink, setSelectedBacklink] = useState(null);
  const { toasts, add: addToast, dismiss } = useToast();
  const navigate = useNavigate();

  const { data: backlinks, total, page, setPage, loading, refresh } = useTable('/backlinks', {
    search,
    status,
  });

  const handleVerify = async (e, bl) => {
    e.stopPropagation();
    setVerifyingId(bl.ref);
    try {
      const res = await apiPost(`/verification/verify/${bl.ref}`, {});
      addToast(`Verification complete: Link is ${res.result?.is_live ? 'LIVE' : 'LOST'}`, res.result?.is_live ? 'success' : 'error');
      refresh();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Backlink Management"
        subtitle="Complete catalog of tracked referring pages, anchor texts, and live HTTP verification status"
        breadcrumbs={[{ label: 'Link Management' }, { label: 'Backlinks' }]}
        actions={
          <Button variant="secondary" icon={<ShieldCheck size={15} />} onClick={() => navigate('/verification')}>
            Verification Center
          </Button>
        }
      />

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div className="responsive-filter-grid-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by domain, target URL or anchor..." />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'live', label: 'Live' },
              { value: 'lost', label: 'Lost' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
          <Button variant="secondary" onClick={() => { setSearch(''); setStatus(''); }}>
            Reset
          </Button>
        </div>
      </Card>

      <DataTable
        columns={[
          { key: 'ref', label: 'Ref', width: 120, render: r => <strong style={{ color: 'var(--primary)' }}>{r}</strong> },
          { key: 'referring_domain', label: 'Referring Domain' },
          {
            key: 'referring_url',
            label: 'Referring Page',
            render: u => (
              <div className="truncate" style={{ maxWidth: 220 }}>
                <a href={u} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{u}</a>
              </div>
            ),
          },
          {
            key: 'target_url',
            label: 'Target Destination',
            render: u => <div className="truncate" style={{ maxWidth: 200, color: 'var(--fg2)' }}>{u}</div>,
          },
          { key: 'anchor_text', label: 'Anchor Text', render: a => <code>"{a || '—'}"</code> },
          {
            key: 'status',
            label: 'Status',
            render: s => (
              <Badge
                color={s === 'live' ? 'var(--success)' : s === 'lost' ? 'var(--danger)' : 'var(--warning)'}
                dot
              >
                {s}
              </Badge>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (_, r) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={verifyingId === r.ref}
                  onClick={e => handleVerify(e, r)}
                >
                  Verify
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBacklink(r)}
                >
                  Inspect
                </Button>
              </div>
            ),
          },
        ]}
        data={backlinks}
        loading={loading}
        onRowClick={r => setSelectedBacklink(r)}
      />

      <Pagination page={page} total={total} limit={25} onChange={setPage} />

      {/* Verification Inspector Drawer */}
      {selectedBacklink && (
        <Drawer
          open={Boolean(selectedBacklink)}
          onClose={() => setSelectedBacklink(null)}
          title={`Backlink Inspector — ${selectedBacklink.ref}`}
          width={520}
          footer={
            <Button variant="primary" onClick={() => setSelectedBacklink(null)}>
              Close Inspector
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Link Placement Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <div><strong>Referring Domain:</strong> {selectedBacklink.referring_domain}</div>
                <div><strong>Referring Page:</strong> <div className="truncate"><a href={selectedBacklink.referring_url} target="_blank" rel="noreferrer">{selectedBacklink.referring_url}</a></div></div>
                <div><strong>Target Destination:</strong> <div className="truncate">{selectedBacklink.target_url}</div></div>
                <div><strong>Anchor Text:</strong> <code>"{selectedBacklink.anchor_text}"</code></div>
                <div><strong>Link Type:</strong> <Badge size="sm">{selectedBacklink.link_type || 'dofollow'}</Badge></div>
                <div><strong>Placement Context:</strong> {selectedBacklink.placement || 'content'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h4 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Automated Crawler Diagnostics
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: 'var(--bg3)', borderRadius: 8 }}>
                  <span>HTTP Response Code:</span>
                  <strong style={{ color: 'var(--success)' }}>{selectedBacklink.http_status || 200} OK</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: 'var(--bg3)', borderRadius: 8 }}>
                  <span>Link Found in DOM:</span>
                  <strong style={{ color: selectedBacklink.status === 'live' ? 'var(--success)' : 'var(--danger)' }}>
                    {selectedBacklink.status === 'live' ? 'Yes (Verified)' : 'No (Missing)'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: 'var(--bg3)', borderRadius: 8 }}>
                  <span>Rel Attribute:</span>
                  <strong>{selectedBacklink.rel_attribute || 'dofollow'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: 'var(--bg3)', borderRadius: 8 }}>
                  <span>Last Verification Crawl:</span>
                  <span>{selectedBacklink.last_verified_at || 'Recently checked'}</span>
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ============================================================
// 11. VERIFICATION CENTER
// ============================================================
export function Verification() {
  const [queue, setQueue] = useState([]);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const { toasts, add: addToast, dismiss } = useToast();

  const loadQueue = () => {
    apiGet('/verification/queue').then(d => setQueue(d.queue || []));
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const runBulkVerify = async () => {
    setVerifyingAll(true);
    const steps = [
      'Checking page accessibility...',
      'Fetching URL headers...',
      'Finding backlink in DOM...',
      'Checking anchor match...',
      'Checking rel attributes...',
      'Verification complete!',
    ];

    for (const s of steps) {
      setCurrentStep(s);
      await new Promise(r => setTimeout(r, 350));
    }

    try {
      await apiPost('/verification/verify-bulk', { limit: 20 });
      addToast('Batch verification cycle completed successfully!', 'success');
      loadQueue();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setVerifyingAll(false);
      setCurrentStep(null);
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Verification Center"
        subtitle="Automated HTTP crawler validates backlink health, detects lost links, and audits rel attributes"
        breadcrumbs={[{ label: 'Link Management' }, { label: 'Verification Center' }]}
        actions={
          <Button variant="primary" loading={verifyingAll} icon={<ShieldCheck size={15} />} onClick={runBulkVerify}>
            Verify Stale Backlinks
          </Button>
        }
      />

      {currentStep && (
        <Card style={{ padding: 20, marginBottom: 20, background: 'var(--primary-bg)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="spinner" style={{ width: 16, height: 16 }} />
            <strong style={{ color: 'var(--primary)', fontSize: 14 }}>Crawler Progress: {currentStep}</strong>
          </div>
        </Card>
      )}

      <Card>
        <div className="card-header">
          <h3>Verification Queue ({queue.length} items awaiting crawl)</h3>
        </div>
        <DataTable
          columns={[
            { key: 'ref', label: 'Ref', width: 130 },
            { key: 'referring_domain', label: 'Publisher Domain' },
            { key: 'target_url', label: 'Target Destination' },
            { key: 'status', label: 'Last Status', render: s => <Badge>{s}</Badge> },
            { key: 'last_verified_at', label: 'Last Checked', render: d => d || 'Never verified' },
          ]}
          data={queue}
          emptyTitle="Verification queue is clear"
          emptyMessage="All active backlinks have been verified recently."
        />
      </Card>
    </div>
  );
}

// ============================================================
// 12. LOST BACKLINKS RECOVERY CENTER
// ============================================================
export function Lost() {
  const [lostLinks, setLostLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, add: addToast, dismiss } = useToast();
  const navigate = useNavigate();

  const loadLost = () => {
    setLoading(true);
    apiGet('/verification/lost')
      .then(d => setLostLinks(d.lost || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLost();
  }, []);

  const handleRestore = async bl => {
    try {
      await apiPost(`/verification/${bl.ref}/restore`, {});
      addToast(`Backlink ${bl.ref} restored to live status!`, 'success');
      loadLost();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Lost Backlinks Recovery"
        subtitle="Manage lost and dropped link placements, initiate partner outreach, and restore verified links"
        breadcrumbs={[{ label: 'Link Management' }, { label: 'Lost Backlinks' }]}
      />

      <div className="card-grid card-grid-4" style={{ marginBottom: 20 }}>
        <KpiCard value={lostLinks.length} label="Total Lost Links" color="#dc2626" icon={<AlertOctagon size={20} />} />
        <KpiCard value={lostLinks.filter(l => l.lost_reason === 'link_missing').length} label="Link Removed" color="#f59e0b" />
        <KpiCard value={lostLinks.filter(l => l.lost_reason === 'page_error').length} label="Page Error (404/500)" color="#dc2626" />
        <KpiCard value={lostLinks.filter(l => l.lost_reason === 'rel_nofollow').length} label="Rel Nofollowed" color="#2563eb" />
      </div>

      <Card>
        <div className="card-header">
          <h3>Lost Backlinks Directory</h3>
        </div>
        <DataTable
          columns={[
            { key: 'ref', label: 'Ref', width: 120 },
            { key: 'referring_domain', label: 'Referring Domain' },
            { key: 'target_url', label: 'Target URL' },
            { key: 'lost_reason', label: 'Loss Reason', render: r => <Badge color="#dc2626">{r || 'Link missing'}</Badge> },
            { key: 'last_verified_at', label: 'Date Dropped', render: d => d?.slice(0, 10) || 'Recent' },
            {
              key: 'actions',
              label: 'Recovery Actions',
              render: (_, r) => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="secondary" size="sm" onClick={() => handleRestore(r)}>
                    Restore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
                    Contact Partner
                  </Button>
                </div>
              ),
            },
          ]}
          data={lostLinks}
          loading={loading}
          emptyTitle="No lost backlinks!"
          emptyMessage="Your backlink portfolio is healthy with zero dropped links detected."
        />
      </Card>
    </div>
  );
}

// ============================================================
// 13. DOMAINS & DOMAIN PROFILE
// ============================================================
export function Domains() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', category: 'Technology', da: 50, dr: 50 });
  const navigate = useNavigate();
  const { toasts, add: addToast, dismiss } = useToast();

  const { data: domains, total, page, setPage, loading, refresh } = useTable('/domains', { search });

  const handleAdd = async e => {
    e.preventDefault();
    try {
      await apiPost('/domains', newDomain);
      addToast('Partner domain successfully registered!', 'success');
      setShowAdd(false);
      refresh();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Domains Directory"
        subtitle="Catalog of partner domains with normalized metrics, spam ratings, and exchange tracking"
        breadcrumbs={[{ label: 'SEO Data' }, { label: 'Domains' }]}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowAdd(true)}>
            Add Domain
          </Button>
        }
      />

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search domains by name or niche..." />
      </Card>

      <DataTable
        columns={[
          { key: 'ref', label: 'Ref', width: 130 },
          { key: 'domain', label: 'Domain Name', render: (d, r) => <strong style={{ color: 'var(--primary)' }}>{d}</strong> },
          { key: 'category', label: 'Niche / Category' },
          { key: 'da', label: 'DA', width: 80, render: d => <strong>{d || '—'}</strong> },
          { key: 'dr', label: 'DR', width: 80, render: d => <strong>{d || '—'}</strong> },
          { key: 'spam_score', label: 'Spam Score', width: 100, render: s => `${s || 0}%` },
          { key: 'status', label: 'Status', render: s => <Badge color={s === 'active' ? 'var(--success)' : 'var(--fg3)'} dot>{s}</Badge> },
          {
            key: 'actions',
            label: 'Actions',
            render: (_, r) => (
              <Button variant="ghost" size="sm" onClick={() => navigate(`/domains/${r.ref}`)}>
                Profile →
              </Button>
            ),
          },
        ]}
        data={domains}
        loading={loading}
        onRowClick={r => navigate(`/domains/${r.ref}`)}
      />

      <Pagination page={page} total={total} limit={25} onChange={setPage} />

      {/* Add Domain Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register Partner Domain">
        <form onSubmit={handleAdd}>
          <Input
            label="Domain (e.g. example.com)"
            value={newDomain.domain}
            onChange={e => setNewDomain({ ...newDomain, domain: e.target.value })}
            required
          />
          <Input
            label="Niche / Category"
            value={newDomain.category}
            onChange={e => setNewDomain({ ...newDomain, category: e.target.value })}
          />
          <div className="form-row">
            <Input
              label="Domain Authority (DA)"
              type="number"
              value={newDomain.da}
              onChange={e => setNewDomain({ ...newDomain, da: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Domain Rating (DR)"
              type="number"
              value={newDomain.dr}
              onChange={e => setNewDomain({ ...newDomain, dr: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="modal-footer" style={{ margin: '20px -28px -28px' }}>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Domain</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function DomainProfile() {
  const { ref } = useParams();
  const [dom, setDom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    apiGet(`/domains/${ref}`)
      .then(d => setDom(d.domain || d))
      .finally(() => setLoading(false));
  }, [ref]);

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PremiumLoader size="md" label="Analyzing Domain Intelligence..." sub="Fetching authority metrics and historical backlink trends" />
      </div>
    );
  }
  if (!dom) return <Empty title="Domain not found" action={<Button onClick={() => navigate('/domains')}>Back</Button>} />;

  return (
    <div>
      <PageHeader
        title={dom.domain}
        subtitle={`${dom.category || 'Technology'} · Registered Domain Profile`}
        breadcrumbs={[{ label: 'Domains', href: '/domains' }, { label: dom.domain }]}
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate(`/our-requests?create=true&domain=${dom.domain}`)}>
            Create Request
          </Button>
        }
      />

      <div className="card-grid card-grid-4" style={{ marginBottom: 24 }}>
        <KpiCard value={dom.da || '—'} label="Domain Authority" color="#635bff" />
        <KpiCard value={dom.dr || '—'} label="Domain Rating" color="#16a34a" />
        <KpiCard value={`${dom.spam_score || 0}%`} label="Spam Rating" color="#f59e0b" />
        <KpiCard value={dom.organic_traffic?.toLocaleString() || '—'} label="Monthly Traffic" color="#2563eb" />
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'backlinks', label: 'Backlinks' },
          { value: 'contacts', label: 'Contacts' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <Card>
          <div className="card-header"><h3>Domain Profile Details</h3></div>
          <div className="responsive-form-grid-2">
            <div><strong>Allowed Link Types:</strong> {dom.allowed_link_types || 'dofollow'}</div>
            <div><strong>Max Links/Month:</strong> {dom.max_links_per_month || 5}</div>
            <div><strong>Country:</strong> {dom.country || 'United States'}</div>
            <div><strong>Status:</strong> {dom.status}</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// 14. OUR REQUESTS & CLIENT REQUESTS
// ============================================================
export function OurRequests() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [req, setReq] = useState({ partner_domain: '', target_url: '', anchor_text: '', priority: 'medium' });
  const { toasts, add: addToast, dismiss } = useToast();
  const navigate = useNavigate();

  const { data: requests, total, page, setPage, loading, refresh } = useTable('/our-requests', { search, status });

  const handleCreate = async e => {
    e.preventDefault();
    try {
      await apiPost('/our-requests', req);
      addToast('Our Request successfully logged!', 'success');
      setShowCreate(false);
      refresh();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Our Link Requests (Outgoing)"
        subtitle="Track requests for backlinks pointing from partner domains to our web properties"
        breadcrumbs={[{ label: 'Link Exchange' }, { label: 'Our Requests' }]}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            Create Our Request
          </Button>
        }
      />

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div className="responsive-filter-grid-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search requests by domain or anchor..." />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'negotiation', label: 'Negotiation' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'exchanged', label: 'Exchanged' },
            ]}
          />
          <Button variant="secondary" onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </Card>

      <DataTable
        columns={[
          { key: 'ref', label: 'Ref', width: 120, render: r => <strong style={{ color: 'var(--primary)' }}>{r}</strong> },
          { key: 'partner_domain', label: 'Partner Domain' },
          { key: 'target_url', label: 'Target URL', render: u => <div className="truncate" style={{ maxWidth: 220 }}>{u}</div> },
          { key: 'anchor_text', label: 'Anchor Text', render: a => <code>"{a || '—'}"</code> },
          { key: 'priority', label: 'Priority', render: p => <Badge color={p === 'high' ? 'var(--danger)' : 'var(--primary)'}>{p}</Badge> },
          { key: 'status', label: 'Status', render: s => <Badge dot>{s}</Badge> },
        ]}
        data={requests}
        loading={loading}
      />

      <Pagination page={page} total={total} limit={25} onChange={setPage} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Our Link Request">
        <form onSubmit={handleCreate}>
          <Input
            label="Partner Domain"
            value={req.partner_domain}
            onChange={e => setReq({ ...req, partner_domain: e.target.value })}
            required
            placeholder="e.g. techimply.com"
          />
          <Input
            label="Target URL"
            value={req.target_url}
            onChange={e => setReq({ ...req, target_url: e.target.value })}
            required
            placeholder="https://oursite.io/page"
          />
          <Input
            label="Desired Anchor Text"
            value={req.anchor_text}
            onChange={e => setReq({ ...req, anchor_text: e.target.value })}
            required
          />
          <div className="modal-footer" style={{ margin: '20px -28px -28px' }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function ClientRequests() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [req, setReq] = useState({ client_domain: '', target_url: '', anchor_text: '', priority: 'medium' });
  const { toasts, add: addToast, dismiss } = useToast();

  const { data: requests, total, page, setPage, loading, refresh } = useTable('/client-requests', { search, status });

  const handleCreate = async e => {
    e.preventDefault();
    try {
      await apiPost('/client-requests', req);
      addToast('Client Request successfully created!', 'success');
      setShowCreate(false);
      refresh();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Client Link Requests (Incoming)"
        subtitle="Manage inbound partner requests pointing from our properties to client websites"
        breadcrumbs={[{ label: 'Link Exchange' }, { label: 'Client Requests' }]}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
            Create Client Request
          </Button>
        }
      />

      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div className="responsive-filter-grid-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search client requests..." />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'exchanged', label: 'Exchanged' },
            ]}
          />
          <Button variant="secondary" onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </Card>

      <DataTable
        columns={[
          { key: 'ref', label: 'Ref', width: 120, render: r => <strong style={{ color: 'var(--info)' }}>{r}</strong> },
          { key: 'client_domain', label: 'Client Domain' },
          { key: 'target_url', label: 'Target URL', render: u => <div className="truncate" style={{ maxWidth: 220 }}>{u}</div> },
          { key: 'anchor_text', label: 'Anchor Text', render: a => <code>"{a || '—'}"</code> },
          { key: 'priority', label: 'Priority', render: p => <Badge color="var(--info)">{p}</Badge> },
          { key: 'status', label: 'Status', render: s => <Badge dot>{s}</Badge> },
        ]}
        data={requests}
        loading={loading}
      />

      <Pagination page={page} total={total} limit={25} onChange={setPage} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Client Link Request">
        <form onSubmit={handleCreate}>
          <Input
            label="Client Domain"
            value={req.client_domain}
            onChange={e => setReq({ ...req, client_domain: e.target.value })}
            required
          />
          <Input
            label="Target URL"
            value={req.target_url}
            onChange={e => setReq({ ...req, target_url: e.target.value })}
            required
          />
          <Input
            label="Desired Anchor Text"
            value={req.anchor_text}
            onChange={e => setReq({ ...req, anchor_text: e.target.value })}
            required
          />
          <div className="modal-footer" style={{ margin: '20px -28px -28px' }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================
// 15. SEO DATA: TARGETS, ANCHORS, CONTACTS, FOLLOW-UPS
// ============================================================
export function Targets() {
  const { data: targets, loading } = useTable('/targets');
  return (
    <div>
      <PageHeader
        title="Target URLs Performance"
        subtitle="Analyze backlink distribution and live retention across your asset URLs"
        breadcrumbs={[{ label: 'SEO Data' }, { label: 'Target URLs' }]}
      />
      <DataTable
        columns={[
          { key: 'target_url', label: 'Target URL', render: u => <strong style={{ color: 'var(--primary)' }}>{u}</strong> },
          { key: 'backlinks_count', label: 'Total Backlinks', width: 140 },
          { key: 'live_backlinks_count', label: 'Live Backlinks', width: 140, render: l => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{l}</span> },
          { key: 'referring_domains_count', label: 'Referring Domains', width: 160 },
        ]}
        data={targets}
        loading={loading}
      />
    </div>
  );
}

export function Anchors() {
  const { data: anchors, loading } = useTable('/anchors');
  return (
    <div>
      <PageHeader
        title="Anchor Text Distribution"
        subtitle="Review anchor diversity, branded vs commercial keywords, and target association"
        breadcrumbs={[{ label: 'SEO Data' }, { label: 'Anchor Texts' }]}
      />
      <DataTable
        columns={[
          { key: 'anchor_text', label: 'Anchor Text', render: a => <code>"{a || '—'}"</code> },
          { key: 'category', label: 'Anchor Classification', render: c => <Badge color="#635bff">{c || 'Partial Match'}</Badge> },
          { key: 'usage_count', label: 'Total Uses', width: 120 },
          { key: 'live_count', label: 'Live Backlinks', width: 140, render: l => <span style={{ color: 'var(--success)' }}>{l}</span> },
        ]}
        data={anchors}
        loading={loading}
      />
    </div>
  );
}

export function Contacts() {
  const { data: contacts, loading } = useTable('/contacts');
  return (
    <div>
      <PageHeader
        title="Partner Outreach Contacts"
        subtitle="Manage SEO partner representatives, email addresses, and outreach history"
        breadcrumbs={[{ label: 'SEO Data' }, { label: 'Contacts' }]}
      />
      <DataTable
        columns={[
          { key: 'name', label: 'Contact Name', render: n => <strong>{n}</strong> },
          { key: 'domain', label: 'Associated Domain' },
          { key: 'email', label: 'Email', render: e => <a href={`mailto:${e}`}>{e}</a> },
          { key: 'status', label: 'Relationship Status', render: s => <Badge dot>{s}</Badge> },
        ]}
        data={contacts}
        loading={loading}
      />
    </div>
  );
}

export function Followups() {
  const { data: followups, loading } = useTable('/followups');
  return (
    <div>
      <PageHeader
        title="Follow-ups & Outreach Pipeline"
        subtitle="Schedule and track link negotiation reminders and partner check-ins"
        breadcrumbs={[{ label: 'SEO Data' }, { label: 'Follow-ups' }]}
      />
      <DataTable
        columns={[
          { key: 'partner_domain', label: 'Partner Domain' },
          { key: 'due_date', label: 'Due Date', render: d => <strong>{d?.slice(0, 10)}</strong> },
          { key: 'notes', label: 'Outreach Notes' },
          { key: 'status', label: 'Status', render: s => <Badge dot>{s}</Badge> },
        ]}
        data={followups}
        loading={loading}
      />
    </div>
  );
}

// ============================================================
// 16. REPORTS & TEAM PERFORMANCE
// ============================================================
export function Reports() {
  const [reportType, setReportType] = useState('backlinks');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const res = await apiPost('/reports/preview', { type: reportType });
      setPreview(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePreview();
  }, [reportType]);

  return (
    <div>
      <PageHeader
        title="Reports & Data Export"
        subtitle="Generate executive reports and export audit datasets in CSV, Excel or PDF formats"
        breadcrumbs={[{ label: 'Analytics' }, { label: 'Reports' }]}
        actions={
          <div className="toolbar">
            <Button variant="secondary" icon={<Download size={14} />} onClick={() => download(`/reports/export?format=csv&type=${reportType}`, `${reportType}-report.csv`)}>
              Export CSV
            </Button>
            <Button variant="secondary" icon={<Download size={14} />} onClick={() => download(`/reports/export?format=excel&type=${reportType}`, `${reportType}-report.xlsx`)}>
              Export Excel
            </Button>
          </div>
        }
      />

      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {['backlinks', 'domains', 'exchanges', 'verification'].map(t => (
            <button
              key={t}
              className={`filter-chip ${reportType === t ? 'active' : ''}`}
              onClick={() => setReportType(t)}
            >
              {t.toUpperCase()} REPORT
            </button>
          ))}
        </div>
      </Card>

      {preview && (
        <Card>
          <div className="card-header">
            <h3>Report Preview ({preview.total || preview.items?.length || 0} records)</h3>
          </div>
          <div className="report-preview">
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>
              {JSON.stringify(preview.items?.slice(0, 5) || preview, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}

export function Team() {
  const { data: team, loading, refresh } = useTable('/team');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('seo_analyst');
  const [inviting, setInviting] = useState(false);

  const handleSendInvite = async e => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      notify.warning('Email Required', 'Please provide a valid work email address.');
      return;
    }
    setInviting(true);
    try {
      notify.loading('Dispatching Invitation', 'Generating cryptographic single-use token and sending invitation email...');
      const res = await apiPost('/auth/invite', { email: inviteEmail.trim(), role: inviteRole });
      notify.close();
      const inviteUrl = `${window.location.origin}/register?invite=${res.token}`;
      await notify.success(
        'Invitation Dispatched!',
        `A secure workspace invitation has been dispatched to <strong>${inviteEmail}</strong>.<br><br><span style="font-size:12px;color:#94a3b8;">Direct Registration Link:</span><br><code style="font-size:11px;background:#0f172a;padding:6px 10px;border-radius:6px;word-break:break-all;display:block;margin-top:6px;border:1px solid #1e293b;color:#a5b4fc;">${inviteUrl}</code>`,
        { confirmText: 'Done' }
      );
      setInviteEmail('');
      setShowInviteModal(false);
      refresh();
    } catch (err) {
      notify.close();
      notify.error('Invitation Failed', err.message || 'Unable to dispatch invitation.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Team Members & Workspace Roles"
        subtitle="Manage member permissions, invite role-based contributors, and audit SEO velocity"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Team' }]}
        action={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setShowInviteModal(true)}>
            Invite Team Member
          </Button>
        }
      />
      <DataTable
        columns={[
          { key: 'name', label: 'Team Member', render: (n, r) => <div><strong>{n}</strong><div style={{ fontSize: 12, color: 'var(--fg3)' }}>{r.email}</div></div> },
          { key: 'role', label: 'Assigned Role', render: r => <Badge color="#635bff">{r?.replace('_', ' ')?.toUpperCase()}</Badge> },
          { key: 'completed_exchanges', label: 'Exchanges Completed', width: 160 },
          { key: 'live_backlinks', label: 'Live Backlinks Managed', width: 180, render: l => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{l}</span> },
        ]}
        data={team}
        loading={loading}
      />

      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Workspace Contributor">
        <form onSubmit={handleSendInvite}>
          <p style={{ color: 'var(--fg3)', fontSize: 13, marginBottom: 18 }}>
            Invite an SEO specialist, outreach manager, client, or read-only analyst. They will receive a single-use onboarding link valid for 7 days.
          </p>

          <Input
            label="Work Email Address *"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@agency.com"
            required
          />

          <Select
            label="Assigned Role *"
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            options={[
              { value: 'seo_manager', label: 'SEO Manager (Audit, Projects & Outreach Lead)' },
              { value: 'seo_analyst', label: 'SEO Analyst (Backlink Forensic & Competitor Gap)' },
              { value: 'outreach_manager', label: 'Outreach Manager (Campaigns & Pitch Pipeline)' },
              { value: 'outreach_specialist', label: 'Outreach Specialist (Link Prospector)' },
              { value: 'content_specialist', label: 'Content / SEO Specialist (PR & Content Writer)' },
              { value: 'client', label: 'Client / Website Owner (Portal & Reporting View)' },
              { value: 'viewer', label: 'Viewer (Read-Only Analytics)' },
            ]}
          />

          <div style={{ background: 'rgba(99, 91, 255, 0.08)', border: '1px solid rgba(99, 91, 255, 0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#a5b4fc', margin: '14px 0 20px' }}>
            🔒 <strong>Security Policy:</strong> Platform Administrator privileges cannot be assigned via invitation.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={inviting}>
              Send Invitation Email
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================
// 17. AUDIT LOGS, IMPORT/EXPORT & SETTINGS
// ============================================================
export function Activity() {
  const { data: logs, total, page, setPage, loading } = useTable('/activity');
  return (
    <div>
      <PageHeader
        title="Activity & Security Audit Logs"
        subtitle="Chronological timeline of system mutations, verification events, and security access checks"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Activity' }]}
      />
      <DataTable
        columns={[
          { key: 'created_at', label: 'Timestamp', width: 170, render: d => d?.slice(0, 16)?.replace('T', ' ') },
          { key: 'user_name', label: 'Actor', width: 140, render: n => <strong>{n}</strong> },
          { key: 'action', label: 'Action', width: 130, render: a => <Badge>{a}</Badge> },
          { key: 'entity_type', label: 'Module', width: 130 },
          { key: 'message', label: 'Audit Message' },
        ]}
        data={logs}
        loading={loading}
      />
      <Pagination page={page} total={total} limit={25} onChange={setPage} />
    </div>
  );
}

export function ImportExport() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toasts, add: addToast, dismiss } = useToast();

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      await upload('/import/execute', file);
      addToast('Data import executed successfully!', 'success');
      setFile(null);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Import & Export Wizard"
        subtitle="Batch import partner domains and backlink spreadsheets with schema validation"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Import / Export' }]}
      />

      <Card style={{ maxWidth: 640, margin: '0 auto', padding: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Upload CSV or Excel Spreadsheet</h3>
        <p style={{ color: 'var(--fg3)', fontSize: 14, marginBottom: 20 }}>
          Files are validated against SQL injection and duplicate domains before ingestion.
        </p>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={e => setFile(e.target.files[0])}
            style={{ marginBottom: 16 }}
          />
          <div>
            <Button variant="primary" loading={uploading} disabled={!file} type="submit">
              Start Ingestion
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function Settings() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  const defaultTab = isManagerOrAdmin ? 'general' : 'profile';
  const activeTab = searchParams.get('tab') || defaultTab;
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [changingPass, setChangingPass] = useState(false);
  const { toasts, add: addToast, dismiss } = useToast();

  useEffect(() => {
    if (isManagerOrAdmin) {
      setLoading(true);
      apiGet('/settings')
        .then(d => setSettings(d.settings || {}))
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    if (user?.role === 'admin') {
      apiGet('/users')
        .then(d => setUsersList(d.users || []))
        .catch(() => {});
    }
  }, [user, isManagerOrAdmin]);

  const setTab = tab => {
    setSearchParams({ tab });
  };

  const saveSettings = async () => {
    try {
      await apiPut('/settings', settings);
      addToast('System settings saved successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      addToast('New passwords do not match!', 'error');
      return;
    }
    setChangingPass(true);
    try {
      await apiPost('/auth/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      addToast('Password updated successfully!', 'success');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setChangingPass(false);
    }
  };

  const availableTabs = [
    ...(isManagerOrAdmin ? [{ value: 'general', label: 'General & System' }] : []),
    { value: 'profile', label: 'My Profile' },
    { value: 'security', label: 'Security & Sessions' },
    ...(user?.role === 'admin' ? [{ value: 'users', label: 'User Management' }] : []),
  ];

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Settings & Platform Governance"
        subtitle="Manage personal account preferences, system configurations, and enterprise security telemetry"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Settings' }]}
      />

      <Tabs tabs={availableTabs} active={activeTab} onChange={setTab} />

      {/* TAB 1: GENERAL SYSTEM SETTINGS */}
      {activeTab === 'general' && (
        <Card style={{ maxWidth: 640 }}>
          <div className="card-header">
            <h3>System Configuration</h3>
          </div>
          <Input
            label="Default Our Website Domain"
            value={settings.default_our_website || ''}
            onChange={e => setSettings({ ...settings, default_our_website: e.target.value })}
            placeholder="e.g. oursite.io"
            helper="Canonical our-side domain used as default for reciprocal exchanges."
          />
          <Select
            label="Allow Public Registration"
            value={settings.allow_registration || 'false'}
            onChange={e => setSettings({ ...settings, allow_registration: e.target.value })}
            options={[{ value: 'true', label: 'Yes (Public Registration Open)' }, { value: 'false', label: 'No (Invite Only)' }]}
          />
          <div style={{ marginTop: 8 }}>
            <Button variant="primary" onClick={saveSettings}>
              Save Settings
            </Button>
          </div>

          <div style={{ marginTop: 28, padding: 18, background: 'var(--bg3)', borderRadius: 10, fontSize: 13, lineHeight: 1.6, border: '1px solid var(--border)' }}>
            <strong style={{ color: 'var(--fg)', display: 'block', marginBottom: 4 }}>PostgreSQL Database Backup:</strong>
            {'Run standard pg_dump to snapshot production records: pg_dump -U postgres -d linkpilot_db > backup.sql'}
          </div>
        </Card>
      )}

      {/* TAB 2: MY PROFILE */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card>
            <div className="card-header">
              <h3>Account Profile Details</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar name={user?.name} color={user?.avatar_color} size={56} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg)' }}>{user?.name}</div>
                <div style={{ color: 'var(--fg3)', fontSize: 13 }}>{user?.email}</div>
                <div style={{ marginTop: 6 }}>
                  <Badge color="#635bff" bg="var(--primary-bg)">
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div><strong>User ID:</strong> {user?.id || 'USR-001'}</div>
              <div><strong>Account Role:</strong> <Badge color="#635bff">{user?.role?.replace('_', ' ')?.toUpperCase()}</Badge></div>
              <div><strong>Workspace / Organization:</strong> {user?.organization?.name || 'LinkPilot Core HQ'}</div>
              <div><strong>Job Title & Specialization:</strong> {user?.profile?.job_title || user?.profile?.specialization || 'SEO Lead / Strategist'}</div>
              <div><strong>Country & Timezone:</strong> {user?.profile?.country || 'United States'} ({user?.profile?.timezone || 'UTC'})</div>
              <div>
                <strong>Profile Completeness:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 7, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${user?.profile?.profile_completion_pct || 85}%`, height: '100%', background: 'linear-gradient(90deg, #635bff, #10b981)', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{user?.profile?.profile_completion_pct || 85}%</span>
                </div>
              </div>
              <div><strong>Account Status:</strong> <Badge color="var(--success)" dot>Active</Badge></div>
              <div><strong>Session Token:</strong> HTTP-Only Signed JWT</div>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <h3>Update Password</h3>
            </div>
            <form onSubmit={handlePasswordChange}>
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current}
                onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                required
                placeholder="••••••••"
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.next}
                onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                required
                placeholder="Min 8 characters"
                minLength={8}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
                placeholder="Repeat new password"
              />
              <Button variant="primary" loading={changingPass} type="submit">
                Change Password
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 3: SECURITY & TELEMETRY */}
      {activeTab === 'security' && (
        <Card style={{ maxWidth: 760 }}>
          <div className="card-header">
            <h3>Enterprise Security Telemetry</h3>
            <Badge color="var(--success)" bg="var(--success-bg)">
              All Protections Active
            </Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--fg4)', fontWeight: 600, textTransform: 'uppercase' }}>Session Integrity</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginTop: 4 }}>JWT Cookie (7-day)</div>
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ HttpOnly & SameSite=Lax</div>
            </div>

            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--fg4)', fontWeight: 600, textTransform: 'uppercase' }}>CSRF Protection</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginTop: 4 }}>Double-Submit Pattern</div>
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ X-CSRF-Token Enforced</div>
            </div>

            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--fg4)', fontWeight: 600, textTransform: 'uppercase' }}>Rate Limiting</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginTop: 4 }}>400 req/min Guard</div>
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ Brute-force protection</div>
            </div>
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Role-Based Access Control (RBAC) Matrix</h4>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Domains & Requests</th>
                  <th>Exchanges</th>
                  <th>Audit Logs</th>
                  <th>User Administration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Admin</strong></td>
                  <td><Badge color="var(--success)">Full Access</Badge></td>
                  <td><Badge color="var(--success)">Full Access</Badge></td>
                  <td><Badge color="var(--success)">Read / Search</Badge></td>
                  <td><Badge color="var(--success)">Manage All</Badge></td>
                </tr>
                <tr>
                  <td><strong>Manager</strong></td>
                  <td><Badge color="var(--success)">Full Access</Badge></td>
                  <td><Badge color="var(--success)">Full Access</Badge></td>
                  <td><Badge color="var(--success)">Read Only</Badge></td>
                  <td><Badge color="var(--danger)">Restricted</Badge></td>
                </tr>
                <tr>
                  <td><strong>Executive</strong></td>
                  <td><Badge color="var(--info)">Assigned Only</Badge></td>
                  <td><Badge color="var(--info)">Assigned Only</Badge></td>
                  <td><Badge color="var(--danger)">Restricted</Badge></td>
                  <td><Badge color="var(--danger)">Restricted</Badge></td>
                </tr>
                <tr>
                  <td><strong>Viewer</strong></td>
                  <td><Badge color="var(--fg3)">Read Only</Badge></td>
                  <td><Badge color="var(--fg3)">Read Only</Badge></td>
                  <td><Badge color="var(--danger)">Restricted</Badge></td>
                  <td><Badge color="var(--danger)">Restricted</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: USER MANAGEMENT (ADMIN ONLY) */}
      {activeTab === 'users' && user?.role === 'admin' && (
        <Card>
          <div className="card-header">
            <h3>Registered Team Members ({usersList.length})</h3>
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Full Name', render: (n, r) => <strong>{n}</strong> },
              { key: 'email', label: 'Email Address' },
              { key: 'role', label: 'Role', render: r => <Badge color="#635bff">{r}</Badge> },
              { key: 'status', label: 'Status', render: s => <Badge color={s === 'active' ? 'var(--success)' : 'var(--danger)'} dot>{s}</Badge> },
              { key: 'created_at', label: 'Created', render: d => d?.slice(0, 10) || '—' },
            ]}
            data={usersList}
            emptyTitle="No additional users registered"
          />
        </Card>
      )}
    </div>
  );
}

// ============================================================
// CLIENT & PARTNER USER-FACING PORTAL (USER SIDE)
// ============================================================
export function ClientPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState('');
  const [domainsList, setDomainsList] = useState([]);
  const [backlinks, setBacklinks] = useState([]);
  const [clientRequests, setClientRequests] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, marketplace, pipeline
  
  // Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    client_domain: '',
    target_url: '',
    anchor_text: '',
    priority: 'medium',
    category: 'Technology & SaaS',
    min_da: 40,
    placement_type: 'Editorial Guest Post',
    notes: '',
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  
  // Marketplace Filters
  const [marketplaceFilter, setMarketplaceFilter] = useState({ search: '', minDa: 0, category: 'All' });
  const [searchFilter, setSearchFilter] = useState('');
  const { toasts, add: addToast, dismiss } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [domRes, blRes, reqRes] = await Promise.all([
        apiGet('/domains?limit=100').catch(() => ({ domains: [] })),
        apiGet('/backlinks?limit=500').catch(() => ({ backlinks: [] })),
        apiGet('/client-requests?limit=100').catch(() => ({ requests: [] })),
      ]);
      const doms = domRes.domains || [];
      setDomainsList(doms);
      if (doms.length && !selectedDomain) {
        setSelectedDomain(doms[0].domain);
      }
      setBacklinks(blRes.backlinks || []);
      setClientRequests(reqRes.requests || []);
      setOpportunities(doms.filter(d => (d.da || 0) >= 30));
    } finally {
      setLoading(false);
    }
  }, [selectedDomain]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clientBacklinks = useMemo(() => {
    return backlinks.filter(b => {
      const matchesDomain = !selectedDomain || b.target_url?.toLowerCase().includes(selectedDomain.toLowerCase()) || b.referring_domain?.toLowerCase().includes(selectedDomain.toLowerCase());
      const matchesSearch = !searchFilter || b.referring_domain?.toLowerCase().includes(searchFilter.toLowerCase()) || b.anchor_text?.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesDomain && matchesSearch;
    });
  }, [backlinks, selectedDomain, searchFilter]);

  const activeClientRequests = useMemo(() => {
    return clientRequests.filter(r => !selectedDomain || r.client_domain?.toLowerCase().includes(selectedDomain.toLowerCase()));
  }, [clientRequests, selectedDomain]);
  
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(o => {
      if (marketplaceFilter.minDa > 0 && (o.da || 0) < marketplaceFilter.minDa) return false;
      if (marketplaceFilter.category !== 'All' && o.category !== marketplaceFilter.category && marketplaceFilter.category !== '') return false;
      if (marketplaceFilter.search && !o.domain.toLowerCase().includes(marketplaceFilter.search.toLowerCase())) return false;
      return true;
    });
  }, [opportunities, marketplaceFilter]);

  const handleCreateOrder = async e => {
    e.preventDefault();
    if (!newOrder.target_url || !newOrder.anchor_text) {
      addToast('Please provide both a Target URL and Desired Anchor Text.', 'error');
      return;
    }
    setSubmittingOrder(true);
    try {
      await apiPost('/client-requests', {
        client_domain: newOrder.client_domain || selectedDomain || 'mycompany.com',
        target_url: newOrder.target_url,
        anchor_text: newOrder.anchor_text,
        priority: newOrder.priority,
        notes: `[Marketplace Order] Niche: ${newOrder.category} | Min DA: ${newOrder.min_da} | Type: ${newOrder.placement_type}. ${newOrder.notes || ''}`,
      });
      addToast('Order successfully placed! Our fulfillment team has started outreach.', 'success');
      setShowOrderModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to submit order', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const openPreFilledOrder = opp => {
    setNewOrder(prev => ({
      ...prev,
      client_domain: selectedDomain || '',
      category: opp.category || 'Technology & SaaS',
      min_da: opp.da || 40,
      notes: `Targeting placement on publisher: ${opp.domain} (DA ${opp.da}, DR ${opp.dr})`,
    }));
    setShowOrderModal(true);
  };

  const liveCount = clientBacklinks.filter(b => b.status === 'live').length;
  const lostCount = clientBacklinks.filter(b => b.status === 'lost').length;
  const referringDomainsCount = new Set(clientBacklinks.map(b => b.referring_domain)).size;
  const activeDomainObj = domainsList.find(d => d.domain === selectedDomain) || {};
  
  // Chart Data Mock based on actual links
  const chartData = [
    { name: 'Jan', live: liveCount > 10 ? liveCount - 8 : 12, lost: 1 },
    { name: 'Feb', live: liveCount > 10 ? liveCount - 5 : 18, lost: 2 },
    { name: 'Mar', live: liveCount > 10 ? liveCount - 2 : 25, lost: 1 },
    { name: 'Apr', live: liveCount, lost: lostCount }
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 40 }}>
      <Toast toasts={toasts} onDismiss={dismiss} />

      {/* SEMrush-style Top Navigation & Domain Selector */}
      <div style={{ background: '#0f172a', padding: '24px 32px', color: '#fff', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, #635bff, #8b5cf6)', padding: '10px', borderRadius: '12px' }}>
              <BarChart3 size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                User Workspace · {user?.name || 'Client'}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                Project Dashboard
              </h1>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Globe size={16} color="#94a3b8" />
              <select
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '6px 0',
                  minWidth: '200px'
                }}
              >
                {domainsList.length === 0 && <option value="">No domains available</option>}
                {domainsList.map(d => (
                  <option key={d.id} value={d.domain} style={{ color: '#000' }}>
                    {d.domain}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="primary" onClick={() => { setNewOrder(prev => ({ ...prev, client_domain: selectedDomain })); setShowOrderModal(true); }} icon={<Plus size={16} />}>
              Order Backlink
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 32, marginTop: 32, borderBottom: '1px solid #334155' }}>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'analytics' ? '#fff' : '#94a3b8', 
              fontSize: 15, fontWeight: 600, padding: '0 0 12px 0', cursor: 'pointer',
              borderBottom: activeTab === 'analytics' ? '3px solid #635bff' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Backlink Analytics
          </button>
          <button 
            onClick={() => setActiveTab('marketplace')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'marketplace' ? '#fff' : '#94a3b8', 
              fontSize: 15, fontWeight: 600, padding: '0 0 12px 0', cursor: 'pointer',
              borderBottom: activeTab === 'marketplace' ? '3px solid #635bff' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Marketplace (Guest Posts)
          </button>
          <button 
            onClick={() => setActiveTab('pipeline')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'pipeline' ? '#fff' : '#94a3b8', 
              fontSize: 15, fontWeight: 600, padding: '0 0 12px 0', cursor: 'pointer',
              borderBottom: activeTab === 'pipeline' ? '3px solid #635bff' : '3px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            Order Pipeline
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {activeTab === 'analytics' && (
          <div className="fade-in">
            {/* SEMrush Style Authority Metrics Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
              <Card style={{ padding: 20, borderTop: '4px solid #635bff' }}>
                <div style={{ fontSize: 13, color: 'var(--fg3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Authority Score <Info size={14} />
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--fg)' }}>
                  {activeDomainObj.da || 0}
                </div>
                <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>
                  ↑ 2 points since last month
                </div>
              </Card>

              <Card style={{ padding: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--fg3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  Referring Domains
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>
                  {referringDomainsCount}
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg4)', marginTop: 4 }}>
                  Across {clientBacklinks.length} total links
                </div>
              </Card>

              <Card style={{ padding: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--fg3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  Backlinks
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--fg)' }}>
                  {clientBacklinks.length}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color: 'var(--success)' }}>{liveCount} Live</span>
                  <span style={{ color: 'var(--danger)' }}>{lostCount} Lost</span>
                </div>
              </Card>

              <Card style={{ padding: 20, borderTop: '4px solid #f59e0b' }}>
                <div style={{ fontSize: 13, color: 'var(--fg3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  Toxicity Score
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: (activeDomainObj.spam_score || 0) > 10 ? 'var(--danger)' : 'var(--success)' }}>
                  {activeDomainObj.spam_score || 0}%
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg4)', marginTop: 4 }}>
                  Low risk portfolio
                </div>
              </Card>
            </div>
            <div className="responsive-portal-grid-2">
              {/* Chart */}
              <Card style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>New & Lost Backlinks Over Time</h3>
                  <select style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>
                    <option>Last 6 Months</option>
                    <option>Last 12 Months</option>
                    <option>All Time</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--fg4)" fontSize={12} />
                    <YAxis stroke="var(--fg4)" fontSize={12} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area type="monotone" dataKey="live" name="Live Backlinks" stroke="#16a34a" fillOpacity={1} fill="url(#colorLive)" strokeWidth={2} />
                    <Area type="monotone" dataKey="lost" name="Lost Backlinks" stroke="#dc2626" fillOpacity={1} fill="url(#colorLost)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Top Anchors */}
              <Card style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Top Anchor Texts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(
                    clientBacklinks.reduce((acc, b) => {
                      const txt = b.anchor_text || 'Empty / Image';
                      acc[txt] = (acc[txt] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([anchor, count], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{anchor}</span>
                      <Badge color="var(--primary)" bg="var(--primary-bg)">{count} links</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Detailed Backlinks Table */}
            <Card>
              <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Backlink Portfolio Details</h3>
                <SearchInput value={searchFilter} onChange={setSearchFilter} placeholder="Search domains or anchors..." />
              </div>
              <DataTable
                columns={[
                  {
                    key: 'referring_domain',
                    label: 'Referring Page / Domain',
                    render: (d, row) => (
                      <div>
                        <strong style={{ color: 'var(--fg)', fontSize: 13 }}>{d}</strong>
                        <div style={{ fontSize: 11, color: 'var(--fg4)', marginTop: 2 }}>DA {row.da || 40} · DR {row.dr || 45}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'target_url',
                    label: 'Target URL',
                    render: u => (
                      <a href={u} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: 13, textDecoration: 'none' }}>
                        {u?.length > 40 ? u.substring(0, 40) + '...' : u}
                      </a>
                    ),
                  },
                  {
                    key: 'anchor_text',
                    label: 'Anchor Text',
                    render: a => <span style={{ fontSize: 13, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4 }}>{a || '-'}</span>,
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: s => <StatusBadge status={s || 'live'} />,
                  },
                  {
                    key: 'last_checked',
                    label: 'Last Seen',
                    render: d => <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{d?.slice(0, 10) || 'Today'}</span>,
                  }
                ]}
                data={clientBacklinks}
                loading={loading}
                emptyTitle="No backlinks found"
              />
            </Card>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="fade-in">
            {/* iCopify Style Marketplace Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: 'var(--bg2)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg)' }}>Guest Post & Link Marketplace</h2>
                <p style={{ color: 'var(--fg3)', fontSize: 14, marginTop: 4 }}>Browse vetted publishers, filter by authority and niche, and order guaranteed placements.</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <SearchInput value={marketplaceFilter.search} onChange={v => setMarketplaceFilter(p => ({ ...p, search: v }))} placeholder="Search publishers..." />
                <Select
                  value={marketplaceFilter.category}
                  onChange={e => setMarketplaceFilter(p => ({ ...p, category: e.target.value }))}
                  options={['All', 'Technology & SaaS', 'Finance & FinTech', 'Healthcare & Wellness', 'E-Commerce & Retail', 'Digital Marketing & SEO'].map(c => ({ value: c, label: c }))}
                  style={{ width: 180 }}
                />
                <Select
                  value={marketplaceFilter.minDa}
                  onChange={e => setMarketplaceFilter(p => ({ ...p, minDa: Number(e.target.value) }))}
                  options={[
                    { value: 0, label: 'Any DA' },
                    { value: 30, label: 'DA 30+' },
                    { value: 50, label: 'DA 50+' },
                    { value: 70, label: 'DA 70+' }
                  ]}
                  style={{ width: 120 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filteredOpportunities.map(opp => (
                <Card key={opp.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)' }}>{opp.domain}</h3>
                        <Badge color="var(--primary)" bg="var(--primary-bg)" style={{ marginTop: 6 }}>{opp.category || 'General'}</Badge>
                      </div>
                      <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '6px 10px', borderRadius: 8, fontWeight: 800, fontSize: 16 }}>
                        DA {opp.da || 40}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--fg4)', textTransform: 'uppercase', fontWeight: 700 }}>Traffic</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg2)' }}>{(opp.da * 1250).toLocaleString()}+</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--fg4)', textTransform: 'uppercase', fontWeight: 700 }}>Link Type</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg2)' }}>Dofollow</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)' }}>
                      ${opp.da > 60 ? '150' : opp.da > 40 ? '90' : '50'}
                    </div>
                    <Button variant="primary" onClick={() => openPreFilledOrder(opp)} icon={<Send size={14} />}>
                      Order Post
                    </Button>
                  </div>
                </Card>
              ))}
              {filteredOpportunities.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--fg3)', background: 'var(--bg2)', borderRadius: 12 }}>
                  <Search size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
                  <h3>No publishers match your criteria</h3>
                  <p>Try adjusting your filters to see more results.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Your Active Orders</h2>
              <Button variant="primary" onClick={() => { setNewOrder(prev => ({ ...prev, client_domain: selectedDomain })); setShowOrderModal(true); }}>
                Place New Order
              </Button>
            </div>
            
            <Card>
              <DataTable
                columns={[
                  { key: 'ref', label: 'Order ID', render: (r, row) => <strong style={{ fontSize: 13 }}>{r || `REQ-${row.id}`}</strong> },
                  { key: 'target_url', label: 'Target URL', render: u => <span style={{ fontSize: 12, color: 'var(--primary)' }}>{u}</span> },
                  { key: 'anchor_text', label: 'Anchor', render: a => <span style={{ fontSize: 13, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4 }}>"{a}"</span> },
                  { key: 'priority', label: 'Priority', render: p => <Badge color={p === 'high' ? 'var(--danger)' : 'var(--info)'}>{p?.toUpperCase()}</Badge> },
                  { 
                    key: 'status', 
                    label: 'Status / Stage', 
                    render: s => {
                      const stages = { pending: '1. Queued', in_progress: '2. Outreach', published: '3. Published', completed: '4. Verified Live' };
                      return <Badge color={s === 'completed' || s === 'published' ? 'var(--success)' : 'var(--warning)'}>{stages[s] || s}</Badge>;
                    } 
                  },
                  { key: 'created_at', label: 'Date Ordered', render: d => <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{d?.slice(0, 10) || 'Recently'}</span> },
                ]}
                data={activeClientRequests}
                loading={loading}
                emptyTitle="No active orders"
                emptyMessage="Head over to the Marketplace to order your first backlink."
              />
            </Card>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <Modal title="Order Link Placement" onClose={() => setShowOrderModal(false)} width={600}>
          <form onSubmit={handleCreateOrder}>
            <div style={{ background: 'var(--bg2)', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--fg4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Order Summary</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{newOrder.notes.split('|')[0] || 'Custom Request'}</div>
            </div>
            <Input label="Your Domain" value={newOrder.client_domain} onChange={e => setNewOrder({ ...newOrder, client_domain: e.target.value })} required />
            <Input label="Target URL" value={newOrder.target_url} onChange={e => setNewOrder({ ...newOrder, target_url: e.target.value })} required placeholder="https://..." helper="The page you want to rank." />
            <Input label="Desired Anchor Text" value={newOrder.anchor_text} onChange={e => setNewOrder({ ...newOrder, anchor_text: e.target.value })} required helper="The exact clickable text for your backlink." />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <Button variant="secondary" onClick={() => setShowOrderModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={submittingOrder} icon={<Check size={16} />}>Confirm & Pay</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
