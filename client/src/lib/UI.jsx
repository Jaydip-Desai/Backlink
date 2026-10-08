import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Settings,
  Shield,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { sanitizeUrl, scanDomainSecurity } from './security.js';
import { notify } from './notify.js';

/* ============================================================
   BRAND LOGO (MODERN ANIMATED VECTOR)
   ============================================================ */
export function Logo({ size = 32, animated = true, className = '', style = {} }) {
  return (
    <div
      className={`brand-logo-wrap ${animated ? 'animated' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="lb-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="lb-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* Outer Hexagon with cyber shield aesthetics */}
        <path
          d="M20 2.5L36 11.5V28.5L20 37.5L4 28.5V11.5L20 2.5Z"
          fill="url(#lb-grad-1)"
          className="logo-shield"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(99, 91, 255, 0.4))',
            transition: 'transform 0.3s ease',
          }}
        />
        {/* Interlocking geometric chain link */}
        <path
          d="M14 17C14 14.5 16 12.5 18.5 12.5H21.5C24 12.5 26 14.5 26 17V18H23V17C23 16.17 22.33 15.5 21.5 15.5H18.5C17.67 15.5 17 16.17 17 17C17 17.83 17.67 18.5 18.5 18.5H20V21.5H18.5C16 21.5 14 23.5 14 26C14 28.5 16 30.5 18.5 30.5H21.5C24 30.5 26 28.5 26 26V25H23V26C23 26.83 22.33 27.5 21.5 27.5H18.5C17.67 27.5 17 26.83 17 26C17 25.17 17.67 24.5 18.5 24.5H20V21.5H18.5C16.85 21.5 15.4 20.35 14.8 18.8C14.3 18.3 14 17.7 14 17Z"
          fill="#ffffff"
          opacity="0.95"
        />
        <circle cx="20" cy="20" r="2.2" fill="#ffffff" />
      </svg>
    </div>
  );
}

/* ============================================================
   SECURE EXTERNAL LINK WITH MALWARE PROTECTION
   ============================================================ */
export function SafeExternalLink({ href, children, style = {}, showIcon = true, className = '', title }) {
  const safeUrl = sanitizeUrl(href);
  const scan = scanDomainSecurity(href);
  const isBlocked = safeUrl.startsWith('#blocked');

  if (isBlocked) {
    return (
      <span style={{ color: 'var(--danger)', fontSize: 'inherit', ...style }} title="Blocked unsafe protocol">
        {children} (unsafe)
      </span>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`safe-link ${className}`}
      title={title || (scan.warning ? `⚠️ Warning: ${scan.warning}` : `Open external target: ${safeUrl}`)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: scan.threatLevel === 'high' ? 'var(--danger)' : scan.threatLevel === 'medium' ? 'var(--warning)' : undefined,
        ...style,
      }}
      onClick={async e => {
        if (scan.threatLevel === 'high') {
          e.preventDefault();
          const proceed = await notify.confirm(
            'Security Warning',
            `This link (<strong>${safeUrl}</strong>) has suspicious patterns or high-risk TLD. Are you sure you want to visit it?`,
            { confirmText: 'Proceed to Target', cancelText: 'Stay Safe', icon: 'warning' }
          );
          if (proceed) {
            window.open(safeUrl, '_blank', 'noopener,noreferrer');
          }
        }
      }}
    >
      <span>{children}</span>
      {showIcon && <ExternalLink size={12} style={{ opacity: 0.75, flexShrink: 0 }} />}
    </a>
  );
}

/* ============================================================
   BADGES & STATUS
   ============================================================ */
export function Badge({ color, bg, children, dot, size = 'md' }) {
  const s = size === 'sm' ? { padding: '2px 8px', fontSize: 11 } : {};
  const c = color || 'var(--fg3)';
  return (
    <span
      className="badge"
      style={{
        background: bg || 'var(--bg3)',
        color: c,
        border: `1px solid ${c ? `${c}28` : 'var(--border)'}`,
        ...s,
      }}
    >
      {dot && <span className="badge-dot" style={{ background: c }} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, map }) {
  const info = map?.[status] || { color: '#64748b', bg: '#f1f5f9', label: status };
  return (
    <Badge color={info.color} bg={info.bg} dot>
      {info.label || status}
    </Badge>
  );
}

/* ============================================================
   AVATAR
   ============================================================ */
export function Avatar({ name, color, size = 32 }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: color || 'var(--primary)',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: '0.5px',
      }}
    >
      {initials}
    </div>
  );
}

/* ============================================================
   BUTTONS
   ============================================================ */
export function Button({ variant = 'primary', size = 'md', loading, disabled, children, icon, ...props }) {
  const cls = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} ${loading ? 'btn-loading' : ''}`;
  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
      ) : (
        icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      {children}
    </button>
  );
}

export function IconButton({ children, ...props }) {
  return (
    <button className="btn btn-ghost btn-icon" {...props}>
      {children}
    </button>
  );
}

/* ============================================================
   CARDS & KPI
   ============================================================ */
export function Card({ children, className = '', style = {}, hover = true, ...props }) {
  return (
    <div className={`card ${hover ? '' : 'no-hover'} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

export function KpiCard({ value, label, color = '#635bff', icon, trend, subtitle, onClick }) {
  return (
    <div
      className="kpi-card"
      style={{
        cursor: onClick ? 'pointer' : undefined,
      }}
      onClick={onClick}
    >
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {icon && (
          <div
            className="kpi-icon-badge"
            style={{
              background: `${color}15`,
              color: color,
              borderColor: `${color}25`,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="kpi-value">
        {value ?? '—'}
      </div>
      <div className="kpi-footer">
        {trend && (
          <span className={`kpi-trend-pill ${trend.direction || 'up'}`}>
            {trend.direction === 'down' ? '↓' : '↑'} {trend.text}
          </span>
        )}
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

/* ============================================================
   FORMS & INPUTS
   ============================================================ */
export function Input({ label, error, helper, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input {...props} />
      {helper && !error && <span style={{ fontSize: 12, color: 'var(--fg4)' }}>{helper}</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}

export function Select({ label, options = [], error, placeholder, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <select {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option
            key={typeof o === 'string' ? o : o.value}
            value={typeof o === 'string' ? o : o.value}
          >
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <textarea {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

/* ============================================================
   GENERIC DROPDOWN (ACCESSIBLE, REF-BASED)
   ============================================================ */
export function Dropdown({ trigger, children, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`dropdown ${className}`} ref={containerRef}>
      <div
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{ cursor: 'pointer' }}
      >
        {typeof trigger === 'function' ? trigger({ open }) : trigger}
      </div>
      {open && (
        <div
          className={`dropdown-menu dropdown-menu-${align}`}
          role="menu"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PREMIUM PROFILE MENU POPOVER (EXACT USER SPECIFICATION)
   ============================================================ */
export function ProfileMenu({ user, onLogout, isDark, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const goTo = path => {
    setOpen(false);
    navigate(path);
  };

  const roleColors = {
    admin: { bg: 'rgba(99, 91, 255, 0.15)', text: '#635bff' },
    manager: { bg: 'rgba(37, 99, 235, 0.15)', text: '#2563eb' },
    executive: { bg: 'rgba(22, 163, 74, 0.15)', text: '#16a34a' },
    viewer: { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748b' },
  };
  const roleStyle = roleColors[user?.role?.toLowerCase()] || roleColors.viewer;

  return (
    <div className="dropdown" ref={containerRef}>
      {/* Profile Trigger Button */}
      <button
        className={`profile-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="User Profile Menu"
        aria-expanded={open}
      >
        <Avatar name={user?.name} color={user?.avatar_color} size={32} />
        <span className="profile-user-name" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)' }}>
          {user?.name}
        </span>
        <span className="profile-role-badge">
          <Badge
            color={roleStyle.text}
            bg={roleStyle.bg}
            size="sm"
          >
            {user?.role}
          </Badge>
        </span>
        <ChevronDown size={15} className="chevron-icon" />
      </button>

      {/* Floating Popover Content */}
      {open && (
        <div className="dropdown-menu dropdown-menu-right profile-popover" role="menu">
          {/* Header Area */}
          <div
            className="profile-popover-header"
            onClick={() => goTo('/settings?tab=profile')}
            title="Open Account Settings"
          >
            <Avatar name={user?.name} color={user?.avatar_color} size={42} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="profile-popover-name">{user?.name}</div>
              <div className="profile-popover-email">{user?.email}</div>
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: roleStyle.bg,
                    color: roleStyle.text,
                    display: 'inline-block',
                  }}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--fg4)" />
          </div>

          {/* Navigation Links */}
          <div className="profile-popover-menu-section">
            <button
              className="dropdown-item"
              onClick={() => goTo('/settings?tab=profile')}
            >
              <User size={16} color="var(--primary)" />
              <span>My Profile</span>
            </button>

            <button
              className="dropdown-item"
              onClick={() => goTo('/settings?tab=general')}
            >
              <Settings size={16} color="var(--fg3)" />
              <span>Settings & Preferences</span>
            </button>

            <button
              className="dropdown-item"
              onClick={() => goTo('/settings?tab=security')}
            >
              <Shield size={16} color="var(--success)" />
              <span>Security</span>
            </button>
          </div>

          <div className="dropdown-divider" />

          {/* Appearance Toggle Item */}
          <div className="profile-popover-menu-section">
            <button
              className="dropdown-item"
              onClick={e => {
                e.stopPropagation();
                onToggleTheme();
              }}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isDark ? <Moon size={16} color="var(--purple)" /> : <Sun size={16} color="var(--warning)" />}
                <span>Appearance</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--fg4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {isDark ? 'Dark' : 'Light'} <ChevronRight size={13} />
              </span>
            </button>
          </div>

          <div className="dropdown-divider" />

          {/* Sign Out Item (Destructive/Session) */}
          <div className="profile-popover-menu-section">
            <button
              className="dropdown-item dropdown-item-danger"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SLIDE-OVER DRAWER COMPONENT
   ============================================================ */
export function Drawer({ open, onClose, title, children, footer, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg)' }}>{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </>
  );
}

/* ============================================================
   MODALS & DIALOGS
   ============================================================ */
export function Modal({ open, onClose, title, children, footer, large, small }) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`modal ${large ? 'modal-lg' : small ? 'modal-sm' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'Confirmation Required'}
      small
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: 'var(--fg2)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

/* ============================================================
   TABS & PAGINATION
   ============================================================ */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <div
          key={t.value}
          className={`tab ${active === t.value ? 'active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.icon && <span style={{ marginRight: 6 }}>{t.icon}</span>}
          {t.label}
          {t.count !== undefined && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 9999,
                background: active === t.value ? 'var(--primary-bg)' : 'var(--bg3)',
                color: active === t.value ? 'var(--primary)' : 'var(--fg3)',
                fontWeight: 700,
              }}
            >
              {t.count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit) || 1;
  return (
    <div className="pagination">
      <span className="info">
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} items
      </span>
      <div className="btns">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Previous
        </Button>
        <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--fg2)', fontWeight: 600 }}>
          {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next →
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   SKELETONS & EMPTY STATES
   ============================================================ */
export function Skeleton({ height = 20, width, style = {} }) {
  return <div className="skeleton" style={{ height, width: width || '100%', ...style }} />;
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height={18} width={`${Math.random() * 40 + 30}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Empty({
  icon = '📊',
  title = 'No data available',
  message = 'There are no records to display at this time.',
  action,
}) {
  return (
    <div className="empty">
      <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
      <h3>{title}</h3>
      <p style={{ maxWidth: 420, margin: '0 auto 20px', color: 'var(--fg3)' }}>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
export function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type || 'info'}`}>
          {t.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : t.type === 'error' ? (
            <AlertTriangle size={18} />
          ) : (
            <Info size={18} />
          )}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{ color: '#fff', border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, add, dismiss };
}

/* ============================================================
   PAGE HEADER & DATA TABLE
   ============================================================ */
export function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <>
      {breadcrumbs && (
        <div className="breadcrumbs">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              {b.href ? <a href={b.href}>{b.label}</a> : <span style={{ color: 'var(--fg)' }}>{b.label}</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="subtitle">{subtitle}</div>}
        </div>
        {actions && <div className="toolbar">{actions}</div>}
      </div>
    </>
  );
}

export function FilterBar({ children, className = '' }) {
  return <div className={`filter-bar ${className}`}>{children}</div>;
}

export function SearchInput({ value, onChange, placeholder = 'Search records...' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ minWidth: 220, flex: 1 }}
    />
  );
}

export function DataTable({
  columns,
  data,
  loading,
  onRowClick,
  selectable,
  selected = [],
  onSelectAll,
  onSelectRow,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  emptyAction,
}) {
  if (loading) {
    return (
      <div className="data-table-wrap" style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PremiumLoader size="md" label="Loading Real-Time Records..." sub="Retrieving verified backlink intelligence" />
      </div>
    );
  }
  if (!data?.length) {
    return (
      <Empty
        icon={emptyIcon}
        title={emptyTitle || 'No records found'}
        message={emptyMessage || 'Try adjusting your search filters or add a new record.'}
        action={emptyAction}
      />
    );
  }
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: 44 }}>
                <input
                  type="checkbox"
                  checked={selected.length === data.length && data.length > 0}
                  onChange={onSelectAll}
                />
              </th>
            )}
            {columns.map(c => (
              <th
                key={c.key}
                style={{ width: c.width, cursor: c.sortable ? 'pointer' : undefined }}
                onClick={c.sortable ? c.onSort : undefined}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || row.ref || i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : undefined }}
            >
              {selectable && (
                <td onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id || row.ref)}
                    onChange={() => onSelectRow(row.id || row.ref)}
                  />
                </td>
              )}
              {columns.map(c => (
                <td key={c.key} style={{ ...c.style, maxWidth: c.maxWidth }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   PREMIUM ANIMATED LOADER (SCANNER / RADAR)
   ============================================================ */
export function PremiumLoader({
  size = 'md',
  label = 'Loading Backlink Data...',
  sub = 'Scanning real-time intelligence feeds',
  message,
  overlay = false,
  fullScreen = false,
  compact = false,
  className = '',
  style = {},
}) {
  const displayLabel = message || label;
  const isFullScreen = fullScreen || overlay;

  return (
    <div
      className={`linkpilot-loader-wrap ${isFullScreen ? 'fullscreen' : ''} ${compact ? 'compact' : ''} ${className}`}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={typeof displayLabel === 'string' ? displayLabel : 'Loading'}
    >
      <div className={`linkpilot-loader-radar ${size}`}>
        <div className="radar-ring" />
        <div className="radar-ring ring-2" />
        <div className="radar-ring ring-3" />
        <div className="radar-core" />
      </div>
      {displayLabel && <div className="linkpilot-loader-label">{displayLabel}</div>}
      {sub && <div className="linkpilot-loader-sub">{sub}</div>}
    </div>
  );
}