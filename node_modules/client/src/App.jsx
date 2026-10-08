import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ProjectProvider } from './lib/ProjectContext.jsx';
import Layout from './lib/Layout.jsx';
import './app.css';
import {
  Login,
  Landing,
  Dashboard,
  ClientPortal,
  BacklinkChecker,
  BacklinkOpportunities,
  CompetitorBacklinks,
  PublisherInventory,
  Domains,
  DomainProfile,
  OurRequests,
  ClientRequests,
  RequestMatching,
  Exchanges,
  ExchangeDetail,
  Backlinks,
  Verification,
  Lost,
  Targets,
  Anchors,
  Contacts,
  Followups,
  Team,
  Reports,
  ImportExport,
  Activity,
  Settings,
} from './pages.jsx';
import {
  ReferringIps,
  TopPages,
  LinkTypes,
  BacklinkAudit,
  DisavowManager,
  CompetitorGap,
  OutreachCRM,
  EmailTemplates,
  Projects,
  Integrations,
  LinkAlerts,
} from './linkpilotPages.jsx';
import RoleRegister from './RoleRegister.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import CookiePreferences from './pages/CookiePreferences.jsx';
import NotFound from './pages/NotFound.jsx';
import CookieBanner from './lib/CookieBanner.jsx';
import { ShieldAlert } from 'lucide-react';
import { Button } from './lib/UI.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 540, margin: '40px auto', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--amber-bg)',
          color: 'var(--amber)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--fg)' }}>Access Level Restricted</h2>
        <p style={{ color: 'var(--fg3)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
          This administrative telemetry view requires {roles.join(' or ')} permissions. You are currently signed in as <strong>{user?.name}</strong> with role <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button variant="primary" onClick={() => window.location.href = '/'}>
            Return to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/portal'}>
            Open Client Portal
          </Button>
        </div>
      </div>
    );
  }
  return children;
}

function MainDashboard() {
  const { user } = useAuth();
  if (user?.role === 'viewer' || user?.role === 'client') {
    return <Navigate to="/portal" replace />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            {/* Public & Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RoleRegister />} />
            <Route path="/onboarding" element={<RoleRegister />} />
            <Route path="/invite" element={<RoleRegister />} />

            {/* Core Overview & Client Portal */}
            <Route path="/dashboard" element={<Protected><MainDashboard /></Protected>} />
            <Route path="/portal" element={<Protected><ClientPortal /></Protected>} />

            {/* Backlink Intelligence */}
            <Route path="/backlink-checker" element={<Protected><BacklinkChecker /></Protected>} />
            <Route path="/backlinks" element={<Protected><Backlinks /></Protected>} />
            <Route path="/referring-ips" element={<Protected><ReferringIps /></Protected>} />
            <Route path="/top-pages" element={<Protected><TopPages /></Protected>} />
            <Route path="/link-types" element={<Protected><LinkTypes /></Protected>} />
            <Route path="/verification" element={<Protected><Verification /></Protected>} />
            <Route path="/lost" element={<Protected><Lost /></Protected>} />

            {/* Audit & Disavow */}
            <Route path="/audit" element={<Protected><BacklinkAudit /></Protected>} />
            <Route path="/disavow" element={<Protected><DisavowManager /></Protected>} />

            {/* Competitors & Gap Intersect */}
            <Route path="/competitors" element={<Protected><CompetitorBacklinks /></Protected>} />
            <Route path="/competitors/gap" element={<Protected><CompetitorGap /></Protected>} />

            {/* Link Building & Outreach CRM */}
            <Route path="/opportunities" element={<Protected><BacklinkOpportunities /></Protected>} />
            <Route path="/inventory" element={<Protected><PublisherInventory /></Protected>} />
            <Route path="/crm" element={<Protected><OutreachCRM /></Protected>} />
            <Route path="/campaigns" element={<Protected><OutreachCRM /></Protected>} />
            <Route path="/prospects" element={<Protected><OutreachCRM /></Protected>} />
            <Route path="/templates" element={<Protected><EmailTemplates /></Protected>} />
            <Route path="/contacts" element={<Protected><Contacts /></Protected>} />
            <Route path="/followups" element={<Protected><Followups /></Protected>} />

            {/* Link Exchange Workflow */}
            <Route path="/our-requests" element={<Protected><OurRequests /></Protected>} />
            <Route path="/client-requests" element={<Protected><ClientRequests /></Protected>} />
            <Route path="/request-matching" element={<Protected><RequestMatching /></Protected>} />
            <Route path="/exchanges" element={<Protected><Exchanges /></Protected>} />
            <Route path="/exchanges/:ref" element={<Protected><ExchangeDetail /></Protected>} />

            {/* SEO Data & CRM */}
            <Route path="/domains" element={<Protected><Domains /></Protected>} />
            <Route path="/domains/:ref" element={<Protected><DomainProfile /></Protected>} />
            <Route path="/targets" element={<Protected><Targets /></Protected>} />
            <Route path="/anchors" element={<Protected><Anchors /></Protected>} />

            {/* Monitoring & Alerts */}
            <Route path="/alerts" element={<Protected><LinkAlerts /></Protected>} />

            {/* Projects Management */}
            <Route path="/projects" element={<Protected><Projects /></Protected>} />
            <Route path="/integrations" element={<Protected><Integrations /></Protected>} />

            {/* Analytics & Reporting */}
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/import" element={<Protected><ImportExport /></Protected>} />
            <Route
              path="/team"
              element={
                <Protected>
                  <RoleRoute roles={['admin', 'manager']}>
                    <Team />
                  </RoleRoute>
                </Protected>
              }
            />

            {/* Administration & Auditing */}
            <Route
              path="/activity"
              element={
                <Protected>
                  <RoleRoute roles={['admin', 'manager']}>
                    <Activity />
                  </RoleRoute>
                </Protected>
              }
            />
            <Route
              path="/settings"
              element={
                <Protected>
                  <Settings />
                </Protected>
              }
            />

            {/* Legal & Cookie Compliance */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePreferences />} />

            {/* 404 Not Found Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}