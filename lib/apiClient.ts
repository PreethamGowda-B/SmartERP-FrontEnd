// ============================================================
// Token store — shifted to check both sessionStorage and localStorage
// to support PERSISTENT login (across tab closes) and Android bridge compatibility.
// ============================================================
import { triggerFeatureLock } from "@/components/locked-feature-prompt"
import { triggerSlowNetworkNotice } from "@/components/slow-network-notice"
import { logger } from "./logger"
export { logger }

// ─── Slow Network Tracking ──────────────────────────────────────────────────
// Keeps track of active requests that have exceeded the 20s threshold
const slowActiveRequests = new Set<string>()
const pendingRequests = new Map<string, NodeJS.Timeout>()

function markRequestStart(requestId: string) {
  const timeout = setTimeout(() => {
    slowActiveRequests.add(requestId)
    triggerSlowNetworkNotice(true)
  }, 20000) // 20 seconds
  pendingRequests.set(requestId, timeout)
}

function markRequestEnd(requestId: string) {
  const timeout = pendingRequests.get(requestId)
  if (timeout) {
    clearTimeout(timeout)
    pendingRequests.delete(requestId)
  }
  
  if (slowActiveRequests.has(requestId)) {
    slowActiveRequests.delete(requestId)
    // Only hide if NO other slow requests are still running
    if (slowActiveRequests.size === 0) {
      triggerSlowNetworkNotice(false)
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_AT = "_admin_at"
const ADMIN_RT = "_admin_rt"
const USER_AT = "_at"
const USER_RT = "_rt"

function getStorageKeys() {
  if (typeof window === "undefined") return { at: USER_AT, rt: USER_RT }
  
  const pathname = window.location.pathname
  const isAdminPath = pathname.includes('/super-admin') ||
                      pathname.includes('[adminRoute]')
  
  // Also check if we have an active admin session in localStorage
  const adminUser = localStorage.getItem("smarterp_admin_user")
  
  // Contextual priority: 
  // 1. If we are on an admin SPECIFIC path, definitely use admin keys.
  // 2. If we are on a generic path but ONLY have an admin user, use admin keys.
  // 3. Otherwise, use user keys.
  if (isAdminPath || (adminUser && !localStorage.getItem("smarterp_user"))) {
    return { at: ADMIN_AT, rt: ADMIN_RT }
  }
  
  return { at: USER_AT, rt: USER_RT }
}

export function setTokens(accessToken: string, refreshToken: string, isAdmin = false) {
  if (typeof window !== "undefined") {
    const { at, rt } = isAdmin ? { at: ADMIN_AT, rt: ADMIN_RT } : { at: USER_AT, rt: USER_RT }
    
    sessionStorage.setItem(at, accessToken)
    sessionStorage.setItem(rt, refreshToken)
    localStorage.setItem(at, accessToken)
    localStorage.setItem(rt, refreshToken)
    
    // Sync with generic keys if not admin for backward compatibility
    if (!isAdmin) {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      
      // Notify Android APK Bridge (WebView injects objects, not pure JS functions)
      try {
        if ((window as any).Android && (window as any).Android.saveToken) {
          (window as any).Android.saveToken(accessToken, refreshToken)
        }
      } catch (err) {
        console.warn("Android bridge saveToken skipped or failed", err)
      }
    }
  }
}

export function clearTokens(isAdmin?: boolean) {
  if (typeof window !== "undefined") {
    const keysToClear = isAdmin === true ? [{at: ADMIN_AT, rt: ADMIN_RT}] : 
                       isAdmin === false ? [{at: USER_AT, rt: USER_RT}] :
                       [{at: ADMIN_AT, rt: ADMIN_RT}, {at: USER_AT, rt: USER_RT}]
    
    keysToClear.forEach(k => {
      sessionStorage.removeItem(k.at)
      sessionStorage.removeItem(k.rt)
      localStorage.removeItem(k.at)
      localStorage.removeItem(k.rt)
    })
    
    if (isAdmin !== true) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    }
  }
}

export function getAccessToken() {
  if (typeof window !== "undefined") {
    const { at } = getStorageKeys()
    return sessionStorage.getItem(at) || localStorage.getItem(at) || localStorage.getItem("accessToken")
  }
  return null
}

function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    const { rt } = getStorageKeys()
    return sessionStorage.getItem(rt) || localStorage.getItem(rt) || localStorage.getItem("refreshToken")
  }
  return null
}

// Helper to sync with Android bridge
function syncWithAndroid(token: string, refreshToken?: string | null) {
  if (typeof window !== "undefined" && (window as any).Android?.saveToken) {
    (window as any).Android.saveToken(token, refreshToken || null)
  }
}

// Helper to handle unified logout across Web and Android
function handleLogout() {
  if (typeof window !== "undefined") {
    logger.warn("[v0] Session expired or invalid — logging out")
    clearTokens() // Clears all token storage
    localStorage.removeItem("smarterp_user")
    localStorage.removeItem("smarterp_admin_user")
    sessionStorage.removeItem("smarterp_mock_users")

    if ((window as any).Android?.logout) {
      (window as any).Android.logout()
    } else {
      window.location.href = "/auth/login"
    }
  }
}

// Lock to prevent multiple concurrent refresh attempts
let refreshPromise: Promise<any> | null = null

export async function apiClient(path: string, options: RequestInit = {}, retries = 3) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"
  
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  }

  // Attach access token if available
  const currentToken = getAccessToken()
  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`
  }

  const requestId = Math.random().toString(36).substring(7)
  markRequestStart(requestId)

  try {
    let res: Response
    try {
      // Use controller to handle potential timeouts if needed
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        credentials: "include",
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (error: any) {
      // 🚀 RESILIENCY: If it's a transient network error or cold start, retry GET requests
      const isRetryable = (options.method === 'GET' || !options.method) && retries > 0;
      
      if (isRetryable && (error.name === 'TypeError' || error.name === 'TimeoutError')) {
        const delay = (4 - retries) * 1000; // 1s, 2s, 3s backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(path, options, retries - 1);
      }

      // Handle direct cancellations (e.g. navigation) - don't log these to Sentry
      if (error.name === 'AbortError') {
        throw { name: 'AbortError', message: 'Request cancelled' };
      }

      logger.error(`[apiClient] Connection Error: ${path}`, { error: error.message || error });
      throw new Error("Unable to connect to the server. Please check your internet connection and try again.")
    }

    // Refresh token logic
    if (res.status === 401) {
      if (!refreshPromise) {
        const storedRefreshToken = getRefreshToken()
        refreshPromise = fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
        }).then(async (r) => {
          if (r.ok) {
            const data = await r.json()
            if (data.accessToken) {
              setTokens(data.accessToken, data.refreshToken || storedRefreshToken || "", data.isSuperAdmin)
              syncWithAndroid(data.accessToken, data.refreshToken)
            }
            return data
          }
          throw new Error("Refresh failed")
        }).finally(() => {
          refreshPromise = null
        })
      }

      try {
        await refreshPromise
        const newToken = getAccessToken()
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`
        }
        res = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: "include" })

        if (res.status === 401) {
          handleLogout()
          throw new Error("Session expired after refresh")
        }
      } catch (refreshErr) {
        handleLogout()
        throw refreshErr
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      if (res.status === 403 && error.upgrade_required) {
        triggerFeatureLock({
          feature: error.feature || "this premium feature",
          current_plan: error.current_plan,
          message: error.message
        })
        return new Promise(() => {})
      }
      throw { ...error, status: res.status }
    }

    return await res.json()
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;

    if (error.status >= 500 || !error.status) {
      logger.error(`[apiClient] ${error.status ? 'API Error' : 'Connection Error'}: ${path}`, {
        path,
        status: error.status,
        method: options.method || 'GET',
        error: error.message || error
      });
    }

    if (error.status || error.message?.includes("internet connection")) {
      throw error;
    }
    
    throw { message: "Something went wrong. Please try again.", originalError: error };
  } finally {
    markRequestEnd(requestId)
  }
}
