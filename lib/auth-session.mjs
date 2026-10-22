/**
 * Resolve which SmartERP session a request belongs to. Generic AI endpoints are
 * role-aware and must use the active portal session, not always the admin one.
 */
export function resolveAuthScope({ targetPath = "", pathname = "", hostname = "", dynamicAdminRoute = "" } = {}) {
  const path = String(targetPath).split("?", 1)[0];
  const isWithin = (prefix) => path === prefix || path.startsWith(`${prefix}/`);
  const isAdminApiPath = ["/api/admin", "/api/superadmin", "/api/v1/superadmin"].some(isWithin);
  const isAdminPage =
    pathname.includes("/superadmin") ||
    pathname.includes("/super-admin") ||
    pathname.includes("[adminRoute]") ||
    (Boolean(dynamicAdminRoute) && pathname.includes(`/${dynamicAdminRoute}`)) ||
    hostname.startsWith("superadmin.");

  return isAdminApiPath || isAdminPage ? "admin" : "user";
}

/**
 * A delayed auth failure may invalidate only the exact session that made the
 * request. This prevents an old refresh response clearing a newer login.
 */
export function isSameAuthSession({
  expectedAccessToken,
  expectedRefreshToken,
  currentAccessToken,
  currentRefreshToken,
} = {}) {
  if (expectedAccessToken && currentAccessToken !== expectedAccessToken) return false;
  if (expectedRefreshToken && currentRefreshToken !== expectedRefreshToken) return false;
  return Boolean(expectedAccessToken || expectedRefreshToken);
}

export function isProtectedRequestAuthFailure(status) {
  return status === 401;
}

export function isRejectedRefreshResponse(status) {
  return status === 401 || status === 403;
}

/**
 * Serialize refresh-token rotation across tabs where the browser implements
 * Web Locks. The in-memory request map in apiClient remains the same-tab
 * fallback for browsers without this API.
 */
export function withAuthRefreshLock(scope, operation, lockManager = globalThis.navigator?.locks) {
  if (!lockManager || typeof lockManager.request !== "function") {
    return Promise.resolve().then(operation);
  }
  return lockManager.request(`smarterp:auth-refresh:${scope}`, { mode: "exclusive" }, operation);
}
