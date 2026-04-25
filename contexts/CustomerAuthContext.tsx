'use client';

/**
 * contexts/CustomerAuthContext.tsx
 *
 * React Context for Prozync Client Portal authentication state.
 * Completely separate from the existing SmartERP auth context.
 *
 * On mount:
 *   1. Fetches CSRF token from /api/customer/auth/csrf
 *   2. Fetches customer profile from /api/customer/profile to check session
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import customerApi, { fetchCsrfToken } from '@/lib/customerApi';
import type { CustomerProfile, AuthState } from '@/lib/customerTypes';

interface CustomerAuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile to hydrate auth state (checks if session cookie is valid)
  const refreshProfile = useCallback(async () => {
    try {
      const res = await customerApi.get<CustomerProfile>('/api/customer/profile');
      setCustomer(res.data);
    } catch (error: any) {
      // If token is invalid/expired, clear customer state
      // Do NOT trigger redirect here - let pages handle it
      setCustomer(null);
      
      // Clear any stale cookies on 401 errors
      if (error?.response?.status === 401) {
        // Cookies will be cleared by the server or axios interceptor
        console.log('Session expired or invalid');
      }
    }
  }, []);

  // Initialize: fetch CSRF token then check session
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await fetchCsrfToken();
        await refreshProfile();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await customerApi.post<{ ok: boolean; user: CustomerProfile }>(
      '/api/customer/auth/login',
      { email, password }
    );
    if (res.data.user) {
      setCustomer(res.data.user);
    } else {
      await refreshProfile();
    }
    // Refresh CSRF token after login (token rotation)
    await fetchCsrfToken();
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    try {
      await customerApi.post('/api/customer/auth/logout');
    } catch {
      // Ignore errors — clear state regardless
    }
    setCustomer(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/customer/login';
    }
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoading,
        isAuthenticated: !!customer,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return ctx;
}
