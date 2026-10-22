const PRODUCTION_API_HOSTS = new Set([
  "api.prozync.in",
  "smarterp-backendend.onrender.com",
]);

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Resolve the public API origin for one explicitly named deployment environment.
 * This module contains no credentials and performs no network access.
 *
 * @param {{ appEnvironment?: string, apiUrl?: string }} config
 * @returns {string}
 */
export function resolveApiOrigin({ appEnvironment, apiUrl }) {
  const environment = String(appEnvironment || "").trim().toLowerCase();
  if (!["development", "staging", "production"].includes(environment)) {
    throw new Error(
      "SmartERP API configuration is missing or invalid. Set NEXT_PUBLIC_APP_ENV to development, staging, or production.",
    );
  }

  const configuredUrl = String(apiUrl || "").trim();
  if (!configuredUrl) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must be explicitly configured for the ${environment} environment. No API fallback is used.`,
    );
  }

  let parsed;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be a valid absolute HTTP(S) origin.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("NEXT_PUBLIC_API_URL must use HTTP or HTTPS.");
  }
  if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be a public origin without credentials, path, query, or fragment.",
    );
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const isLoopback = LOOPBACK_HOSTS.has(hostname);
  const isKnownProductionApi = PRODUCTION_API_HOSTS.has(hostname);

  if (environment === "development" && !isLoopback) {
    throw new Error(
      "Development API configuration must point to localhost, 127.0.0.1, or ::1; refusing a remote endpoint.",
    );
  }
  if (environment === "staging" && (parsed.protocol !== "https:" || isKnownProductionApi)) {
    throw new Error(
      "Staging requires an HTTPS staging API origin and cannot use a known production API host.",
    );
  }
  if (environment === "production" && (parsed.protocol !== "https:" || isLoopback)) {
    throw new Error("Production requires an explicitly configured HTTPS API origin.");
  }

  return parsed.origin;
}

/** @returns {string} */
export function getApiOrigin() {
  return resolveApiOrigin({
    appEnvironment: process.env.NEXT_PUBLIC_APP_ENV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  });
}
