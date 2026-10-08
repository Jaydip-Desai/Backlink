import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { apiPost, apiGet, setNavigate } from './api.js';
import { Badge, Avatar, Dropdown, Modal, Button, ProfileMenu, Logo } from './UI.jsx';
import { useProject } from './ProjectContext.jsx';
import {
  LayoutDashboard,
  Search,
  Compass,
  Building2,
  Send,
  Inbox,
  ArrowLeftRight,
  Repeat,
  Link2,
  ShieldCheck,
  AlertOctagon,
  Globe,
  Target,
  Anchor,
  Contact,
  CalendarClock,
  BarChart3,
  Users,
  FileSpreadsheet,
  History,
  Settings,
  Bell,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  FolderKanban,
  Briefcase,
  AlertTriangle,
  Radio,
  Network,
  FileCode,
  Plus,
} from 'lucide-react';

const ALL_OPS_ROLES = ['admin', 'owner', 'agency_owner', 'business_owner', 'seo_manager', 'executive', 'manager'];
const ANALYST_ROLES = [...ALL_OPS_ROLES, 'seo_analyst', 'seo_professional'];
const OUTREACH_ROLES = [...ALL_OPS_ROLES, 'outreach_manager', 'outreach_specialist', 'seo_professional', 'content_specialist'];
const CLIENT_PORTAL_ROLES = [...ALL_OPS_ROLES, 'client'];
const VIEWER_SAFE_ROLES = [...ALL_OPS_ROLES, 'seo_analyst', 'seo_professional', 'content_specialist', 'client', 'viewer'];

const NAV_STRUCTURE = [
  { section: 'OVERVIEW' },
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} />, roles: ['admin', 'owner', 'agency_owner', 'business_owner', 'seo_manager', 'seo_analyst', 'seo_professional', 'outreach_manager', 'outreach_specialist', 'content_specialist', 'viewer', 'executive', 'manager'] },
  { path: '/portal', label: 'Client Dashboard', icon: <BarChart3 size={17} />, badge: 'Portal', roles: CLIENT_PORTAL_ROLES },

  { section: 'BACKLINKS' },
  { path: '/backlinks', label: 'All Backlinks', icon: <Link2 size={17} />, roles: VIEWER_SAFE_ROLES },
  { path: '/backlinks?filter=new', label: 'New Backlinks', icon: <Sparkles size={17} />, badge: 'New', roles: ANALYST_ROLES },
  { path: '/lost', label: 'Lost Backlinks', icon: <AlertOctagon size={17} />, roles: ANALYST_ROLES },
  { path: '/backlinks?filter=broken', label: 'Broken Backlinks', icon: <AlertTriangle size={17} />, roles: ANALYST_ROLES },
  { path: '/domains', label: 'Referring Domains', icon: <Globe size={17} />, roles: [...ANALYST_ROLES, 'viewer'] },
  { path: '/referring-ips', label: 'Referring IPs & Subnets', icon: <Network size={17} />, badge: 'PBN', roles: ANALYST_ROLES },
  { path: '/anchors', label: 'Anchor Text Profile', icon: <Anchor size={17} />, roles: ANALYST_ROLES },
  { path: '/top-pages', label: 'Top Linked Pages', icon: <Target size={17} />, roles: ANALYST_ROLES },
  { path: '/link-types', label: 'Link Types Distribution', icon: <Repeat size={17} />, roles: ANALYST_ROLES },

  { section: 'AUDIT & DISAVOW' },
  { path: '/audit', label: 'Backlink Audit', icon: <ShieldAlert size={17} />, highlight: true, roles: ANALYST_ROLES },
  { path: '/audit?tab=toxic', label: 'Toxic & Risk Links', icon: <AlertTriangle size={17} />, roles: ANALYST_ROLES },
  { path: '/disavow', label: 'Disavow Manager', icon: <FileCode size={17} />, roles: ANALYST_ROLES },
  { path: '/audit?tab=history', label: 'Audit History', icon: <History size={17} />, roles: ANALYST_ROLES },

  { section: 'COMPETITORS' },
  { path: '/competitors', label: 'Competitor Overview', icon: <Building2 size={17} />, roles: ANALYST_ROLES },
  { path: '/competitors?tab=gap', label: 'Backlink Gap Analysis', icon: <ArrowLeftRight size={17} />, highlight: true, roles: ANALYST_ROLES },
  { path: '/competitors?tab=intersect', label: 'Link Intersect', icon: <Compass size={17} />, roles: ANALYST_ROLES },

  { section: 'LINK BUILDING' },
  { path: '/opportunities', label: 'Link Opportunities', icon: <Compass size={17} />, badge: 'AI', roles: OUTREACH_ROLES },
  { path: '/crm', label: 'Outreach CRM Pipeline', icon: <FolderKanban size={17} />, highlight: true, roles: OUTREACH_ROLES },
  { path: '/campaigns', label: 'Outreach Campaigns', icon: <Send size={17} />, roles: OUTREACH_ROLES },
  { path: '/contacts', label: 'Contacts Directory', icon: <Contact size={17} />, roles: OUTREACH_ROLES },
  { path: '/templates', label: 'Email Pitch Templates', icon: <Inbox size={17} />, roles: OUTREACH_ROLES },
  { path: '/followups', label: 'Follow-ups Scheduler', icon: <CalendarClock size={17} />, roles: OUTREACH_ROLES },

  { section: 'MONITORING' },
  { path: '/alerts', label: 'Link & Domain Alerts', icon: <Radio size={17} />, roles: [...ALL_OPS_ROLES, 'client'] },
  { path: '/verification', label: 'Verification Center', icon: <ShieldCheck size={17} />, roles: ALL_OPS_ROLES },

  { section: 'REPORTS' },
  { path: '/reports', label: 'SEO & Audit Reports', icon: <BarChart3 size={17} />, roles: VIEWER_SAFE_ROLES },
  { path: '/import', label: 'Export & Import Center', icon: <FileSpreadsheet size={17} />, roles: ALL_OPS_ROLES },

  { section: 'PROJECTS' },
  { path: '/projects', label: 'All Projects', icon: <Briefcase size={17} />, roles: ALL_OPS_ROLES },
  { path: '/integrations', label: 'GSC & API Integrations', icon: <Globe size={17} />, roles: ALL_OPS_ROLES },

  { section: 'ADMINISTRATION' },
  { path: '/team', label: 'Team Members', icon: <Users size={17} />, roles: ALL_OPS_ROLES },
  { path: '/activity', label: 'Activity Logs', icon: <History size={17} />, roles: ALL_OPS_ROLES },
  { path: '/settings', label: 'Settings', icon: <Settings size={17} /> },
];

export default function Layout({ children }) {
  const { user, setUser } = useAuth();
  const { projects = [], activeProject, switchProject } = useProject() || {};
  const navigate = useNavigate();
  const location = useLocation();
  setNavigate(navigate);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navFilter, setNavFilter] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

  const searchInputRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Notifications poll
  useEffect(() => {
    const fetchUnread = () => {
      apiGet('/notifications?unread_only=true')
        .then(d => setUnread(d.unread || 0))
        .catch(() => {});
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 45000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  // Global Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Debounced search query
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => {
      if (searchQ.trim().length >= 2) {
        apiGet(`/search?q=${encodeURIComponent(searchQ.trim())}`)
          .then(res => {
            setSearchResults(res);
            setSelectedResultIndex(0);
          })
          .catch(() => setSearchResults(null));
      } else {
        setSearchResults(null);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQ, searchOpen]);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setIsDark(!isDark);
  };

  const handleLogout = async () => {
    await apiPost('/auth/logout').catch(() => {});
    setUser(null);
    navigate('/login');
  };

  const showNotifPanel = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      const d = await apiGet('/notifications').catch(() => ({ notifications: [] }));
      setNotifications(d.notifications || []);
    }
  };

  const markRead = async () => {
    await apiPost('/notifications/read', {}).catch(() => {});
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // Filter navigation items by role and search filter
  const userRole = (user?.role || 'viewer').toLowerCase().trim();
  const isAllowed = (roles) => {
    if (!roles) return true;
    if (userRole === 'admin') return true;
    return roles.some(r => r.toLowerCase() === userRole);
  };

  const filteredNav = NAV_STRUCTURE.filter(item => {
    if (item.roles && !isAllowed(item.roles)) return false;
    if (item.section) return true;
    if (!navFilter) return true;
    return item.label.toLowerCase().includes(navFilter.toLowerCase());
  }).filter((item, idx, arr) => {
    // Hide trailing or empty sections
    if (item.section) {
      const nextItem = arr[idx + 1];
      return nextItem && !nextItem.section;
    }
    return true;
  });

  // Calculate current breadcrumb
  const currentNav = NAV_STRUCTURE.find(n => n.path === location.pathname);
  const breadcrumbSection = (() => {
    if (!currentNav) return 'Workspace';
    let lastSection = 'Overview';
    for (const item of NAV_STRUCTURE) {
      if (item.section) lastSection = item.section;
      if (item.path === location.pathname) return lastSection;
    }
    return 'Workspace';
  })();

  // Flatten search results for arrow navigation
  const flatSearchResults = [];
  if (searchResults?.results) {
    if (searchResults.results.domains?.length) {
      searchResults.results.domains.forEach(d =>
        flatSearchResults.push({
          type: 'Domain',
          icon: <Globe size={16} color="#635bff" />,
          title: d.domain,
          sub: `DA ${d.da || '—'} · DR ${d.dr || '—'} · ${d.category || 'General'}`,
          link: `/domains/${d.ref}`,
        })
      );
    }
    if (searchResults.results.exchanges?.length) {
      searchResults.results.exchanges.forEach(e =>
        flatSearchResults.push({
          type: 'Exchange',
          icon: <Repeat size={16} color="#8b5cf6" />,
          title: `${e.ref} — ${e.partner_domain}`,
          sub: `Status: ${e.status} · Balance: ${e.balance_status || 'Balanced'}`,
          link: `/exchanges/${e.ref}`,
        })
      );
    }
    if (searchResults.results.backlinks?.length) {
      searchResults.results.backlinks.forEach(b =>
        flatSearchResults.push({
          type: 'Backlink',
          icon: <Link2 size={16} color="#16a34a" />,
          title: `${b.ref} — ${b.referring_domain}`,
          sub: `Target: ${b.target_url} · Anchor: "${b.anchor_text || ''}"`,
          link: '/backlinks',
        })
      );
    }
    if (searchResults.results.ourRequests?.length) {
      searchResults.results.ourRequests.forEach(r =>
        flatSearchResults.push({
          type: 'Our Request',
          icon: <Send size={16} color="#2563eb" />,
          title: `${r.ref} — ${r.partner_domain}`,
          sub: `Status: ${r.status} · Priority: ${r.priority}`,
          link: '/our-requests',
        })
      );
    }
    if (searchResults.results.clientRequests?.length) {
      searchResults.results.clientRequests.forEach(r =>
        flatSearchResults.push({
          type: 'Client Request',
          icon: <Inbox size={16} color="#06b6d4" />,
          title: `${r.ref} — ${r.client_domain}`,
          sub: `Status: ${r.status} · Target: ${r.target_url}`,
          link: '/client-requests',
        })
      );
    }
  }

  const handleSearchKeyDown = e => {
    if (!flatSearchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(i => (i + 1) % flatSearchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(i => (i - 1 + flatSearchResults.length) % flatSearchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatSearchResults[selectedResultIndex];
      if (selected) {
        setSearchOpen(false);
        navigate(selected.link);
      }
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <Logo size={30} />
            <div>
              <div style={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px', fontSize: 16 }}>LinkPilot</div>
              <div style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.6px' }}>
                BACKLINK INTELLIGENCE
              </div>
            </div>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick sidebar filter */}
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Quick jump..."
            value={navFilter}
            onChange={e => setNavFilter(e.target.value)}
          />
        </div>

        {/* Navigation List */}
        <nav style={{ paddingBottom: 24, flex: 1 }}>
          {filteredNav.map((n, i) =>
            n.section ? (
              <div key={i} className="nav-section">
                {n.section}
              </div>
            ) : (
              <Link
                key={n.path}
                to={n.path}
                className={`nav-item ${location.pathname === n.path ? 'active' : ''}`}
              >
                <span className="nav-item-icon">{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'rgba(99, 91, 255, 0.2)',
                      color: '#a5b4fc',
                      padding: '1px 6px',
                      borderRadius: 9999,
                    }}
                  >
                    {n.badge}
                  </span>
                )}
                {n.highlight && (
                  <Sparkles size={13} color="#a5b4fc" style={{ marginLeft: 4 }} />
                )}
              </Link>
            )
          )}
        </nav>

        {/* User Footer in Sidebar */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--sidebar-border)',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={user?.name} color={user?.avatar_color} size={34} />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  color: '#f1f5f9',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: 13,
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  fontWeight: 600,
                }}
              >
                {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                color: '#94a3b8',
                padding: 6,
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN SHELL */}
      <div className="main">
        {/* TOP HEADER */}
        <header className="hdr">
          <div className="hdr-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ padding: 6, color: 'var(--fg)' }}
            >
              <Menu size={22} />
            </button>

            {/* Active Project Switcher */}
            <Dropdown
              align="left"
              trigger={({ open }) => (
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg3)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--fg)',
                  }}
                  title="Switch Active LinkPilot Project"
                >
                  <Briefcase size={13} color="var(--primary)" />
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeProject?.name || 'LinkPilot Core'}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'var(--primary-bg)',
                      color: 'var(--primary)',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {activeProject?.domain || 'linkpilot.io'}
                  </span>
                  <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--fg4)' }} />
                </button>
              )}
            >
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--fg4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Active Project
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    className="dropdown-item"
                    onClick={() => switchProject(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: activeProject?.id === p.id ? 700 : 500,
                      color: activeProject?.id === p.id ? 'var(--primary)' : 'var(--fg)',
                      background: activeProject?.id === p.id ? 'var(--primary-bg)' : 'transparent',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeProject?.id === p.id ? 'var(--success)' : 'var(--fg4)' }} />
                    <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--fg4)' }}>{p.domain}</span>
                  </button>
                ))}
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => navigate('/projects')}
                style={{ color: 'var(--primary)', fontWeight: 600 }}
              >
                <Plus size={14} />
                <span>Create & Manage Projects</span>
              </button>
            </Dropdown>

            {/* Global Ctrl+K Search Bar */}
            <div
              className="hdr-search"
              onClick={() => setSearchOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <span className="icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                readOnly
                placeholder="Search LinkPilot..."
                value=""
              />
              <span className="kbd-shortcut">Ctrl + K</span>
            </div>

            {/* Mobile Search Button */}
            <button
              className="mobile-search-icon-btn btn btn-ghost btn-icon"
              onClick={() => setSearchOpen(true)}
              title="Search records (Ctrl+K)"
            >
              <Search size={19} />
            </button>
          </div>

          <div className="hdr-right">
            {/* View Mode Switcher: Agency HQ vs Client Portal */}
            <div className="hdr-mode-switcher" style={{ display: 'inline-flex', background: 'var(--bg3)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: location.pathname !== '/portal' ? 'var(--bg2)' : 'transparent',
                  color: location.pathname !== '/portal' ? 'var(--primary)' : 'var(--fg3)',
                  boxShadow: location.pathname !== '/portal' ? 'var(--shadow-xs)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                title="Agency HQ"
              >
                <LayoutDashboard size={13} /> <span className="hdr-btn-text">Agency HQ</span>
              </button>
              <button
                onClick={() => navigate('/portal')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: location.pathname === '/portal' ? 'var(--primary)' : 'transparent',
                  color: location.pathname === '/portal' ? '#ffffff' : 'var(--fg3)',
                  boxShadow: location.pathname === '/portal' ? 'var(--shadow-xs)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                title="Client Portal"
              >
                <Building2 size={13} /> <span className="hdr-btn-text">Client Portal</span>
              </button>
            </div>

            {/* Quick Action Button */}
            <div className="hdr-action-btn-wrap">
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowLeftRight size={14} />}
                onClick={() => navigate('/request-matching')}
                style={{ display: 'inline-flex' }}
              >
                <span className="hdr-btn-text">Match Requests</span>
              </Button>
            </div>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={showNotifPanel}
                style={{ position: 'relative' }}
                title="Notifications"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      background: 'var(--danger)',
                      color: '#ffffff',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {unread}
                  </span>
                )}
              </button>

              {showNotifs && (
                <>
                  <div
                    className="dropdown-backdrop"
                    onClick={() => setShowNotifs(false)}
                  />
                  <div className="dropdown-menu dropdown-menu-right notif-popover">
                    <div className="notif-popover-header">
                      <strong style={{ fontSize: 13.5, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Bell size={15} color="var(--primary)" /> Notifications
                        {unread > 0 && <Badge size="sm" color="var(--danger)">{unread} new</Badge>}
                      </strong>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={markRead}
                        style={{ fontSize: 12 }}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="notif-list">
                      {notifications.length ? (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                            onClick={() => {
                              setShowNotifs(false);
                              if (n.link) navigate(n.link);
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--fg)',
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {!n.is_read && (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: 'var(--primary)',
                                      display: 'inline-block',
                                    }}
                                  />
                                )}
                                {n.title}
                              </div>
                              <div style={{ color: 'var(--fg3)', fontSize: 12.5, marginTop: 4, lineHeight: 1.4 }}>
                                {n.message}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--fg4)', marginTop: 4 }}>
                                {n.created_at?.slice(0, 16)?.replace('T', ' ')}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: 36, textAlign: 'center', color: 'var(--fg3)', fontSize: 13 }}>
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help / Docs Modal */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowHelp(true)}
              title="Help & Shortcuts"
            >
              <HelpCircle size={18} />
            </button>

            {/* Quick Theme Toggle */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Premium Profile Menu Popover */}
            <ProfileMenu
              user={user}
              onLogout={handleLogout}
              isDark={isDark}
              onToggleTheme={toggleTheme}
            />
          </div>
        </header>

        {/* Global Search Modal */}
        {searchOpen && (
          <div
            className="modal-overlay"
            onClick={() => setSearchOpen(false)}
            style={{ alignItems: 'flex-start', paddingTop: '8vh' }}
          >
            <div
              className="modal modal-lg"
              onClick={e => e.stopPropagation()}
              style={{
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg2)',
                }}
              >
                <Search size={20} color="var(--primary)" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search domains, backlinks, exchanges, requests, contacts... (Press Esc to exit)"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 16,
                    outline: 'none',
                    padding: 0,
                    boxShadow: 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    background: 'var(--bg3)',
                    color: 'var(--fg3)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  ESC
                </span>
              </div>

              {/* Results Container */}
              <div style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
                {flatSearchResults.length > 0 ? (
                  flatSearchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(item.link);
                      }}
                      onMouseEnter={() => setSelectedResultIndex(idx)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background:
                          selectedResultIndex === idx ? 'var(--primary-bg)' : 'transparent',
                        borderLeft:
                          selectedResultIndex === idx
                            ? '3px solid var(--primary)'
                            : '3px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: 'var(--bg3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--fg)',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {item.title}
                          <Badge size="sm" color="#635bff">
                            {item.type}
                          </Badge>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--fg3)',
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.sub}
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--fg4)" />
                    </div>
                  ))
                ) : searchQ.trim().length >= 2 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg3)' }}>
                    No matching records found for "{searchQ}"
                  </div>
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg4)', fontSize: 13 }}>
                    Type at least 2 characters to search across domains, exchanges, and backlinks.
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: '10px 18px',
                  background: 'var(--bg3)',
                  borderTop: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'var(--fg3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Navigate with ↑ and ↓ · Open with Enter</span>
                <span>LinkPilot Intelligent Index</span>
              </div>
            </div>
          </div>
        )}

        {/* Documentation / Shortcuts Modal */}
        <Modal
          open={showHelp}
          onClose={() => setShowHelp(false)}
          title="LinkPilot Platform Guide & Shortcuts"
          large
          footer={
            <Button variant="primary" onClick={() => setShowHelp(false)}>
              Got it
            </Button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>
                Core SEO Lifecycle
              </h4>
              <p style={{ fontSize: 13, color: 'var(--fg2)', lineHeight: 1.6, marginBottom: 12 }}>
                LinkPilot ties together the complete backlink intelligence and link-building ecosystem:
              </p>
              <ul style={{ fontSize: 13, color: 'var(--fg3)', paddingLeft: 18, lineHeight: 1.8 }}>
                <li><strong>Domains:</strong> Normalized partner directory with DA/DR tracking.</li>
                <li><strong>Our Requests:</strong> Outgoing links pointing from partners to us.</li>
                <li><strong>Client Requests:</strong> Incoming requests pointing to client assets.</li>
                <li><strong>Matching Workspace:</strong> 1-click semantic compatibility pairing.</li>
                <li><strong>Exchanges:</strong> Dual-sided balance and verification status.</li>
                <li><strong>Automated Verifier:</strong> Real HTTP check for live/lost backlinks.</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>
                Keyboard Shortcuts
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6 }}>
                  <span>Global Quick Search</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>Ctrl + K</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6 }}>
                  <span>Close Modal / Dialog</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>ESC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6 }}>
                  <span>Switch Dark / Light Mode</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>Top Right Icon</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* PAGE CONTENT */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}