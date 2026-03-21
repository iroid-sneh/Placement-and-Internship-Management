import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginAdmin, loginUser } from "../services/api/auth";
import { registerUnauthorizedHandler } from "../services/api/client";
import type { AuthUser } from "../types/app";

interface AuthContextValue {
  token: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (
    email: string,
    password: string,
    role: "student" | "company"
  ) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "token";
const USER_KEY = "auth_user";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY) || "";
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser) as AuthUser);
    }
    setIsLoading(false);
  }, []);

  const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout();
    });
  }, []);

  const saveAuthSession = (tokenValue: string, userValue: AuthUser): void => {
    localStorage.setItem(TOKEN_KEY, tokenValue);
    localStorage.setItem(USER_KEY, JSON.stringify(userValue));
    setToken(tokenValue);
    setUser(userValue);
  };

  const executeUserLogin = async (
    email: string,
    password: string,
    role: "student" | "company"
  ): Promise<void> => {
    const payload = await loginUser(email, password, role);
    saveAuthSession(payload.token, payload.user);
  };

  const executeAdminLogin = async (email: string, password: string): Promise<void> => {
    const payload = await loginAdmin(email, password);
    if (payload.user.role !== "admin") {
      throw new Error("Admin access only");
    }
    saveAuthSession(payload.token, payload.user);
  };

  const contextValue = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      loginUser: executeUserLogin,
      loginAdmin: executeAdminLogin,
      logout,
    }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const contextValue = useContext(AuthContext);
  if (!contextValue) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return contextValue;
};
