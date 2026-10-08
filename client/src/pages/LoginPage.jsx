import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { apiGet, apiPost } from '../lib/api.js';
import { notify } from '../lib/notify.js';
import { Logo, Button } from '../lib/UI.jsx';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
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

  // Password Recovery / Forgot Password State
  const [showReset, setShowReset] = useState(modeParam === 'forgot');
  const [resetEmail, setResetEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [dispatchedToken, setDispatchedToken] = useState('');

  // Direct Token Reset State (from email recovery link)
  const [showTokenReset, setShowTokenReset] = useState(Boolean(tokenParam));
  const [resetToken, setResetToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (tokenParam) {
      setResetToken(tokenParam);
      setShowTokenReset(true);
      setShowReset(false);
    }
  }, [tokenParam]);

  const handleLogin = async e => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      notify.warning('Required Fields', 'Please enter both your work email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiGet('/auth/csrf');
      const d = await apiPost('/auth/login', { email: email.trim().toLowerCase(), password });
      notify.success('Signed in successfully!', `Welcome back, ${d.user?.name || 'Explorer'}!`);
      setUser(d.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setError(msg);
      notify.error('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async e => {
    if (e) e.preventDefault();
    if (!resetEmail.trim()) {
      notify.warning('Email Required', 'Please enter your registered account email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      notify.loading('Dispatching Recovery Email', 'Preparing password recovery link...');
      const res = await apiPost('/auth/forgot-password', { email: resetEmail.trim().toLowerCase() });
      notify.close();
      if (res?.token) {
        setDispatchedToken(res.token);
      }
      setRecoverySent(true);
      notify.success('Recovery Email Dispatched', `A password reset link was sent to ${resetEmail.trim()}.`);
    } catch (err) {
      notify.close();
      const msg = err.message || 'Unable to dispatch recovery email. Please try again.';
      setError(msg);
      notify.error('Dispatch Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async e => {
    if (e) e.preventDefault();
    if (!resetToken.trim()) {
      notify.error('Missing Token', 'Verification token is missing or invalid.');
      return;
    }
    if (newPassword.length < 8) {
      notify.warning('Password Too Short', 'Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.warning('Password Mismatch', 'The passwords entered do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      notify.loading('Updating Password', 'Encrypting credentials and updating account security...');
      await apiPost('/auth/reset-password', { token: resetToken.trim(), password: newPassword });
      notify.close();
      notify.success('Password Updated', 'Your password has been changed. Please sign in.');
      setShowTokenReset(false);
      navigate('/login');
    } catch (err) {
      notify.close();
      const msg = err.message || 'Password reset link may be invalid or expired.';
      setError(msg);
      notify.error('Reset Failed', msg);
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ width: 'calc(100% - 32px)', maxWidth: 460, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
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

      {/* Brand Header */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Link to="/landing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <Logo size={40} animated={true} />
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>LinkPilot</span>
        </Link>
        <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--fg3, #64748b)' }}>
          Backlink Intelligence & Link-Building Platform
        </p>
      </div>

      {/* Main Card Container */}
      <div
        style={{
          width: 'calc(100% - 32px)',
          maxWidth: 460,
          background: 'var(--bg2, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0,0,0,0.08))',
          animation: 'fadeInUp 0.3s ease-out',
          boxSizing: 'border-box',
        }}
      >
        {/* =========================================================================
            VIEW 1: DIRECT TOKEN RESET FORM
           ========================================================================= */}
        {showTokenReset ? (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Set New Password</h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg3, #64748b)' }}>
                Choose a strong password to secure your LinkPilot workspace.
              </p>
            </div>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  New Password (min 8 chars) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 40px 11px 14px',
                      borderRadius: 12,
                      background: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      color: 'var(--fg, #111827)',
                      fontSize: 14.5,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--fg4, #94a3b8)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 40px 11px 14px',
                      borderRadius: 12,
                      background: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      color: 'var(--fg, #111827)',
                      fontSize: 14.5,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--fg4, #94a3b8)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-bg, #fef2f2)', color: 'var(--danger, #dc2626)', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 12 }}>
                Update Password
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowTokenReset(false);
                  navigate('/login');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #635bff)',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <ArrowLeft size={15} /> Back to Sign In
              </button>
            </form>
          </div>
        ) : showReset ? (
          /* =========================================================================
             VIEW 2: FORGOT PASSWORD RECOVERY FORM
             ========================================================================= */
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Reset Your Password</h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5 }}>
                Enter your registered work email. We'll send you a secure verification link to choose a new password.
              </p>
            </div>

            {recoverySent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--green-bg, #ecfdf5)',
                    color: 'var(--green, #16a34a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 8px' }}>Recovery Email Dispatched</h3>
                <p style={{ fontSize: 13.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5, margin: '0 0 20px' }}>
                  A secure recovery link has been dispatched to <strong>{resetEmail}</strong>. Please check your inbox or spam folder.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dispatchedToken && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setResetToken(dispatchedToken);
                        setShowTokenReset(true);
                        setShowReset(false);
                        setRecoverySent(false);
                      }}
                      style={{
                        width: '100%',
                        borderRadius: 12,
                        padding: '12px',
                        fontSize: 14.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      Set New Password Now <ArrowRight size={16} />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowReset(false);
                      setRecoverySent(false);
                    }}
                    style={{ width: '100%', borderRadius: 12 }}
                  >
                    Return to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                    Account Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg4, #94a3b8)' }} />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
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

                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-bg, #fef2f2)', color: 'var(--danger, #dc2626)', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 12 }}>
                  Send Recovery Link
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary, #635bff)',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <ArrowLeft size={15} /> Back to Sign In
                </button>
              </form>
            )}
          </div>
        ) : (
          /* =========================================================================
             VIEW 3: STANDARD SIGN IN FORM (WITH GOOGLE OAUTH)
             ========================================================================= */
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Welcome back
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--fg3, #64748b)' }}>
                Sign in to access your backlink intelligence workspace.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--fg, #111827)' }}>
                  Work Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg4, #94a3b8)' }} />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
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

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg, #111827)' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowReset(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary, #635bff)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg4, #94a3b8)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 42px 12px 42px',
                      borderRadius: 12,
                      background: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)',
                      color: 'var(--fg, #111827)',
                      fontSize: 14.5,
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
                      padding: 4,
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--danger-bg, #fef2f2)', color: 'var(--danger, #dc2626)', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={loading}
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
                  marginTop: 4,
                }}
              >
                Sign In <ArrowRight size={16} />
              </Button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border, #e2e8f0)', textAlign: 'center', fontSize: 13.5 }}>
              <span style={{ color: 'var(--fg3, #64748b)' }}>Don't have an account? </span>
              <Link to="/register" style={{ color: 'var(--primary, #635bff)', fontWeight: 600, textDecoration: 'none' }}>
                Create account
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <div style={{ marginTop: 24, fontSize: 12.5, color: 'var(--fg3, #64748b)' }}>
        © 2026 LinkPilot Backlink Intelligence. All rights reserved.
      </div>
    </div>
  );
}
