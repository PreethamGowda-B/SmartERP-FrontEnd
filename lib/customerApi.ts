import { getApiOrigin } from "@/lib/api-environment.mjs";
/**
 * lib/customerApi.ts
 *
 * Axios-based API client for the Prozync Client Portal.
 * Completely separate from the existing apiClient.ts used by owner/employee portals.
 *
 * Features:
 * - withCredentials: true (sends HttpOnly cookies automatically)
 * - X-CSRF-Token header on all non-GET requests
 * - Automatic token refresh on 401 (single retry)
 * - CSRF token fetched on init and stored in memory
 */

import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = getApiOrigin();

// In-memory CSRF token store (not localStorage — no XSS risk)
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<void> | null = null;

// When true, 401 errors will NOT trigger the refresh → redirect flow.
// Set to true during the background auth init check so that unauthenticated
// users don't get bounced into an infinite redirect loop.
let suppressRefreshRedirect = false;

export function setSuppressRefreshRedirect(val: boolean): void {
  suppressRefreshRedirect = val;
}

export async function fetchCsrfToken(): Promise<void> {
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = customerApi
    .get<{ csrfToken: string }>('/api/customer/auth/csrf')
    .then((res) => {
      csrfToken = res.data.csrfToken;
    })
    .catch((err) => {
      console.warn('Failed to fetch CSRF token:', err?.message);
    })
    .finally(() => {
      csrfFetchPromise = null;
    });

  return csrfFetchPromise;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string): void {
  csrfToken = token;
}

// Create the axios instance
const customerApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send HttpOnly cookies (customer_access_token, customer_refresh_token)
  timeout: 10000, // 10-second timeout — prevents infinite hangs on cold-start / network issues
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach X-CSRF-Token and Bearer token ─────────────
customerApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get') {
    // Portal reads must come from the API after mutations; never reuse an HTTP
    // cached pre-update list from the browser or an intermediary.
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
  }
  if (['post', 'put', 'patch', 'delete'].includes(method) && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  if (typeof window !== 'undefined') {
    const custToken = localStorage.getItem('_customer_at') || sessionStorage.getItem('_customer_at');
    if (custToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${custToken}`;
    }
  }
  return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let lastCustomerMutationAt = 0;

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb(''));
  refreshSubscribers = [];
}

customerApi.interceptors.response.use(
  async (response) => {
    const method = (response.config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      lastCustomerMutationAt = Date.now();
    }
    const payload = response.data;
    const emptyList = Array.isArray(payload)
      ? payload.length === 0
      : !!payload && typeof payload === 'object' && ['jobs', 'requests', 'items', 'results', 'data']
        .some((key) => Array.isArray((payload as any)[key]) && (payload as any)[key].length === 0);
    const requestConfig = response.config as typeof response.config & { _emptyListRetry?: boolean };
    if (method === 'get' && emptyList && Date.now() - lastCustomerMutationAt < 15000 && !requestConfig._emptyListRetry) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return customerApi({ ...requestConfig, _emptyListRetry: true } as any);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401, and only once per request.
    // ALSO skip the refresh logic entirely during the silent background init check
    // (suppressRefreshRedirect = true), otherwise unauthenticated users get bounced
    // into an infinite redirect loop: profile → 401 → refresh → 401 → login → reload.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/customer/auth/') &&
      !suppressRefreshRedirect
    ) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(customerApi(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await customerApi.post<{ ok: boolean; token?: string }>('/api/customer/auth/refresh');
        if (refreshRes.data?.token && typeof window !== 'undefined') {
          localStorage.setItem('_customer_at', refreshRes.data.token);
          sessionStorage.setItem('_customer_at', refreshRes.data.token);
        }
        // Refresh new CSRF token after token rotation
        await fetchCsrfToken();
        onRefreshed();
        return customerApi(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('_customer_at');
          sessionStorage.removeItem('_customer_at');
        }
        // Refresh failed — clear queued requests and redirect to login
        onRefreshed();
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/customer') && window.location.pathname !== '/customer/login') {
          window.location.href = '/customer/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default customerApi;
