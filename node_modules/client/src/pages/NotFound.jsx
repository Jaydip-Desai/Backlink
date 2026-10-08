import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, LayoutDashboard, ArrowLeft, Search } from 'lucide-react';
import { Logo, Button } from '../lib/UI.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #0f1019)',
        color: 'var(--fg, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 540,
          width: '100%',
          background: 'var(--bg2, #181926)',
          border: '1px solid var(--border, rgba(255,255,255,0.1))',
          borderRadius: 24,
          padding: '48px 36px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          animation: 'fadeInUp 0.4s ease',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Logo size={48} animated={true} />
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 12,
          }}
        >
          404
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px', color: 'var(--fg, #f8fafc)' }}>
          Page Not Found
        </h1>

        <p style={{ fontSize: 14, color: 'var(--fg3, #94a3b8)', lineHeight: 1.6, margin: '0 0 28px' }}>
          The link route you followed may have expired, or the telemetry resource has been relocated to another workspace target.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={16} /> Go Back
          </Button>

          {user ? (
            <Link to="/dashboard">
              <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <LayoutDashboard size={16} /> Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Home size={16} /> Return Home
              </Button>
            </Link>
          )}
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border, rgba(255,255,255,0.08))', fontSize: 13, color: 'var(--fg3, #94a3b8)' }}>
          Need assistance? Explore our{' '}
          <Link to="/privacy" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>
            Privacy Center
          </Link>{' '}
          or{' '}
          <Link to="/terms" style={{ color: 'var(--primary, #635bff)', textDecoration: 'underline' }}>
            Terms of Service
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
