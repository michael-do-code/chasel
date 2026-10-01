import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { setApiToken } from '../api/axios';

const TOKEN_KEY = 'chasel_token';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Never inherit the indefinitely persisted credential used by older builds.
    // A session token survives refresh/HMR, but disappears when the tab closes.
    localStorage.removeItem('token');
    const savedToken = sessionStorage.getItem(TOKEN_KEY);
    setApiToken(savedToken);
    return savedToken;
  });

  const login = useCallback((newToken: string) => {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setApiToken(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem(TOKEN_KEY);
    setApiToken(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
