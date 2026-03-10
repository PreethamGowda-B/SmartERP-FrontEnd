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
    localStorage.removeItem("smarterp_user")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")

    // Clear any other session-related data
    sessionStorage.removeItem("smarterp_mock_users")

    // Notify Android that we've logged out
    if ((window as any).Android?.logout) {
      (window as any).Android.logout()
    } else {
      // For website version, redirect to login
      window.location.href = "/auth/login"
    }
  }
}

export async function apiClient(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  // Get access token from localStorage (for Bearer auth)
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ attach token if available
    ...(options.headers as Record<string, string>),
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include", // ✅ allows cookie-based sessions too
    })
  } catch (error) {
    console.error("[v0] Network error in apiClient:", error)
    throw error
  }

  // 🧩 If token expired or invalid → try refresh
  if (res.status === 401) {
    console.warn("[v0] Unauthorized — attempting refresh")

    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshRes.ok) {
          const newTokens = await refreshRes.json()
          if (newTokens.accessToken) localStorage.setItem("accessToken", newTokens.accessToken)
          if (newTokens.refreshToken) localStorage.setItem("refreshToken", newTokens.refreshToken)

          // ✅ Sync updated tokens back to Android native app
          syncWithAndroid(newTokens.accessToken, newTokens.refreshToken)

          // Retry original request with new token
          res = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${newTokens.accessToken}`,
            },
            credentials: "include",
          })

          // If retry also returns 401, log out
          if (res.status === 401) {
            handleLogout()
            throw new Error("Session expired after refresh")
          }
        } else {
          // Refresh call failed with a status like 401 or 403
          handleLogout()
          throw new Error("Session expired")
        }
      } catch (error) {
        console.error("[v0] Token refresh failed:", error)
        handleLogout()
        throw error
      }
    } else {
      // No refresh token available, just log out
      handleLogout()
      throw new Error("No refresh token available")
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }

  return res.json()
}
