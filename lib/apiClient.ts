/**
 * Centralized API client for SmartERP
 * - Attaches JWT token automatically
 * - Handles 401 correctly (NO refresh loop)
 * - Prevents fallback fake data issues
 * - Keeps structure intact
 */

export async function apiClient(
  path: string,
  options: RequestInit = {}
) {
  // ✅ Base URL (from env or local fallback)
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  // ✅ Read token safely (client-side only)
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null

  // ✅ Merge headers safely
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  let response: Response

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
    })
  } catch (networkError) {
    // 🔴 Network / CORS / server down
    console.error("[apiClient] Network error:", networkError)
    throw new Error("NETWORK_ERROR")
  }

  // 🔐 AUTH ERROR — handle explicitly (NO refresh loop)
  if (response.status === 401) {
    console.error("[apiClient] Unauthorized – invalid or expired token")

    if (typeof window !== "undefined") {
      // Clear auth + cached jobs to avoid fake data
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("smarterp_user")
      localStorage.removeItem("smarterp-jobs")
    }

    throw new Error("UNAUTHORIZED")
  }

  // ❌ Other API errors
  if (!response.ok) {
    let errorPayload: any = null
    try {
      errorPayload = await response.json()
    } catch {
      errorPayload = { message: response.statusText }
    }

    console.error("[apiClient] API error:", errorPayload)
    throw errorPayload
  }

  // ✅ Handle empty responses (204 No Content)
  if (response.status === 204) {
    return null
  }

  // ✅ Parse JSON safely
  try {
    return await response.json()
  } catch (parseError) {
    console.warn("[apiClient] Response is not JSON")
    return null
  }
}
