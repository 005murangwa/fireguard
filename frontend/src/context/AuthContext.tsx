import { createContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { User } from '../types';
import { authApi } from '../services/api.service';
import {
  setAuthToken,
  clearStoredSession,
  isTokenExpired,
  readStoredToken,
} from '../lib/auth-token';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadStoredSession(): { token: string | null; user: User | null } {
  const storedToken = readStoredToken();
  const storedUser = localStorage.getItem('user');

  if (!storedToken || !storedUser) {
    return { token: null, user: null };
  }

  if (isTokenExpired(storedToken)) {
    clearStoredSession();
    return { token: null, user: null };
  }

  try {
    const user = JSON.parse(storedUser) as User;
    setAuthToken(storedToken);
    return { token: storedToken, user };
  } catch {
    clearStoredSession();
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadStoredSession();
  const [user, setUser] = useState<User | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);

  const logout = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  const setSession = useCallback((newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setSession(response.data.token, response.data.user);
  }, [setSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      setSession,
      logout,
      isAuthenticated: !!token && !!user,
    }),
    [user, token, login, setSession, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
