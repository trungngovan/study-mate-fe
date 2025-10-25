"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { User, LoginRequest, RegisterRequest } from '@/types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const currentUser = apiClient.getCurrentUser();
      if (currentUser && apiClient.isAuthenticated()) {
        try {
          // Verify token is still valid by fetching profile
          const profile = await apiClient.getProfile();
          setUser(profile);
        } catch (error) {
          // Token invalid, clear storage
          apiClient.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for token cleared event
    const handleTokenCleared = () => {
      setUser(null);
      router.push('/login');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-token-cleared', handleTokenCleared);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-token-cleared', handleTokenCleared);
      }
    };
  }, [router]);

  const login = async (data: LoginRequest) => {
    try {
      const response = await apiClient.login(data);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiClient.register(data);
      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

