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

let _accessToken: string | null = null
let _refreshToken: string | null = null

const ADMIN_AT = "_admin_at"
const ADMIN_RT = "_admin_rt"
const USER_AT = "_at"
const USER_RT = "_rt"

function getStorageKeys() {
  if (typeof window === "undefined") return { at: USER_AT, rt: USER_RT }
  
  // Heuristic: If we are on an admin route or the admin user is the active one in localStorage context
  const isAdminPath = window.location.pathname.includes('super-admin-control-center') || 
                      window.location.pathname.includes('[adminRoute]')
  
  // We check if an admin user exists
  const adminUser = localStorage.getItem("smarterp_admin_user")
  
  if (isAdminPath || adminUser) {
    return { at: ADMIN_AT, rt: ADMIN_RT }
  }
  return { at: USER_AT, rt: USER_RT }
}

export function setTokens(accessToken: string, refreshToken: string, isAdmin = false) {
  _accessToken = accessToken
  _refreshToken = refreshToken
  if (typeof window !== "undefined") {
    const { at, rt } = isAdmin ? { at: ADMIN_AT, rt: ADMIN_RT } : { at: USER_AT, rt: USER_RT }
    
    sessionStorage.setItem(at, accessToken)
    sessionStorage.setItem(rt, refreshToken)
    localStorage.setItem(at, accessToken)
    localStorage.setItem(rt, refreshToken)
    
    // Sync with legacy names if not admin
    if (!isAdmin) {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
    }
  }
}

export function clearTokens(isAdmin?: boolean) {
  if (typeof isAdmin === 'undefined') {
    _accessToken = null
    _refreshToken = null
  }
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
  if (_accessToken) return _accessToken
  if (typeof window !== "undefined") {
    const { at } = getStorageKeys()
    const token = sessionStorage.getItem(at) || localStorage.getItem(at) || localStorage.getItem("accessToken")
    if (token) _accessToken = token
    return token
  }
  return null
}

function getRefreshToken(): string | null {
  if (_refreshToken) return _refreshToken
  if (typeof window !== "undefined") {
    const { rt } = getStorageKeys()
    const token = sessionStorage.getItem(rt) || localStorage.getItem(rt) || localStorage.getItem("refreshToken")
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
              setTokens(data.accessToken, data.refreshToken || storedRefreshToken || "", data.isSuperAdmin)
              syncWithAndroid(data.accessToken, data.refreshToken)
              console.log("[v0] Token refreshed successfully", data.isSuperAdmin ? "(Admin)" : "(User)")
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
