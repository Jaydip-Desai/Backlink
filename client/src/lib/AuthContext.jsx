import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, setCsrf, setAuthSetter } from './api.js';
import { PremiumLoader } from './UI.jsx';

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthSetter(setUser);
    apiGet('/auth/me').then(d => { setUser(d.user); setCsrf(d.csrf); }).catch(() => { setUser(null); }).finally(() => setLoading(false));
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