import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe } from '../api/auth.api';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from '../api/axios';
import type { AdminUser, AuthTokens } from '../types';

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (tokens: AuthTokens, user: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokens = getStoredTokens();
    if (!tokens?.access) { setLoading(false); return; }
    getMe()
      .then((u) => { if (u.isAdmin) setUser(u); else clearStoredTokens(); })
      .catch(() => clearStoredTokens())
      .finally(() => setLoading(false));
  }, []);

  function login(tokens: AuthTokens, u: AdminUser) {
    setStoredTokens(tokens);
    setUser(u);
  }

  function logout() {
    clearStoredTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
