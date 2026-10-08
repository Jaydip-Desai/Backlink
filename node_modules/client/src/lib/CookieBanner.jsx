import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, Check, X, SlidersHorizontal, Info } from 'lucide-react';
import { Button } from './UI.jsx';

const STORAGE_KEY = 'linkpilot_cookie_consent_v1';

export const DEFAULT_CONSENT = {
  essential: true, // Always required
  analytics: true,
  preferences: true,
  marketing: false,
  timestamp: null,
};

export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveCookieConsent(consent) {
  try {
    const payload = {
      ...consent,
      essential: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('linkpilot-cookie-consent-updated', { detail: payload }));
    return payload;
  } catch (e) {
    return consent;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    preferences: true,
    marketing: false,
  });

  useEffect(() => {
    const saved = getCookieConsent();
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setPreferences(saved);
    }
  }, []);

  // Listen for escape key to close modal and handle body scroll lock
  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  const handleAcceptAll = () => {
    const full = { essential: true, analytics: true, preferences: true, marketing: true };
    saveCookieConsent(full);
    setPreferences(full);
    setVisible(false);
    setShowModal(false);
  };

  const handleRejectOptional = () => {
    const minimal = { essential: true, analytics: false, preferences: false, marketing: false };
    saveCookieConsent(minimal);
    setPreferences(minimal);
    setVisible(false);
    setShowModal(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent(preferences);
    setVisible(false);
    setShowModal(false);
  };

  if (!visible && !showModal) return null;

  return (
    <>
      {/* Floating Bottom-Left Banner (Requirement #34: ~360px on desktop, bottom-sheet on mobile) */}
      {visible && !showModal && (
        <div
          role="region"
          aria-label="Cookie Consent Banner"
          className="cookie-banner-bottom-left"
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            maxWidth: 360,
            width: 'calc(100% - 48px)',
            background: 'var(--bg2, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-popover, 0 20px 40px -10px rgba(0,0,0,0.25))',
            padding: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            backdropFilter: 'blur(12px)',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>🍪</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--fg, #111827)' }}>
                Privacy & Cookies
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg3, #64748b)', lineHeight: 1.5 }}>
                We use strictly essential cookies for secure authentication and CSRF security. You can accept optional
                analytics and preference cookies to personalize your backlink intelligence workspace.{' '}
                <Link
                  to="/cookies"
                  style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline', fontWeight: 500 }}
                >
                  Read Policy
                </Link>
                .
              </p>
            </div>
            <button
              onClick={handleRejectOptional}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--fg4, #94a3b8)',
                cursor: 'pointer',
                padding: 2,
              }}
              title="Dismiss optional cookies"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" size="sm" onClick={handleAcceptAll} style={{ flex: '1 1 auto', justifyContent: 'center' }}>
              Accept All
            </Button>
            <Button variant="secondary" size="sm" onClick={handleRejectOptional} style={{ flex: '1 1 auto', justifyContent: 'center' }}>
              Reject Optional
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 12,
              color: 'var(--primary, #635bff)',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              alignSelf: 'flex-start',
            }}
          >
            <SlidersHorizontal size={13} />
            Manage Preferences
          </button>
        </div>
      )}

      {/* Detailed Cookie Preferences Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 10000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg2, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 20,
              maxWidth: 560,
              width: '100%',
              padding: 28,
              boxShadow: 'var(--shadow-popover, 0 25px 50px -12px rgba(0, 0, 0, 0.4))',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: 'var(--fg, #111827)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--primary-bg, rgba(99, 91, 255, 0.1))',
                    color: 'var(--primary, #635bff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <h3 id="cookie-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  Cookie & Privacy Preferences
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--fg3, #64748b)',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--fg3, #64748b)', lineHeight: 1.55, margin: '0 0 20px' }}>
              Manage and customize your consent preferences. Strictly essential cookies are required for platform security
              and cannot be disabled.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {/* Essential */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--bg, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Strictly Essential Cookies</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: 'var(--green-bg, #ecfdf5)',
                        color: 'var(--green, #16a34a)',
                        fontWeight: 600,
                      }}
                    >
                      Always Active
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg3, #64748b)', lineHeight: 1.45 }}>
                    Secures JWT session authentication, anti-CSRF token verification (<code style={{ fontSize: 11.5 }}>bop_csrf</code>), and load balancing.
                  </p>
                </div>
                <input type="checkbox" checked disabled style={{ cursor: 'not-allowed', marginTop: 4 }} />
              </div>

              {/* Analytics */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--bg, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>
                    Analytics & Telemetry
                  </span>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg3, #64748b)', lineHeight: 1.45 }}>
                    Monitors crawl bot latency, API execution performance, and backlink audit throughput to maintain platform health.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={e => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  style={{ cursor: 'pointer', marginTop: 4, width: 16, height: 16 }}
                />
              </div>

              {/* Preferences */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--bg, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>
                    User Preferences
                  </span>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg3, #64748b)', lineHeight: 1.45 }}>
                    Stores UI theme mode (dark/light), custom table density, active project workspace, and column visibility.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={e => setPreferences(prev => ({ ...prev, preferences: e.target.checked }))}
                  style={{ cursor: 'pointer', marginTop: 4, width: 16, height: 16 }}
                />
              </div>

              {/* Marketing */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--bg, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4 }}>
                    Marketing & Referral Attribution
                  </span>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg3, #64748b)', lineHeight: 1.45 }}>
                    Tracks attribution for partner exchanges and affiliate invitations.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={e => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  style={{ cursor: 'pointer', marginTop: 4, width: 16, height: 16 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={handleRejectOptional}>
                Reject Optional
              </Button>
              <Button variant="primary" onClick={handleSaveCustom}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
