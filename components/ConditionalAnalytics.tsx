"use client";

/**
 * components/ConditionalAnalytics.tsx
 *
 * Renders <Analytics /> ONLY when the user has explicitly accepted cookies.
 * Listens for live consent changes — no page refresh needed.
 *
 * Drop-in replacement for <Analytics /> in layout.tsx.
 */

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { getConsent, onConsentChange } from "@/lib/consent";

export function ConditionalAnalytics() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Sync with whatever was stored before hydration
    setAccepted(getConsent() === "accepted");

    // React to live changes (e.g., user clicks Accept in the banner)
    return onConsentChange((val) => setAccepted(val === "accepted"));
  }, []);

  // ✅ Analytics component is NOT mounted at all until consent is given.
  // This prevents ANY Vercel analytics requests from being made.
  if (!accepted) return null;

  return <Analytics />;
}
