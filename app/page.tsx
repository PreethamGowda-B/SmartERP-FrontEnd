"use client"

import { useAuth } from "@/contexts/auth-context"
import { LandingPage } from "@/components/landing-page"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export default function HomePage() {
  const { user } = useAuth()

  // ── Flagship Cinematic Intro State ─────────────────────────────────────
  const [loaderDone, setLoaderDone] = useState(false)
  const [shutterOpen, setShutterOpen] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Skip intro loader if already seen in current session
    if (typeof window !== "undefined" && sessionStorage.getItem("smarterp_intro_seen")) {
      setShutterOpen(true)
      setLoaderDone(true)
      setContentVisible(true)
      return
    }

    // Fast 300ms progress animation for smooth first impression without hanging
    let current = 0
    progressRef.current = setInterval(() => {
      current += 34
      if (current >= 100) {
        current = 100
        if (progressRef.current) clearInterval(progressRef.current)
        setShutterOpen(true)
        if (typeof window !== "undefined") sessionStorage.setItem("smarterp_intro_seen", "true")
        setTimeout(() => {
          setLoaderDone(true)
          setContentVisible(true)
        }, 150)
      }
      setProgress(Math.min(current, 100))
    }, 60)

    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [])

  return (
    <div className="relative">
      {/* ── Flagship Cinematic Intro Loader ──────────────────────────────── */}
      {!loaderDone && (
        <div className={`flagship-loader${shutterOpen ? " shutter-open" : ""}`}>
          {/* Cinema grain overlay */}
          <div className="cinema-grain" />

          <div className="loader-content">
            {/* Brand Logo */}
            <div className="loader-logo">
              SmartERP
              <sup
                style={{
                  fontSize: "0.35em",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  verticalAlign: "super",
                  color: "oklch(0.45 0.15 240)",
                  marginLeft: "2px",
                }}
              >
                ™
              </sup>
            </div>

            {/* Status text */}
            <div className="flagship-status">Initializing Enterprise Platform</div>

            {/* Progress bar */}
            <div className="flagship-bar">
              <div
                className="flagship-progress"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Entrance-revealed Landing Page ───────────────────────────────── */}
      <div className={`entrance-content${contentVisible ? " visible" : ""}`}>
        {/* Logged-in user quick-access bar */}
        {user && (
          <div className="bg-primary text-primary-foreground text-xs py-2 px-4 text-center flex items-center justify-center gap-3 font-semibold shadow-xs z-50 relative">
            <span>
              You are signed in as <strong>{user.name || user.email}</strong>
            </span>
            <Link
              href={
                user.role === "owner"
                  ? "/owner"
                  : user.role === "hr"
                  ? "/hr"
                  : "/employee"
              }
              className="underline hover:text-white transition-colors bg-primary-foreground/20 px-2.5 py-1 rounded-md"
            >
              Go to Workspace Dashboard →
            </Link>
          </div>
        )}
        <LandingPage />
      </div>
    </div>
  )
}
