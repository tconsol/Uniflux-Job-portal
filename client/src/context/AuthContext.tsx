import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getMe } from '../api/auth.api';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from '../api/axios';
import type { User, AuthTokens } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const tokens = getStoredTokens();
      if (!tokens?.access) { setLoading(false); return; }
      const me = await getMe();
      setUser(me);
    } catch {
      clearStoredTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  function login(tokens: AuthTokens, userData: User) {
    setStoredTokens(tokens);
    setUser(userData);
  }

  function logout() {
    clearStoredTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
