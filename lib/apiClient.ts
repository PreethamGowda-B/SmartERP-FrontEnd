// ============================================================
// Token store — shifted to check both sessionStorage and localStorage
// to support PERSISTENT login (across tab closes) and Android bridge compatibility.
// ============================================================
import { triggerFeatureLock } from "@/components/locked-feature-prompt"
import { triggerSlowNetworkNotice } from "@/components/slow-network-notice"
import { logger } from "./logger"
import { ErrorBoundary } from "@/components/ErrorBoundary"
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

function getStorageKeys(targetPath?: string) {
  if (typeof window === "undefined") return { at: USER_AT, rt: USER_RT }
  
  const pathname = window.location.pathname
  const hostname = window.location.hostname
  const isAdminPath = (targetPath && (
                        targetPath.startsWith('/api/admin') ||
                        targetPath.startsWith('/api/superadmin') ||
                        targetPath.startsWith('/api/v1/superadmin') ||
                        targetPath.startsWith('/api/ai')
                      )) ||
                      pathname.includes('/superadmin') ||
                      pathname.includes('/super-admin') ||
                      pathname.includes('[adminRoute]') ||
                      hostname.startsWith('superadmin.')
  
  if (isAdminPath) {
    return { at: ADMIN_AT, rt: ADMIN_RT }
  }
  
  return { at: USER_AT, rt: USER_RT }
}

export function setTokens(accessToken: string, refreshToken: string, isAdmin = false) {
  if (typeof window !== "undefined") {
    const { at, rt } = isAdmin ? { at: ADMIN_AT, rt: ADMIN_RT } : { at: USER_AT, rt: USER_RT }
    
    // Store in both sessionStorage and localStorage for persistent cross-tab & cross-session logins
    sessionStorage.setItem(at, accessToken)
    sessionStorage.setItem(rt, refreshToken)
    localStorage.setItem(at, accessToken)
    localStorage.setItem(rt, refreshToken)

    if (!isAdmin) {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
    }

    // Android WebView bridge — native token handoff
    if (!!(window as any).Android) {
      try {
        if ((window as any).Android.saveToken) {
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

/**
 * SINGLE SOURCE OF TRUTH FOR AUTH TOKEN
 * Prioritize target API path and localStorage to ensure 100% cross-tab token synchronization.
 */
export function getAuthToken(targetPath?: string): string | null {
  if (typeof window === "undefined") return null
  
  const { at } = getStorageKeys(targetPath)
  const isSuperAdminTarget = at === ADMIN_AT

  if (isSuperAdminTarget) {
    const adminToken = localStorage.getItem(ADMIN_AT) || sessionStorage.getItem(ADMIN_AT)
    if (adminToken) return adminToken
    try {
      const adminUserStr = localStorage.getItem("smarterp_admin_user")
      if (adminUserStr) {
        const u = JSON.parse(adminUserStr)
        if (u?.accessToken) return u.accessToken
      }
    } catch (_) {}
  }
  
  // 1. Check primary token in localStorage
  const fromLocal = localStorage.getItem(at) || 
                    localStorage.getItem("accessToken") || 
                    localStorage.getItem(USER_AT)
  if (fromLocal) return fromLocal

  // 2. Fallback to sessionStorage
  const fromSession = sessionStorage.getItem(at) || 
                      sessionStorage.getItem("accessToken") || 
                      sessionStorage.getItem(USER_AT)
  if (fromSession) return fromSession

  // 3. Fallback: Parse user profile from localStorage
  try {
    const userStr = localStorage.getItem("smarterp_user") || localStorage.getItem("smarterp_admin_user")
    if (userStr) {
      const u = JSON.parse(userStr)
      if (u?.accessToken) return u.accessToken
    }
  } catch (_) {}

  return null
}

export function getAccessToken(targetPath?: string) {
  return getAuthToken(targetPath)
}

export function getRefreshToken(targetPath?: string): string | null {
  if (typeof window !== "undefined") {
    const { rt } = getStorageKeys(targetPath)
    
    // 1. Check localStorage first (shared across all browser tabs)
    const fromLocal = localStorage.getItem(rt) || 
                      localStorage.getItem("refreshToken") ||
                      localStorage.getItem(USER_RT)
    if (fromLocal) return fromLocal

    // 2. Fallback to sessionStorage
    const fromSession = sessionStorage.getItem(rt) || 
                        sessionStorage.getItem("refreshToken") ||
                        localStorage.getItem(USER_RT)
    if (fromSession) return fromSession
    // 3. Fallback: Parse user profile from localStorage
    try {
      const userStr = localStorage.getItem("smarterp_user") || localStorage.getItem("smarterp_admin_user")
      if (userStr) {
        const u = JSON.parse(userStr)
        if (u?.refreshToken) return u.refreshToken
      }
    } catch (_) {}
  }
  return null
}

// Sync sessionStorage whenever localStorage tokens change across tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === USER_AT || e.key === USER_RT || e.key === "accessToken" || e.key === "refreshToken") {
      if (e.newValue) {
        try { sessionStorage.setItem(e.key, e.newValue) } catch {}
      }
    }
  })
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
    logger.warn("[v0] Session expired or invalid token refresh — clearing tokens and redirecting to login")
    clearTokens() // Clears _at, _rt, accessToken, refreshToken from storage
    localStorage.removeItem("smarterp_user")
    localStorage.removeItem("smarterp_admin_user")
    sessionStorage.removeItem("smarterp_mock_users")

    if ((window as any).Android?.logout) {
      (window as any).Android.logout()
    } else if (window.location.pathname !== "/" && window.location.pathname !== "/auth/login") {
      window.location.href = "/auth/login"
    }
  }
}

// ── Session Refresh Queue Mutex ──────────────────────────────────────────────
// Prevents concurrent 401s from each spawning a refresh, which causes
// replay-protection to terminate the session. Instead, all parallel requests
// queue up and await a SINGLE refresh call.
let refreshPromise: Promise<any> | null = null
let refreshSubscribers: Array<(token: string | null) => void> = []

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb)
}

function notifySubscribers(newToken: string | null) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

export async function apiClient<T = any>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"
  
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  }

  // Attach access token if available, or auto-refresh if missing
  let currentToken = getAuthToken(path)
  if (!currentToken && !path.includes('/auth/')) {
    const storedRt = getRefreshToken(path)
    if (storedRt) {
      try {
        const autoRefRes = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRt }),
          credentials: "include"
        })
        if (autoRefRes.ok) {
          const refData = await autoRefRes.json()
          if (refData?.accessToken) {
            setTokens(refData.accessToken, refData.refreshToken || storedRt)
            currentToken = refData.accessToken
          }
        }
      } catch (_) {}
    }
  }

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
      // 🚀 PART 2: API RETRY SYSTEM (NETWORK RESILIENCE)
      // Retry failed requests ONLY IF: network error OR timeout
      // NOT for 401 / 403 (handled separately)
      const isTransientError = error.name === 'TypeError' || error.name === 'TimeoutError' || error.message?.includes('fetch')
      const isGetRequest = !options.method || options.method.toUpperCase() === 'GET'
      const canRetry = retries > 0 && isTransientError && isGetRequest

      if (canRetry) {
        const delay = retries === 2 ? 500 : 1000 // 500ms -> 1000ms
        await new Promise(resolve => setTimeout(resolve, delay))
        return apiClient(path, options, retries - 1)
      }

      // Handle direct cancellations (e.g. navigation) - don't log these to Sentry
      if (error.name === 'AbortError') {
        throw { name: 'AbortError', message: 'Request cancelled' };
      }

      const safeOriginal = error instanceof Error ? error.message : String(error);
      logger.error(`[apiClient] Connection Error: ${path}`, { error: safeOriginal });
      throw new Error("Unable to connect to the server. Please check your internet connection and try again.")
    }

    // ── 401 Interception with Subscriber Queue ────────────────────────────────
    if (res.status === 401) {
      const storedRefreshToken = getRefreshToken()
      if (!storedRefreshToken) {
        // No refresh token at all — hard logout
        handleLogout()
        throw new Error("Session expired. Please log in again.")
      }

      if (refreshPromise) {
        // Another request is already refreshing — subscribe and wait for the new token
        const newToken = await new Promise<string | null>((resolve) => {
          subscribeTokenRefresh(resolve)
        })
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`
          res = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: "include" })
        } else {
          throw new Error("Session refresh failed. Please log in again.")
        }
      } else {
        // This request owns the refresh — all subsequent 401s will queue
        refreshPromise = fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        }).then(async (r) => {
          if (r.ok) {
            const data = await r.json()
            if (data.accessToken) {
              setTokens(data.accessToken, data.refreshToken || storedRefreshToken || "", data.isSuperAdmin)
              syncWithAndroid(data.accessToken, data.refreshToken)
              notifySubscribers(data.accessToken) // wake up all waiting requests
            } else {
              notifySubscribers(null)
            }
            return data
          }
          notifySubscribers(null)
          throw new Error("Refresh failed")
        }).catch((err) => {
          notifySubscribers(null)
          throw err
        }).finally(() => {
          refreshPromise = null
        })

        try {
          await refreshPromise
          const newToken = getAccessToken()
          if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`
          }
          res = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: "include" })

          if (res.status === 401) {
            // Still 401 after a fresh access token — session is genuinely invalid
            handleLogout()
            throw new Error("Authentication required. Please log in again.")
          }
        } catch (refreshErr) {
          handleLogout()
          throw refreshErr
        }
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      if (res.status === 403 && (error.code === 'PLAN_LIMIT_REACHED' || error.details?.limitType)) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('plan-limit-reached', { detail: error.details }))
        }
      }
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
      const safeOriginal = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
      logger.error(`[apiClient] ${error.status ? 'API Error' : 'Connection Error'}: ${path}`, {
        path,
        status: error.status,
        method: options.method || 'GET',
        error: safeOriginal
      });
    }

    if (error.status || error.message?.includes("internet connection")) {
      throw error;
    }
    
    const safeErrorForThrow = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error).substring(0, 200) : String(error));
    throw { message: "Something went wrong. Please try again.", originalError: safeErrorForThrow };
  } finally {
    markRequestEnd(requestId)
  }
}

apiClient.get = <T = any>(path: string, options: RequestInit = {}) => apiClient<T>(path, { ...options, method: "GET" })
apiClient.post = <T = any>(path: string, body?: any, options: RequestInit = {}) =>
  apiClient<T>(path, {
    ...options,
    method: "POST",
    ...(body !== undefined && { body: body instanceof FormData ? body : JSON.stringify(body) }),
  })
apiClient.put = <T = any>(path: string, body?: any, options: RequestInit = {}) =>
  apiClient<T>(path, {
    ...options,
    method: "PUT",
    ...(body !== undefined && { body: body instanceof FormData ? body : JSON.stringify(body) }),
  })
apiClient.delete = <T = any>(path: string, options: RequestInit = {}) => apiClient<T>(path, { ...options, method: "DELETE" })

