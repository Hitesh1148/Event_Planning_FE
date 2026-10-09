import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';
import { reconnectSocketWithToken } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS = [
  { name: 'Alice Johnson', email: 'alice@planwise.local', role: 'Organizer (Moderate Budget)', budgetText: 'Pref $35 · Hard $50' },
  { name: 'Bob Smith', email: 'bob@planwise.local', role: 'Student (Strict Hard Budget)', budgetText: 'Pref $30 · Strict Hard $40' },
  { name: 'Charlie Davis', email: 'charlie@planwise.local', role: 'Foodie (Flexible Budget)', budgetText: 'Pref $40 · Hard $75' },
  { name: 'Dana Lee', email: 'dana@planwise.local', role: 'Busy Member (High Budget)', budgetText: 'Pref $50 · Hard $80' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password: pass });
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      reconnectSocketWithToken(data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await api.register({ name, email, password: pass });
      setAuthToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      reconnectSocketWithToken(data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  const quickDemoLogin = async (email: string) => {
    await login(email, 'Password123!');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
