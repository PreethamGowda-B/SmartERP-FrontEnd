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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarterp-backendend.onrender.com';

// In-memory CSRF token store (not localStorage — no XSS risk)
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<void> | null = null;

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
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach X-CSRF-Token on mutating requests ─────────────
customerApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method) && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb(''));
  refreshSubscribers = [];
}

customerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401, and only once per request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/customer/auth/refresh')
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
        await customerApi.post('/api/customer/auth/refresh');
        // Refresh new CSRF token after token rotation
        await fetchCsrfToken();
        onRefreshed();
        return customerApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed — redirect to customer login
        if (typeof window !== 'undefined') {
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
