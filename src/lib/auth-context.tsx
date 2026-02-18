"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface User {
  email: string;
  name: string;
  avatar: string;
}

const DEMO_USER: User = {
  email: "demo@remedy.health",
  name: "Demo User",
  avatar: "DU",
};

const DEMO_CREDENTIALS = {
  email: "demo@remedy.health",
  password: "demo1234",
};

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: () => ({ success: false }),
  logout: () => {},
});

const STORAGE_KEY = "remedy-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    if (
      email.toLowerCase() === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      setUser(DEMO_USER);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
      return { success: true };
    }
    return { success: false, error: "Invalid credentials. Use the demo account below." };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
