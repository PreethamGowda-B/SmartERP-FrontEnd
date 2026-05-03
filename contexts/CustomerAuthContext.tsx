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

let profileCache: { timestamp: number; data: CustomerProfile | null } | null = null;
let profilePromise: Promise<{ data: CustomerProfile }> | null = null;

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile to hydrate auth state (checks if session cookie is valid)
  const refreshProfile = useCallback(async () => {
    try {
      const now = Date.now();
      // Use cache if it's fresh (less than 30s old)
      if (profileCache && now - profileCache.timestamp < 30000) {
        setCustomer(profileCache.data);
        return;
      }

      // De-duplicate concurrent requests
      if (!profilePromise) {
        profilePromise = customerApi.get<CustomerProfile>('/api/customer/profile');
      }
      
      const res = await profilePromise;
      profilePromise = null; // Clear promise once resolved
      
      profileCache = { timestamp: Date.now(), data: res.data };
      setCustomer(res.data);
    } catch (error: any) {
      profilePromise = null;
      profileCache = { timestamp: Date.now(), data: null };
      setCustomer(null);
      
      if (error?.response?.status === 401) {
        // Normal for logged-out users
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
    
    // Pass tokens to Android App for Push Notifications
    if (typeof window !== 'undefined' && (window as any).Android?.saveToken) {
      // In cookie-based auth, we don't have direct access to tokens here.
      // But we can trigger the Android bridge to at least register FCM.
      (window as any).Android.saveToken("customer_session_active", null);
    }
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    try {
      await customerApi.post('/api/customer/auth/logout');
    } catch {
      // Ignore errors — clear state regardless
    }
    setCustomer(null);
    
    // Clear Android App session
    if (typeof window !== 'undefined' && (window as any).Android?.logout) {
      (window as any).Android.logout();
    }
    
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
