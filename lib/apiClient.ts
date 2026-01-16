/**
 * Centralized API client for SmartERP
 * - Uses httpOnly cookies (Render + Vercel)
 * - Handles 401 correctly
 * - Prevents fallback fake data issues
 */

export async function apiClient(
  path: string,
  options: RequestInit = {}
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://smarterp-backendend.onrender.com";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include", // ✅ THIS IS THE KEY
    });
  } catch (err) {
    console.error("[apiClient] Network error:", err);
    throw new Error("NETWORK_ERROR");
  }

  if (response.status === 401) {
    console.error("[apiClient] Unauthorized");

    if (typeof window !== "undefined") {
      localStorage.removeItem("smarterp_user");
      localStorage.removeItem("smarterp-jobs");
    }

    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw error;
  }

  if (response.status === 204) return null;

  return response.json();
}
