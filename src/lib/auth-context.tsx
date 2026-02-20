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
  register: (email: string, password: string, name: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: () => ({ success: false }),
  register: () => ({ success: false }),
  logout: () => {},
});

const STORAGE_KEY = "remedy-auth";
const USERS_KEY = "remedy-users";

function getStoredUsers(): Record<string, { password: string; name: string }> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

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
    const normalizedEmail = email.toLowerCase().trim();
    if (
      normalizedEmail === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      setUser(DEMO_USER);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
      return { success: true };
    }
    const users = getStoredUsers();
    const account = users[normalizedEmail];
    if (account && account.password === password) {
      const user: User = {
        email: normalizedEmail,
        name: account.name,
        avatar: account.name.slice(0, 2).toUpperCase(),
      };
      setUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return { success: true };
    }
    return { success: false, error: "Invalid email or password." };
  }, []);

  const register = useCallback((email: string, password: string, name: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    if (!trimmedName) return { success: false, error: "Name is required." };
    if (!normalizedEmail) return { success: false, error: "Email is required." };
    if (password.length < 6) return { success: false, error: "Password must be at least 6 characters." };
    const users = getStoredUsers();
    if (users[normalizedEmail]) return { success: false, error: "An account with this email already exists." };
    users[normalizedEmail] = { password, name: trimmedName };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const user: User = {
      email: normalizedEmail,
      name: trimmedName,
      avatar: trimmedName.slice(0, 2).toUpperCase(),
    };
    setUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
