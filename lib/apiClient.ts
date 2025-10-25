export async function apiClient(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  // Send cookies by default (for httpOnly cookie auth)
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include", // Ensure cookies are sent with every request
  })

  if (res.status === 401) {
    // try refresh
    try {
      await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      // retry original request
      const retry = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        credentials: "include",
      })
      if (!retry.ok) {
        const error = await retry.json().catch(() => ({ message: retry.statusText }))
        throw error
      }
      return retry.json()
    } catch (error) {
      // If refresh fails, clear local user data
      if (typeof window !== "undefined") {
        localStorage.removeItem("smarterp_user")
      }
      throw error
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }

  return res.json()
}
