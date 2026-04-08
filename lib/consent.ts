/**
 * lib/consent.ts
 *
 * Lightweight consent utility — no context, no providers, no heavy state.
 * All consent state lives in localStorage["cookie_consent"].
 *
 * Used by: CookieConsentBanner, ConditionalAnalytics, sentry.client.config.ts
 */

export type ConsentValue = "accepted" | "rejected";

const CONSENT_KEY = "cookie_consent";

/** Custom events dispatched on the window object */
const REOPEN_EVENT = "cookie-consent-reopen";
const CHANGE_EVENT = "cookie-consent-change";

// ─── Read ──────────────────────────────────────────────────────────────────

/** Returns current consent value, or null if not yet decided. */
export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
}

/** Returns true only if user explicitly accepted all cookies. */
export function hasAccepted(): boolean {
  return getConsent() === "accepted";
}

// ─── Write ─────────────────────────────────────────────────────────────────

/** Persist consent and notify all listeners. */
export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }));
}

/** Remove stored consent and re-show the banner. */
export function reopenConsentBanner(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new Event(REOPEN_EVENT));
}

// ─── Subscribe ─────────────────────────────────────────────────────────────

/**
 * Subscribe to consent value changes.
 * Returns an unsubscribe function — safe to call in useEffect cleanup.
 */
export function onConsentChange(
  handler: (value: ConsentValue) => void
): () => void {
  const listener = (e: Event) =>
    handler((e as CustomEvent<ConsentValue>).detail);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/**
 * Subscribe to banner-reopen requests (e.g., from "Change Preferences" button).
 * Returns an unsubscribe function.
 */
export function onConsentReopen(handler: () => void): () => void {
  window.addEventListener(REOPEN_EVENT, handler);
  return () => window.removeEventListener(REOPEN_EVENT, handler);
}
