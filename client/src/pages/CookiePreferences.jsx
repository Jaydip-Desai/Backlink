import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, ShieldCheck, Check, Info, RefreshCw } from 'lucide-react';
import { Logo, Button } from '../lib/UI.jsx';
import { getCookieConsent, saveCookieConsent, DEFAULT_CONSENT } from '../lib/CookieBanner.jsx';
import { notify } from '../lib/notify.js';

export default function CookiePreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_CONSENT);
  const [savedTime, setSavedTime] = useState(null);

  useEffect(() => {
    const current = getCookieConsent();
    if (current) {
      setPreferences(current);
      setSavedTime(current.timestamp);
    }
  }, []);

  const handleSave = () => {
    const updated = saveCookieConsent(preferences);
    setSavedTime(updated.timestamp);
    notify.success('Cookie preferences saved successfully.');
  };

  const handleAcceptAll = () => {
    const full = { essential: true, analytics: true, preferences: true, marketing: true };
    const updated = saveCookieConsent(full);
    setPreferences(full);
    setSavedTime(updated.timestamp);
    notify.success('All cookie categories accepted.');
  };

  const handleRejectOptional = () => {
    const min = { essential: true, analytics: false, preferences: false, marketing: false };
    const updated = saveCookieConsent(min);
    setPreferences(min);
    setSavedTime(updated.timestamp);
    notify.info('Optional cookies disabled. Only strictly necessary cookies remain active.');
  };

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
              <Cookie size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Cookie Policy & Consent Center
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>
                {savedTime
                  ? `Active settings saved on: ${new Date(savedTime).toLocaleString()}`
                  : 'Manage how LinkPilot stores session and telemetry state'}
              </p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--fg2, #cbd5e1)', lineHeight: 1.6 }}>
            Cookies are small cryptographic tokens placed on your device to ensure secure authentication, prevent cross-site
            request forgery (CSRF), and maintain your active workspace state. You have full control over optional tracking.
          </p>
        </div>

        {/* Interactive Controls Card */}
        <div
          style={{
            background: 'var(--bg2, #181926)',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            borderRadius: 20,
            padding: '32px',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Cookie Categories & Toggles</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="sm" onClick={handleRejectOptional}>
                Reject Optional
              </Button>
              <Button variant="secondary" size="sm" onClick={handleAcceptAll}>
                Accept All
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Essential */}
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background: 'var(--bg, #0f1019)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg, #f8fafc)' }}>
                    Strictly Essential Cookies
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontWeight: 600,
                    }}
                  >
                    Always Active
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fg3, #94a3b8)', lineHeight: 1.5 }}>
                  Fundamental security mechanisms including <code style={{ fontSize: 12 }}>bop_token</code> (HTTP-only JWT session),
                  anti-CSRF protection tokens (<code style={{ fontSize: 12 }}>bop_csrf</code>), and server load balancers. These cannot be disabled.
                </p>
              </div>
              <input type="checkbox" checked disabled style={{ cursor: 'not-allowed', marginTop: 4, width: 18, height: 18 }} />
            </div>

            {/* Analytics */}
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background: 'var(--bg, #0f1019)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg, #f8fafc)', display: 'block', marginBottom: 6 }}>
                  Analytics & Telemetry
                </span>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fg3, #94a3b8)', lineHeight: 1.5 }}>
                  Collects anonymous technical metrics on crawl job completion rates, API latency, and link audit bottlenecks to improve platform speed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={e => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                style={{ cursor: 'pointer', marginTop: 4, width: 18, height: 18 }}
              />
            </div>

            {/* Preferences */}
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background: 'var(--bg, #0f1019)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg, #f8fafc)', display: 'block', marginBottom: 6 }}>
                  User Preferences & Workspace State
                </span>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fg3, #94a3b8)', lineHeight: 1.5 }}>
                  Stores your dark / light theme preference, active domain filters, pagination page size, and collapsed sidebar state.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.preferences}
                onChange={e => setPreferences(prev => ({ ...prev, preferences: e.target.checked }))}
                style={{ cursor: 'pointer', marginTop: 4, width: 18, height: 18 }}
              />
            </div>

            {/* Marketing */}
            <div
              style={{
                padding: 18,
                borderRadius: 14,
                background: 'var(--bg, #0f1019)',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg, #f8fafc)', display: 'block', marginBottom: 6 }}>
                  Marketing & Referral Attribution
                </span>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fg3, #94a3b8)', lineHeight: 1.5 }}>
                  Measures the effectiveness of partnership outreach campaigns and affiliate partner registrations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={e => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                style={{ cursor: 'pointer', marginTop: 4, width: 18, height: 18 }}
              />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Check size={16} /> Save Preference Settings
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 32, fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</Link>
          <span>•</span>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
