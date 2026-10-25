import { getApiOrigin } from "@/lib/api-environment.mjs";
import { isOfflineFetchFailure } from "@/lib/api-network-status.mjs";
// ============================================================
// Token store — shifted to check both sessionStorage and localStorage
// to support PERSISTENT login (across tab closes) and Android bridge compatibility.
// ============================================================
import { triggerFeatureLock } from "@/components/locked-feature-prompt"
import { triggerSlowNetworkNotice } from "@/components/slow-network-notice"
import { logger } from "./logger"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import {
  isProtectedRequestAuthFailure,
  isRejectedRefreshResponse,
  isSameAuthSession,
  resolveAuthScope,
  withAuthRefreshLock,
} from "./auth-session.mjs"
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

  const scope = resolveAuthScope({
    targetPath,
    pathname: window.location.pathname,
    hostname: window.location.hostname,
  })
  if (scope === "admin") {
    return { at: ADMIN_AT, rt: ADMIN_RT }
  }
  
  return { at: USER_AT, rt: USER_RT }
}

import { safeLocalStorage, safeSessionStorage } from "./storage"

export function setTokens(accessToken: string, refreshToken: string, isAdmin = false) {
  if (typeof window !== "undefined") {
    const { at, rt } = isAdmin ? { at: ADMIN_AT, rt: ADMIN_RT } : { at: USER_AT, rt: USER_RT }
    
    // Store in both sessionStorage and localStorage for persistent cross-tab & cross-session logins
    safeSessionStorage.setItem(at, accessToken)
    safeSessionStorage.setItem(rt, refreshToken)
    safeLocalStorage.setItem(at, accessToken)
    safeLocalStorage.setItem(rt, refreshToken)

    if (!isAdmin) {
      safeLocalStorage.setItem("accessToken", accessToken)
      safeLocalStorage.setItem("refreshToken", refreshToken)
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

    // Broadcast token update across the window for SSE / realtime components
    window.dispatchEvent(new CustomEvent("auth-token-refreshed", {
      detail: { accessToken, refreshToken, isAdmin }
    }))
  }
}

// ── In-Flight Request Deduplication & Fast Memory Cache ─────────────────────
// Deduplicates simultaneous GET requests and caches GET responses for 3 seconds
// strictly partitioned by user auth token (preserving multi-tenant isolation).
const inFlightGets = new Map<string, Promise<any>>()
const getCache = new Map<string, { data: any; expiresAt: number }>()
const GET_CACHE_TTL_MS = 3000 // 3 seconds default
const METADATA_CACHE_TTL_MS = 30000 // 30 seconds for slow-changing metadata

function getCacheTtlForPath(path: string): number {
  if (
    path.startsWith('/api/settings/company') ||
    path.startsWith('/api/subscription/') ||
    path.startsWith('/api/users/me')
  ) {
    return METADATA_CACHE_TTL_MS
  }
  return GET_CACHE_TTL_MS
}

let successfulMutationVersion = 0
let lastSuccessfulMutationAt = 0

function hasEmptyListPayload(payload: any): boolean {
  if (Array.isArray(payload)) return payload.length === 0
  if (!payload || typeof payload !== "object") return false
  return ["jobs", "requests", "items", "results", "employees", "invoices", "bills", "data"]
    .some((key) => Array.isArray(payload[key]) && payload[key].length === 0)
}

export function clearApiCache() {
  successfulMutationVersion += 1
  inFlightGets.clear()
  getCache.clear()
}

export function clearTokens(isAdmin?: boolean) {
  clearApiCache()
  if (typeof window !== "undefined") {
    const keysToClear = isAdmin === true ? [{at: ADMIN_AT, rt: ADMIN_RT}] : 
                       isAdmin === false ? [{at: USER_AT, rt: USER_RT}] :
                       [{at: ADMIN_AT, rt: ADMIN_RT}, {at: USER_AT, rt: USER_RT}]
    
    keysToClear.forEach(k => {
      safeSessionStorage.removeItem(k.at)
      safeSessionStorage.removeItem(k.rt)
      safeLocalStorage.removeItem(k.at)
      safeLocalStorage.removeItem(k.rt)
    })
    
    if (isAdmin !== true) {
      safeLocalStorage.removeItem("accessToken")
      safeLocalStorage.removeItem("refreshToken")
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
    const adminToken = safeLocalStorage.getItem(ADMIN_AT) || safeSessionStorage.getItem(ADMIN_AT)
    if (adminToken) return adminToken
    try {
      const u = safeLocalStorage.getJSON<{ accessToken?: string }>("smarterp_admin_user")
      if (u?.accessToken) return u.accessToken
    } catch (_) {}
    // Never send an Owner/Employee token to an admin-scoped request.
    return null
  }
  
  // 1. Check primary token in localStorage
  const fromLocal = safeLocalStorage.getItem(at) || 
                    safeLocalStorage.getItem("accessToken") || 
                    safeLocalStorage.getItem(USER_AT)
  if (fromLocal) return fromLocal

  // 2. Fallback to sessionStorage
  const fromSession = safeSessionStorage.getItem(at) || 
                      safeSessionStorage.getItem("accessToken") || 
                      safeSessionStorage.getItem(USER_AT)
  if (fromSession) return fromSession

  // 3. Fallback: Parse user profile from localStorage
  try {
    const u = safeLocalStorage.getJSON<{ accessToken?: string }>("smarterp_user") ||
              safeLocalStorage.getJSON<{ accessToken?: string }>("smarterp_admin_user")
    if (u?.accessToken) return u.accessToken
  } catch (_) {}

  return null
}

export function getAccessToken(targetPath?: string) {
  return getAuthToken(targetPath)
}

export function getRefreshToken(targetPath?: string): string | null {
  if (typeof window !== "undefined") {
    const { rt } = getStorageKeys(targetPath)
    if (rt === ADMIN_RT) {
      const adminRefreshToken = safeLocalStorage.getItem(ADMIN_RT) || safeSessionStorage.getItem(ADMIN_RT)
      if (adminRefreshToken) return adminRefreshToken
      try {
        const adminUser = safeLocalStorage.getJSON<{ refreshToken?: string }>("smarterp_admin_user")
        if (adminUser?.refreshToken) return adminUser.refreshToken
      } catch (_) {}
      // Never refresh an admin request with the staff portal's token.
      return null
    }
    
    // 1. Check localStorage first (shared across all browser tabs)
    const fromLocal = safeLocalStorage.getItem(rt) || 
                      safeLocalStorage.getItem("refreshToken") ||
                      safeLocalStorage.getItem(USER_RT)
    if (fromLocal) return fromLocal

    // 2. Fallback to sessionStorage
    const fromSession = safeSessionStorage.getItem(rt) || 
                        safeSessionStorage.getItem("refreshToken") ||
                        safeSessionStorage.getItem(USER_RT)
    if (fromSession) return fromSession

    // 3. Fallback: Parse user profile from localStorage
    try {
      const u = safeLocalStorage.getJSON<{ refreshToken?: string }>("smarterp_user") ||
                safeLocalStorage.getJSON<{ refreshToken?: string }>("smarterp_admin_user")
      if (u?.refreshToken) return u.refreshToken
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
function handleLogout(
  targetPath?: string,
  expected?: { accessToken?: string | null; refreshToken?: string | null }
) {
  if (typeof window !== "undefined") {
    const { at } = getStorageKeys(targetPath)
    const isAdmin = at === ADMIN_AT
    if (expected && !isSameAuthSession({
      expectedAccessToken: expected.accessToken || undefined,
      expectedRefreshToken: expected.refreshToken || undefined,
      currentAccessToken: getAuthToken(targetPath),
      currentRefreshToken: getRefreshToken(targetPath),
    })) {
      return false
    }

    logger.warn("[v0] Session expired or invalid token refresh — clearing tokens and redirecting to login")
    clearTokens(isAdmin)
    if (isAdmin) {
      safeLocalStorage.removeItem("smarterp_admin_user")
    } else {
      safeLocalStorage.removeItem("smarterp_user")
      sessionStorage.removeItem("smarterp_mock_users")
    }

    if ((window as any).Android?.logout) {
      (window as any).Android.logout()
    } else if (window.location.pathname !== "/" && window.location.pathname !== "/auth/login") {
      window.location.href = "/auth/login"
    }
    return true
  }
  return false
}

/**
 * Decodes base64 JWT payload and checks if token is expired (or expires within bufferSeconds)
 */
export function isTokenExpired(token: string | null, bufferSeconds = 45): boolean {
  if (!token) return true
  try {
    const parts = token.split(".")
    if (parts.length < 2) return true
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const payload = JSON.parse(jsonPayload)
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000 - bufferSeconds * 1000
  } catch {
    return true
  }
}

// Share concurrent refreshes inside one portal only. Owner/Employee and
// superadmin sessions can coexist in the same browser profile.
const refreshPromises = new Map<string, Promise<string | null>>()
const refreshOutcomes = new Map<string, "pending" | "success" | "invalid" | "unavailable">()

export function getLastRefreshOutcome(targetPath?: string) {
  return refreshOutcomes.get(getStorageKeys(targetPath).rt) || "unavailable"
}

function isPublicAuthEndpoint(path: string) {
  return /^\/api\/(?:v1\/)?auth\/(?:login|signup|send-otp|forgot-password|verify-reset-otp|reset-password|refresh|check-email|google(?:\/|$))(?:\/|$)/.test(path)
}

/**
 * Proactively refreshes the session using the stored refresh token.
 * Completely deduplicated across concurrent requests.
 */
export async function refreshAccessToken(targetPath?: string): Promise<string | null> {
  if (typeof window === "undefined") return null
  const { rt } = getStorageKeys(targetPath)
  const requestedRefreshToken = getRefreshToken(targetPath)
  const requestedAccessToken = getAuthToken(targetPath)
  if (!requestedRefreshToken) {
    refreshOutcomes.set(rt, "invalid")
    return null
  }

  const existingRefresh = refreshPromises.get(rt)
  if (existingRefresh) return existingRefresh

  refreshOutcomes.set(rt, "pending")
  const baseUrl = getApiOrigin()

  const refreshPromise = withAuthRefreshLock(rt, async () => {
    // Another tab may have rotated the token while this tab waited for the
    // shared lock. Reuse its live access token instead of replaying the old
    // refresh token (which the server correctly treats as credential reuse).
    const expectedAccessToken = getAuthToken(targetPath)
    const expectedRefreshToken = getRefreshToken(targetPath)
    if (!expectedRefreshToken) {
      refreshOutcomes.set(rt, "invalid")
      return null
    }
    if (
      expectedAccessToken &&
      !isTokenExpired(expectedAccessToken) &&
      (expectedRefreshToken !== requestedRefreshToken || expectedAccessToken !== requestedAccessToken)
    ) {
      refreshOutcomes.set(rt, "success")
      return expectedAccessToken
    }

    const { at } = getStorageKeys(targetPath)
    const isAdmin = at === ADMIN_AT
    let response: Response
    try {
      response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refreshToken: expectedRefreshToken }),
      })
    } catch {
      refreshOutcomes.set(rt, "unavailable")
      return null
    }

    if (response.ok) {
      try {
        const data = await response.json()
        if (data.accessToken) {
          if (!isSameAuthSession({
            expectedAccessToken: expectedAccessToken || undefined,
            expectedRefreshToken,
            currentAccessToken: getAuthToken(targetPath),
            currentRefreshToken: getRefreshToken(targetPath),
          })) {
            // A newer login/refresh won while the response was in flight.
            refreshOutcomes.set(rt, "success")
            const current = getAuthToken(targetPath)
            return current && !isTokenExpired(current) ? current : null
          }
          setTokens(data.accessToken, data.refreshToken || expectedRefreshToken, isAdmin)
          syncWithAndroid(data.accessToken, data.refreshToken)
          refreshOutcomes.set(rt, "success")
          return data.accessToken
        }
      } catch {
        // A malformed success response is unavailable, not proof of revocation.
      }
      refreshOutcomes.set(rt, "unavailable")
      return null
    }

    if (isRejectedRefreshResponse(response.status)) {
      if (isSameAuthSession({
        expectedAccessToken: expectedAccessToken || undefined,
        expectedRefreshToken,
        currentAccessToken: getAuthToken(targetPath),
        currentRefreshToken: getRefreshToken(targetPath),
      })) {
        refreshOutcomes.set(rt, "invalid")
        handleLogout(targetPath, { accessToken: expectedAccessToken, refreshToken: expectedRefreshToken })
      } else {
        refreshOutcomes.set(rt, "success")
        const current = getAuthToken(targetPath)
        return current && !isTokenExpired(current) ? current : null
      }
      return null
    }

    // A timeout, offline response, or service error does not prove the refresh
    // credential was revoked, so retain the cached session and allow retry.
    refreshOutcomes.set(rt, "unavailable")
    return null
  }).catch(() => {
    refreshOutcomes.set(rt, "unavailable")
    return null
  }).finally(() => {
    if (refreshPromises.get(rt) === refreshPromise) refreshPromises.delete(rt)
  })

  refreshPromises.set(rt, refreshPromise)
  return refreshPromise
}

/**
 * Returns a valid, non-expired access token, auto-refreshing if expired or missing.
 */
export async function getValidAccessToken(targetPath?: string): Promise<string | null> {
  const currentToken = getAuthToken(targetPath)
  if (currentToken && !isTokenExpired(currentToken)) {
    return currentToken
  }
  return await refreshAccessToken(targetPath)
}

export type ApiRequestInit = RequestInit & { timeoutMs?: number }

export async function apiClient<T = any>(path: string, options: ApiRequestInit = {}, retries = 2): Promise<T> {
  const baseUrl = getApiOrigin()
  
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  }

  // Attach access token if available, or proactively auto-refresh if missing or expired
  let currentToken = getAuthToken(path)
  const isExpired = !currentToken || isTokenExpired(currentToken)
  if (isExpired && !path.includes('/auth/')) {
    try {
      const freshToken = await refreshAccessToken(path)
      if (freshToken) {
        currentToken = freshToken
      }
    } catch (_) {}
  }

  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`
  }

  const method = (options.method || "GET").toUpperCase()
  const isGet = method === "GET"
  const skipCache = Boolean((options as any)?.skipCache) || Boolean(options.signal)
  const staleReadRetries = Number((options as any)?.__staleReadRetries || 0)
  const emptyListRetries = Number((options as any)?.__emptyListRetries || 0)
  const mutationVersionAtStart = successfulMutationVersion

  if (!isGet) {
    getCache.clear()
  }

  // Deduplication & cache key uses token to enforce strict multi-tenant isolation
  const cacheKey = (isGet && !skipCache) ? `${currentToken || "anon"}:${path}` : null

  if (cacheKey) {
    const cached = getCache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }
    const inFlight = inFlightGets.get(cacheKey)
    if (inFlight) {
      return inFlight
    }
  }

  const executeRequest = async (): Promise<T> => {
    const requestId = Math.random().toString(36).substring(7)
    const requestAccessToken = currentToken
    markRequestStart(requestId)

    try {
      let res: Response
      try {
        // Use controller to handle potential timeouts if needed
        const controller = new AbortController()
        const timeoutMs = (options as any)?.timeoutMs || 15000 // 15s timeout
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        res = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers,
          credentials: "include",
          ...(isGet ? { cache: "no-store" as RequestCache } : {}),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (error: any) {
        if (error.name === "OfflineError" || error.isOffline) {
          throw error;
        }

        // Handle direct cancellations (e.g. navigation) - don't log these
        if (error.name === "AbortError") {
          throw { name: "AbortError", message: "Request cancelled" };
        }

        // navigator.onLine is only a browser hint and may be false while the
        // API is reachable. We already attempted fetch here, so use it only to
        // qualify a real network failure rather than short-circuiting requests.
        const deviceReportsOffline = typeof navigator !== "undefined" && !navigator.onLine;
        if (isOfflineFetchFailure(error, deviceReportsOffline)) {
          throw {
            name: "OfflineError",
            message: "SmartERP could not be reached. Your device may be offline or the service may be temporarily unreachable.",
            isOffline: true,
          };
        }

        // 🚀 PART 2: API RETRY SYSTEM (NETWORK RESILIENCE)
        // Retry failed requests ONLY IF: network error OR timeout, AND device is confirmed online
        const isTransientError = error.name === "TypeError" || error.name === "TimeoutError" || error.message?.includes("fetch")
        const isGetRequest = !options.method || options.method.toUpperCase() === "GET"
        const canRetry = retries > 0 && isTransientError && isGetRequest && !deviceReportsOffline

        if (canRetry) {
          const delay = retries === 2 ? 500 : 1000 // 500ms -> 1000ms
          await new Promise(resolve => setTimeout(resolve, delay))
          return apiClient(path, options, retries - 1)
        }

        const safeOriginal = error instanceof Error ? error.message : String(error);
        logger.error(`[apiClient] Connection Error: ${path}`, { error: safeOriginal });
        throw new Error("Unable to connect to the server. Please check your internet connection and try again.")
      }

      // ── 401 Interception (Fallback if server rejected active token) ───────────
      if (isProtectedRequestAuthFailure(res.status) && !isPublicAuthEndpoint(path)) {
        const latestAccessToken = getAuthToken(path)
        if (latestAccessToken !== requestAccessToken) {
          // This response belongs to a session that has already been replaced.
          // Do not refresh or clear the newer session because of it.
          throw new Error("The active session changed while this request was running. Please retry.")
        }

        const storedRefreshToken = getRefreshToken(path)
        if (!storedRefreshToken) {
          handleLogout(path, requestAccessToken ? { accessToken: requestAccessToken } : undefined)
          throw new Error("Session expired. Please log in again.")
        }

        try {
          const freshToken = await refreshAccessToken(path)
          if (freshToken) {
            const retryRefreshToken = getRefreshToken(path)
            if (getAuthToken(path) !== freshToken) {
              throw new Error("The active session changed while this request was running. Please retry.")
            }
            headers["Authorization"] = `Bearer ${freshToken}`
            res = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: "include", ...(isGet ? { cache: "no-store" as RequestCache } : {}) })
            if (res.status === 401) {
              const didLogout = handleLogout(path, {
                accessToken: freshToken,
                refreshToken: retryRefreshToken,
              })
              throw new Error(didLogout
                ? "Authentication required. Please log in again."
                : "The active session changed while this request was running. Please retry.")
            }
          } else {
            throw new Error("Could not verify your session. Check your connection and retry.")
          }
        } catch (refreshErr) {
          throw refreshErr
        }
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }))
        if (res.status === 403 && (error.error === 'company_suspended' || error.error === 'account_suspended' || error.error === 'your_company_is_suspended')) {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/suspended')) {
            window.location.href = `/suspended?reason=${encodeURIComponent(error.error)}`
          }
        }
        if (res.status === 403 && (error.code === 'PLAN_LIMIT_REACHED' || error.details?.limitType)) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('plan-limit-reached', { detail: error.details }))
          }
        }
        const isSilentBackground = path.includes('/location/update') || Boolean((options as any)?.silent403);
        if (res.status === 403 && error.upgrade_required && !isSilentBackground) {
          triggerFeatureLock({
            feature: error.feature || "this premium feature",
            current_plan: error.current_plan,
            message: error.message
          })
          throw { ...error, status: 403, upgrade_required: true, handled: true }
        }
        throw { ...error, status: res.status }
      }

      const result = await res.json()
      // A transient empty list immediately after a write should not erase a
      // portal's populated view. Confirm it from the origin before returning it.
      if (isGet && hasEmptyListPayload(result) && Date.now() - lastSuccessfulMutationAt < 15000 && emptyListRetries < 2) {
        await new Promise((resolve) => setTimeout(resolve, 250))
        return apiClient<T>(path, {
          ...options,
          cache: "no-store",
          skipCache: true,
          __emptyListRetries: emptyListRetries + 1,
        } as any, retries)
      }
      // A read that started before a successful write must not publish its
      // stale snapshot over the updated portal state. Re-read it once from the
      // origin without using the in-memory GET cache.
      if (isGet && mutationVersionAtStart !== successfulMutationVersion && staleReadRetries < 2) {
        return apiClient<T>(path, { ...options, cache: "no-store", skipCache: true, __staleReadRetries: staleReadRetries + 1 } as any, retries)
      }
      if (!isGet) {
        successfulMutationVersion += 1
        lastSuccessfulMutationAt = Date.now()
        getCache.clear()
      }
      if (cacheKey && mutationVersionAtStart === successfulMutationVersion) {
        getCache.set(cacheKey, { data: result, expiresAt: Date.now() + getCacheTtlForPath(path) })
      }
      return result
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      if (error.name === 'OfflineError' || error.isOffline) throw error;

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

  if (cacheKey) {
    let promise: Promise<T>
    promise = executeRequest().finally(() => {
      if (inFlightGets.get(cacheKey) === promise) inFlightGets.delete(cacheKey)
    })
    inFlightGets.set(cacheKey, promise)
    return promise
  }

  return executeRequest()
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

