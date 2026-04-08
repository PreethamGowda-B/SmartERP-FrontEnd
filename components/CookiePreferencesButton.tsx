"use client";

/**
 * components/CookiePreferencesButton.tsx
 *
 * Drop this button anywhere (footer, settings page, profile menu) to let
 * users re-open the cookie consent banner at any time.
 *
 * Uses the shared consent utility — no props, no context required.
 */

import { reopenConsentBanner } from "@/lib/consent";

interface CookiePreferencesButtonProps {
  /** Optional Tailwind classes to style the button. */
  className?: string;
  /** Optional label override. */
  label?: string;
}

export function CookiePreferencesButton({
  className = "",
  label = "Cookie Preferences",
}: CookiePreferencesButtonProps) {
  return (
    <button
      type="button"
      onClick={reopenConsentBanner}
      id="cookie-preferences-btn"
      aria-label="Change cookie preferences"
      className={
        className ||
        "text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      }
    >
      {label}
    </button>
  );
}
