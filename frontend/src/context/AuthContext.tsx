import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  quickSwitch: (role: string) => Promise<void>;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const refreshUser = async () => {
    try {
      if (api.getToken()) {
        const res = await api.getMe();
        if (res.success) {
          setUser(res.user);
        } else {
          setUser(null);
        }
      } else {
        // Auto-login with default patient demo account for seamless instant trial
        const res = await api.quickSwitch('patient');
        setUser(res.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setShowLoginModal(false);
  };

  const quickSwitch = async (role: string) => {
    setLoading(true);
    try {
      const res = await api.quickSwitch(role);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        quickSwitch,
        logout,
        showLoginModal,
        setShowLoginModal,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
