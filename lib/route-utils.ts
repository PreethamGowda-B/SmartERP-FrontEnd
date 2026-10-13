/**
 * Utility to identify public / marketing / auth routes.
 * On these routes, unauthenticated visitors must NOT trigger protected API requests
 * (e.g. /api/jobs, /api/attendance/today, /api/subscription/status).
 */

export function isPublicRoute(pathname?: string | null): boolean {
  if (!pathname) return true
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/"

  if (cleanPath === "/" || cleanPath === "/landing") return true

  if (
    cleanPath === "/pricing" ||
    cleanPath === "/features" ||
    cleanPath === "/about" ||
    cleanPath === "/contact" ||
    cleanPath === "/privacy" ||
    cleanPath === "/terms" ||
    cleanPath === "/not-found" ||
    cleanPath === "/suspended"
  ) {
    return true
  }

  if (
    cleanPath.startsWith("/auth") ||
    cleanPath === "/customer/login" ||
    cleanPath === "/customer/landing" ||
    cleanPath === "/superadmin/login"
  ) {
    return true
  }

  return false
}
