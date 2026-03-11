// ============================================================
// Token store — persisted in sessionStorage so page reloads work
// instantly without any async refresh race condition.
// sessionStorage is cleared when the browser tab is closed.
// ============================================================
let _accessToken: string | null =
  typeof window !== "undefined" ? sessionStorage.getItem("_at") : null
let _refreshToken: string | null =
  typeof window !== "undefined" ? sessionStorage.getItem("_rt") : null

export function setTokens(accessToken: string, refreshToken: string) {
  _accessToken = accessToken
  _refreshToken = refreshToken
  if (typeof window !== "undefined") {
    sessionStorage.setItem("_at", accessToken)
    sessionStorage.setItem("_rt", refreshToken)
  }
}

export function clearTokens() {
  _accessToken = null
  _refreshToken = null
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("_at")
    sessionStorage.removeItem("_rt")
  }
}

export function getAccessToken() {
  return _accessToken
}

// Restore refresh token from sessionStorage on page reload
function getRefreshToken(): string | null {
  if (_refreshToken) return _refreshToken
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("_rt")
  }
  return null
}

// Helper to sync tokens with Android Native bridge
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

export async function apiClient(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  // ✅ Attach access token if available (cross-domain Authorization header)
  const token = _accessToken
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include", // still include for same-domain cookie fallback
    })
  } catch (error) {
    console.error("[v0] Network error in apiClient:", error)
    throw error
  }

  // 🧩 If token expired → try refresh
  if (res.status === 401) {
    console.warn("[v0] Unauthorized — attempting refresh")

    const storedRefreshToken = getRefreshToken()

    try {
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
      })

      if (refreshRes.ok) {
        const newTokens = await refreshRes.json()

        if (newTokens.accessToken) {
          setTokens(newTokens.accessToken, newTokens.refreshToken || storedRefreshToken || "")
          syncWithAndroid(newTokens.accessToken, newTokens.refreshToken)
          headers["Authorization"] = `Bearer ${newTokens.accessToken}`
        }

        // Retry original request with new token
        res = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers,
          credentials: "include",
        })

        if (res.status === 401) {
          handleLogout()
          throw new Error("Session expired after refresh")
        }
      } else {
        handleLogout()
        throw new Error("Session expired")
      }
    } catch (error) {
      console.error("[v0] Token refresh failed:", error)
      handleLogout()
      throw error
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }

  return res.json()
}
