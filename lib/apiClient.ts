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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include", // ✅ enables cookie-based sessions (HttpOnly tokens)
    })
  } catch (error) {
    console.error("[v0] Network error in apiClient:", error)
    throw error
  }

  // 🧩 If token expired or invalid → try refresh
  if (res.status === 401) {
    console.warn("[v0] Unauthorized — attempting refresh")

    try {
      // ✅ We don't send the token manually. The browser sends the HttpOnly refresh_token cookie automatically.
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (refreshRes.ok) {
        // The backend returns access tokens but also SETS them as secure cookies.
        // We do NOT store them in localStorage anymore.
        const newTokens = await refreshRes.json()

        // ✅ Sync updated tokens back to Android native app (if in Android environment)
        syncWithAndroid(newTokens.accessToken, newTokens.refreshToken)

        // Retry original request (browser will automatically send the newly set HttpOnly cookie)
        res = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers,
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
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }

  return res.json()
}
