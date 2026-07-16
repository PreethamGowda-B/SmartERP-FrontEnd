"use client"

import { useRouter } from "next/navigation"
import { LandingPage } from "@/components/landing-page"

// Landing page is always public — logged-in users can still visit it.
// They can navigate to their dashboard via the app header/links.
// We do NOT auto-redirect from the landing page — that's a UX trap.
export default function HomePage() {
  return <LandingPage />
}
