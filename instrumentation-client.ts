import * as Sentry from "@sentry/nextjs";
import { getConsent, onConsentChange } from "@/lib/consent";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// ─── Core Sentry Init ────────────────────────────────────────────────────────
// Error tracking and performance monitoring are initialized unconditionally.
// These are considered "legitimate interest" — they don't track user behaviour,
// only catch crashes and measure server response times.
//
// Session Replay is non-essential (it records screen interactions) and is
// ONLY activated dynamically after the user explicitly accepts cookies.

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // ✅ Performance tracing — legitimate interest, no consent required
  tracesSampleRate: 1.0,

  // ✅ Session Replay — starts at 0. Enabled dynamically after consent.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Only run in production
  enabled: process.env.NODE_ENV === "production",

  debug: false,
});

// ─── Dynamic Session Replay Activation ───────────────────────────────────────
// Runs only in browser (client config). Uses the consent utility to check
// stored consent and react to live consent changes — no page refresh needed.

function initReplayIfConsented(): void {
  if (typeof window === "undefined") return;

  const enableReplay = () => {
    try {
      Sentry.addIntegration(
        Sentry.replayIntegration({
          // Conservative privacy settings even when user consents
          maskAllText: false,     // allow text (user chose to accept)
          blockAllMedia: false,   // allow media (user chose to accept)
          maskAllInputs: true,    // always mask form inputs (passwords etc.)
        })
      );
    } catch {
      // Guard against double-init on hot reload in dev
    }
  };

  // Check consent that was already stored (e.g., returning user)
  if (getConsent() === "accepted") {
    enableReplay();
    return; // Already accepted — no need to subscribe further
  }

  // Subscribe for live changes (new user clicks Accept during this session)
  const unsub = onConsentChange((value) => {
    if (value === "accepted") {
      enableReplay();
      unsub(); // One-shot: unsubscribe after enabling
    }
  });
}

initReplayIfConsented();
