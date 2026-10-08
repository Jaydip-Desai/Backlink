import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from './lib/AuthContext.jsx';
import { apiGet, apiPost } from './lib/api.js';
import { notify } from './lib/notify.js';
import { Logo, Button, Input, Select, Badge, PremiumLoader } from './lib/UI.jsx';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Globe,
  Building2,
  Compass,
  Send,
  Users,
  Sparkles,
  Check,
} from 'lucide-react';

const ONBOARDING_INTENTS = [
  {
    id: 'business_owner',
    title: 'Own Website',
    subtitle: 'Track domain authority, monitor backlinks, and protect against toxic spam for my company or personal website.',
    icon: <Globe size={22} color="#10b981" />,
    badge: 'Standard',
  },
  {
    id: 'agency_owner',
    title: 'Agency',
    subtitle: 'Manage backlink audits, client reporting, and outreach campaigns across multiple separate client domains.',
    icon: <Building2 size={22} color="#635bff" />,
    badge: 'Multi-Client',
  },
  {
    id: 'seo_professional',
    title: 'SEO Professional',
    subtitle: 'Perform technical backlink audits, anchor text distribution analysis, and competitor gap discovery.',
    icon: <Compass size={22} color="#f59e0b" />,
    badge: 'Specialist',
  },
  {
    id: 'outreach_manager',
    title: 'Link Building & Outreach',
    subtitle: 'Identify high-impact backlink opportunities, verify live links, and manage publisher relationships.',
    icon: <Send size={22} color="#ec4899" />,
    badge: 'Outreach',
  },
  {
    id: 'joining_team',
    title: 'Joining a Team',
    subtitle: 'I have an invitation to collaborate on an existing company or agency workspace.',
    icon: <Users size={22} color="#06b6d4" />,
    badge: 'Collaborate',
  },
];

export default function RoleRegister() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || searchParams.get('token') || '';

  // Steps: 1 = Initial Minimal Email, 2 = Name & Password, 3 = Intent & Workspace Setup
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [validatingInvite, setValidatingInvite] = useState(Boolean(inviteToken));

  // Form Fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(true);

  // Onboarding intent (Contextual, NOT internal role selection)
  const [intent, setIntent] = useState('business_owner');
  const [organizationName, setOrganizationName] = useState('');
  const [primaryWebsite, setPrimaryWebsite] = useState('');
  const [primarySeoGoal, setPrimarySeoGoal] = useState('Monitor backlink health and domain authority');

  // Validate Invitation Token if present in URL
  useEffect(() => {
    if (inviteToken) {
      setValidatingInvite(true);
      apiGet(`/auth/invitation?token=${encodeURIComponent(inviteToken)}`)
        .then(res => {
          setInviteData(res);
          if (res.email) setEmail(res.email);
          setStep(2); // Jump directly to credentials setup for invited members
        })
        .catch(err => {
          notify.error('Invalid Invitation', err.message || 'This workspace invitation token is invalid or has expired.');
        })
        .finally(() => setValidatingInvite(false));
    }
  }, [inviteToken]);

  // Step 1: Email Validation
  const handleContinueWithEmail = e => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      notify.warning('Valid Email Required', 'Please enter a valid work email address.');
      return;
    }
    setStep(2);
  };

  // Step 2: Validate Personal Info and Password
  const handleContinueToOnboarding = e => {
    if (e) e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      notify.warning('Name Required', 'Please enter both your first and last name.');
      return;
    }
    if (password.length < 12) {
      notify.warning('Password Too Short', 'Password must be at least 12 characters.');
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      notify.warning(
        'Strong Password Required',
        'Password must contain uppercase, lowercase, numbers, and at least one special character.'
      );
      return;
    }
    if (password !== confirmPassword) {
      notify.warning('Password Mismatch', 'The passwords entered do not match.');
      return;
    }
    if (!terms) {
      notify.warning('Terms Required', 'You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    // If joining via invitation, complete registration immediately without workspace onboarding
    if (inviteToken) {
      handleFinalSubmission();
    } else {
      setStep(3);
    }
  };

  // Final Registration Submission
  const handleFinalSubmission = async e => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      notify.loading('Setting Up Workspace', 'Provisioning your secure account and initializing backlink intelligence...');

      // Map public intent to safe backend role identifier (Server determines OWNER permission automatically)
      let accountTypeParam = 'business_owner';
      if (intent === 'agency_owner') accountTypeParam = 'agency_owner';
      else if (intent === 'seo_professional' || intent === 'outreach_manager') accountTypeParam = 'seo_professional';

      const payload = {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        password,
        confirmPassword,
        terms: true,
        accountType: accountTypeParam,
        inviteToken: inviteToken || undefined,
        organizationName: organizationName.trim() || `${firstName.trim()}'s Workspace`,
        primaryWebsite: primaryWebsite.trim() || undefined,
        primarySeoGoal,
      };

      const res = await apiPost('/auth/register', payload);

      if (res.user) {
        setUser(res.user);
        notify.success('Welcome to LinkPilot!', 'Your account has been created successfully.');
        navigate('/dashboard', { replace: true });
      } else {
        notify.success('Registration Completed', 'Please sign in with your new credentials.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      notify.error('Registration Error', err.message || 'Unable to create account. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 12) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[!@#$%^&*()_+\-=[\]{}|;':",./<>?`~]/.test(password)) score += 25;
    return score;
  };

  const passwordScore = getPasswordStrength();

  if (validatingInvite) {
    return <PremiumLoader message="Validating workspace invitation token..." fullScreen />;
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg, #f8fafc)',
        color: 'var(--fg, #111827)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Back to Home Navigation */}
      <div style={{ width: 'calc(100% - 32px)', maxWidth: step === 3 ? 680 : 480, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Link
          to="/landing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13.5,
            fontWeight: 600,
            color: 'var(--fg3, #64748b)',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      {/* Top Header Logo */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Link to="/landing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <Logo size={40} animated={true} />
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>LinkPilot</span>
        </Link>
      </div>

      {/* Main Container Card */}
      <div
        style={{
          width: 'calc(100% - 32px)',
          maxWidth: step === 3 ? 680 : 480,
          background: 'var(--bg2, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0, 0, 0, 0.08))',
          transition: 'all 0.3s ease',
          boxSizing: 'border-box',
        }}
      >
        {/* =========================================================================
            INVITATION HEADER BANNER (IF APPLICABLE)
           ========================================================================= */}
        {inviteData && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              background: 'rgba(99, 91, 255, 0.12)',
              border: '1px solid rgba(99, 91, 255, 0.25)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--primary, #635bff)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>You are invited to join</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg, #f8fafc)' }}>
                {inviteData.organization_name || 'LinkPilot Workspace'}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(99, 91, 255, 0.2)',
                color: 'var(--primary, #635bff)',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {inviteData.role || 'Member'}
            </span>
          </div>
        )}

        {/* =========================================================================
            STEP 1: ULTRA-CLEAN PUBLIC SIGNUP (MINIMALIST)
           ========================================================================= */}
        {step === 1 && !inviteData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Create your LinkPilot account
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--fg3, #94a3b8)', lineHeight: 1.5 }}>
                Monitor backlink health, discover competitor gaps, and build domain authority.
              </p>
            </div>

            <form onSubmit={handleContinueWithEmail} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label
                  htmlFor="signup-email"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--fg, #111827)' }}
                >
                  Work Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg4, #94a3b8)' }}
                  />
                  <input
                    id="signup-email"
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 12,
                      background: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      color: 'var(--fg, #111827)',
                      fontSize: 14.5,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 12,
                }}
              >
                Continue with Email <ArrowRight size={16} />
              </Button>
            </form>

            {/* Legal Footnote */}
            <p style={{ marginTop: 24, marginBottom: 0, fontSize: 12.5, color: 'var(--fg3, #94a3b8)', textAlign: 'center', lineHeight: 1.5 }}>
              By continuing, you agree to LinkPilot's{' '}
              <Link to="/terms" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>
              .
            </p>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border, rgba(255,255,255,0.08))', textAlign: 'center', fontSize: 13.5 }}>
              <span style={{ color: 'var(--fg3, #94a3b8)' }}>Already have an account? </span>
              <Link to="/login" style={{ color: 'var(--primary, #635bff)', fontWeight: 600, textDecoration: 'none' }}>
                Log in
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: NAME & PASSWORD CREDENTIALS SETUP
           ========================================================================= */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              {!inviteData && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--fg3, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <ArrowLeft size={16} /> Change email
                </button>
              )}
              <span style={{ fontSize: 12, color: 'var(--fg3, #94a3b8)', marginLeft: 'auto' }}>
                {inviteData ? 'Complete Invitation' : 'Step 2 of 3'}
              </span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700 }}>
                {inviteData ? 'Set up your credentials' : 'Complete your account'}
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg3, #94a3b8)' }}>
                Creating account for <strong style={{ color: 'var(--fg, #f8fafc)' }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleContinueToOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--fg, #111827)' }}>First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      borderRadius: 10,
                      background: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      color: 'var(--fg, #111827)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--fg, #111827)' }}>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Doe"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 12px',
                      borderRadius: 10,
                      background: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      color: 'var(--fg, #111827)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--fg, #111827)' }}>Password (min 12 chars) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 40px 11px 12px',
                      borderRadius: 10,
                      background: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      color: 'var(--fg, #111827)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--fg4, #94a3b8)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, width: '100%', background: 'var(--bg3, #f1f5f9)', borderRadius: 2, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${passwordScore}%`,
                          background: passwordScore < 50 ? 'var(--danger, #dc2626)' : passwordScore < 100 ? 'var(--warning, #f59e0b)' : 'var(--green, #16a34a)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg3, #64748b)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Must include uppercase, lowercase, number & symbol</span>
                      <span style={{ fontWeight: 600, color: passwordScore === 100 ? 'var(--green, #16a34a)' : 'inherit' }}>
                        {passwordScore === 100 ? 'Strong' : passwordScore >= 50 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, marginBottom: 6, color: 'var(--fg, #111827)' }}>Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: 10,
                    background: 'var(--bg, #f8fafc)',
                    border: '1px solid var(--border, #e2e8f0)',
                    color: 'var(--fg, #111827)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Terms Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
                <input
                  id="reg-terms"
                  type="checkbox"
                  required
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  style={{ marginTop: 3, cursor: 'pointer' }}
                />
                <label htmlFor="reg-terms" style={{ fontSize: 12.5, color: 'var(--fg3, #64748b)', lineHeight: 1.45, cursor: 'pointer' }}>
                  I confirm that I agree to the{' '}
                  <Link to="/terms" target="_blank" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>
                    Terms of Service
                  </Link>{' '}
                  and acknowledge the{' '}
                  <Link to="/privacy" target="_blank" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 12,
                  marginTop: 8,
                }}
              >
                {inviteData ? 'Join Workspace' : 'Continue to Workspace Setup'}{' '}
                <ArrowRight size={16} />
              </Button>
            </form>
          </div>
        )}

        {/* =========================================================================
            STEP 3: ONBOARDING INTENT & WORKSPACE SETUP (NON-ROLE BASED)
           ========================================================================= */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--fg3, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <span style={{ fontSize: 12, color: 'var(--fg4, #94a3b8)' }}>Step 3 of 3 • Customization</span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700 }}>How will you use LinkPilot?</h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg3, #64748b)' }}>
                We'll tailor your backlink metrics, crawl frequencies, and workspace dashboards accordingly.
              </p>
            </div>

            <form onSubmit={handleFinalSubmission} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Intent Selector Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ONBOARDING_INTENTS.map(item => {
                  const isSelected = intent === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setIntent(item.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: isSelected ? 'var(--primary-bg, rgba(99, 91, 255, 0.08))' : 'var(--bg, #f8fafc)',
                        border: `1.5px solid ${isSelected ? 'var(--primary, #635bff)' : 'var(--border, #e2e8f0)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: isSelected ? 'rgba(99, 91, 255, 0.15)' : 'rgba(0,0,0,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--fg, #111827)' }}>
                            {item.title}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: 'var(--bg3, #f1f5f9)',
                              color: 'var(--fg3, #64748b)',
                            }}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--fg3, #64748b)', lineHeight: 1.4 }}>
                          {item.subtitle}
                        </p>
                      </div>
                      {isSelected && (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--primary, #635bff)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Workspace / Primary Website Setup (Optional Quick Start) */}
              {intent !== 'joining_team' && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background: 'var(--bg, #f8fafc)',
                    border: '1px solid var(--border, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} color="var(--primary, #635bff)" />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg, #111827)' }}>
                      Quick Workspace Initialization (Optional)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--fg3, #64748b)' }}>
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={e => setOrganizationName(e.target.value)}
                        placeholder={`${firstName || 'My'}'s Workspace`}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: 'var(--bg2, #ffffff)',
                          border: '1px solid var(--border, #e2e8f0)',
                          color: 'var(--fg, #111827)',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--fg3, #64748b)' }}>
                        Primary Target Website
                      </label>
                      <input
                        type="text"
                        value={primaryWebsite}
                        onChange={e => setPrimaryWebsite(e.target.value)}
                        placeholder="https://example.com"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: 'var(--bg2, #ffffff)',
                          border: '1px solid var(--border, #e2e8f0)',
                          color: 'var(--fg, #111827)',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 12,
                }}
              >
                {loading ? 'Creating Workspace...' : 'Launch Workspace'} <ArrowRight size={16} />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div style={{ marginTop: 24, fontSize: 12.5, color: 'var(--fg3, #94a3b8)' }}>
        © 2026 LinkPilot Backlink Intelligence. All rights reserved.
      </div>
    </div>
  );
}
