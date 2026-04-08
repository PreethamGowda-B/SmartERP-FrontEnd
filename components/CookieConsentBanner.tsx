"use client";

/**
 * components/CookieConsentBanner.tsx
 *
 * Production-grade GDPR/CCPA compliant cookie consent banner.
 * - Self-contained: no context, no providers, no global state
 * - Reads/writes ONLY localStorage["cookie_consent"]
 * - Listens for reopen events from CookiePreferencesButton
 * - Auth cookies are NEVER touched — they are always exempt
 */

import { useEffect, useState } from "react";
import {
  getConsent,
  setConsent,
  onConsentReopen,
} from "@/lib/consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    // Show banner if no decision has been made yet
    if (!getConsent()) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }

    // Listen for "Change Preferences" button clicks anywhere in the app
    return onConsentReopen(() => {
      setAnimateOut(false);
      setVisible(true);
    });
  }, []);

  // Also register the reopen listener separately (runs after initial show)
  useEffect(() => {
    if (!visible) {
      return onConsentReopen(() => {
        setAnimateOut(false);
        setVisible(true);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const dismiss = (value: "accepted" | "rejected") => {
    setConsent(value);       // persists + dispatches change event
    setAnimateOut(true);
    setTimeout(() => setVisible(false), 380);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-live="polite"
      className={`
        fixed bottom-0 left-0 right-0 z-[9999] px-3 pb-3
        transition-transform duration-[380ms] ease-in-out
        ${animateOut ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}
      `}
    >
      <div
        className="
          mx-auto max-w-4xl
          rounded-2xl
          border border-white/10
          bg-[#0d1117]/95 backdrop-blur-md
          shadow-[0_-2px_40px_rgba(0,0,0,0.5)]
          p-4 sm:p-5
          flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6
        "
      >
        {/* Left: Icon + copy */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl shrink-0 mt-0.5 select-none" aria-hidden>
            🍪
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              We use cookies &amp; tracking tools
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              <strong className="text-slate-300">Essential cookies</strong> (login sessions,
              authentication) are always active — they are never blocked or tracked.{" "}
              With your consent we also load{" "}
              <span className="text-slate-300 font-medium">Vercel Analytics</span> and{" "}
              <span className="text-slate-300 font-medium">Sentry Session Replay</span>{" "}
              to improve the service. Your consent is stored only in your browser (no server).{" "}
              <a
                href="/privacy#cookies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
              >
                Privacy Policy ↗
              </a>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            id="cookie-reject-btn"
            onClick={() => dismiss("rejected")}
            aria-label="Reject non-essential cookies"
            className="
              px-4 py-2 rounded-lg text-xs font-medium
              text-slate-400 hover:text-white
              border border-white/10 hover:border-white/25
              bg-white/5 hover:bg-white/10
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1
              whitespace-nowrap
            "
          >
            Reject Non-Essential
          </button>

          <button
            type="button"
            id="cookie-accept-btn"
            onClick={() => dismiss("accepted")}
            aria-label="Accept all cookies"
            className="
              px-4 py-2 rounded-lg text-xs font-semibold
              text-white
              bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
              shadow-lg shadow-indigo-900/50
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1
              whitespace-nowrap
            "
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
