import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, setCsrf, setAuthSetter } from './api.js';
import { PremiumLoader } from './UI.jsx';

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export function cleanUserName(name, email) {
  if (!name) {
    if (email && String(email).includes('@')) {
      return String(email).split('@')[0];
    }
    return 'User';
  }
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(part => !part.includes('@'));
  const cleaned = parts.join(' ').trim();
  if (cleaned) return cleaned;
  if (email && String(email).includes('@')) {
    return String(email).split('@')[0];
  }
  return String(name).split('@')[0].trim() || 'User';
}

function normalizeUser(u) {
  if (!u || typeof u !== 'object') return u;
  return {
    ...u,
    name: cleanUserName(u.name, u.email),
  };
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const setUser = u => setUserState(normalizeUser(u));

  useEffect(() => {
    setAuthSetter(setUser);
    apiGet('/auth/me').then(d => { setUser(d.user); setCsrf(d.csrf); }).catch(() => { setUserState(null); }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PremiumLoader
        fullScreen={true}
        size="lg"
        label="Authenticating LinkPilot Workspace..."
        sub="Validating session credentials and security permissions"
      />
    );
  }
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}