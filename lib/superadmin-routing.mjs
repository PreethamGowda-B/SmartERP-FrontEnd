const SUPERADMIN_HOST = "superadmin.prozync.in"

function normalizeHostname(hostname = "") {
  return String(hostname).trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "")
}

export function isSuperAdminHost(hostname) {
  const host = normalizeHostname(hostname)
  return host === SUPERADMIN_HOST || host === "localhost" || host === "127.0.0.1"
}

export function isSuperAdminPortalContext(hostname, pathname = "") {
  const host = normalizeHostname(hostname)
  if (host === SUPERADMIN_HOST) return true
  if (host !== "localhost" && host !== "127.0.0.1") return false
  const path = String(pathname).split("?", 1)[0].replace(/\/+$/, "") || "/"
  return path === "/superadmin" || path.startsWith("/superadmin/")
}

export function isSuperAdminPath(pathname = "") {
  const path = String(pathname).split("?", 1)[0].replace(/\/+$/, "") || "/"
  return path === "/superadmin" || path.startsWith("/superadmin/")
}
