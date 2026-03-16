// ============================================================
// Token store — shifted to check both sessionStorage and localStorage
// to support PERSISTENT login (across tab closes) and Android bridge compatibility.
// ============================================================
import { triggerFeatureLock } from "@/components/locked-feature-prompt"
import { triggerSlowNetworkNotice } from "@/components/slow-network-notice"

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

let _accessToken: string | null =
  typeof window !== "undefined" 
    ? (sessionStorage.getItem("_at") || localStorage.getItem("_at") || localStorage.getItem("accessToken")) 
    : null
let _refreshToken: string | null =
  typeof window !== "undefined" 
    ? (sessionStorage.getItem("_rt") || localStorage.getItem("_rt") || localStorage.getItem("refreshToken")) 
    : null

export function setTokens(accessToken: string, refreshToken: string) {
  _accessToken = accessToken
  _refreshToken = refreshToken
  if (typeof window !== "undefined") {
    // Save to BOTH for maximum reliability across reloads/bridge syncs
    sessionStorage.setItem("_at", accessToken)
    sessionStorage.setItem("_rt", refreshToken)
    localStorage.setItem("_at", accessToken)
    localStorage.setItem("_rt", refreshToken)
  }
}

export function clearTokens() {
  _accessToken = null
  _refreshToken = null
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("_at")
    sessionStorage.removeItem("_rt")
    localStorage.removeItem("_at")
    localStorage.removeItem("_rt")
    // Also clear Android-specific keys if they exist
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
  }
}

export function getAccessToken() {
  if (_accessToken) return _accessToken
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("_at") || localStorage.getItem("_at") || localStorage.getItem("accessToken")
    if (token) _accessToken = token
    return token
  }
  return null
}

function getRefreshToken(): string | null {
  if (_refreshToken) return _refreshToken
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("_rt") || localStorage.getItem("_rt") || localStorage.getItem("refreshToken")
    if (token) _refreshToken = token
    return token
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
    console.warn("[v0] Session expired or invalid — logging out")
    clearTokens()
    localStorage.removeItem("smarterp_user")
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

export async function apiClient(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  // Attach access token if available
  const token = getAccessToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const requestId = Math.random().toString(36).substring(7)
  markRequestStart(requestId)

  try {
    let res: Response
    try {
      res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        credentials: "include",
      })
    } catch (error) {
      console.error("[v0] Network error in apiClient:", error)
      throw error
    }

    // If token expired → try refresh
    if (res.status === 401) {
      console.warn("[v0] Unauthorized — attempting refresh")

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
              setTokens(data.accessToken, data.refreshToken || storedRefreshToken || "")
              syncWithAndroid(data.accessToken, data.refreshToken)
              console.log("[v0] Token refreshed successfully")
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
        
        // Retry original request with new token
        const newToken = getAccessToken()
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`
        }
        
        res = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers,
          credentials: "include",
        })

        if (res.status === 401) {
          handleLogout()
          throw new Error("Session expired after refresh")
        }
      } catch (error) {
        handleLogout()
        throw error
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      
      // Feature locking logic
      if (res.status === 403 && error.upgrade_required) {
        triggerFeatureLock({
          feature: error.feature || "this premium feature",
          current_plan: error.current_plan,
          message: error.message
        })
        return new Promise(() => {})
      }
      
      // Attach status to error for better handling in hooks
      throw { ...error, status: res.status }
    }

    return await res.json()
  } finally {
    markRequestEnd(requestId)
  }
}
