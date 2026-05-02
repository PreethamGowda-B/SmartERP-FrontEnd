"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, type AuthState, getCurrentUser, signOut } from "@/lib/auth"
import { setTokens } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import * as Sentry from "@sentry/nextjs"

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 🚨 CRITICAL: Skip SmartERP Owner/Employee auth logic if we are in the Customer Portal
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/customer")) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = getCurrentUser()
        
        // 1. Immediately update user state from cache to allow instant UI rendering
        if (currentUser && isMounted) {
          setUser(currentUser)
        }
        
        // 2. Set loading to false as early as possible so the user sees the dashboard/landing page
        // No need to wait for a network request just to show cached data.
        if (isMounted) setIsLoading(false)

        // 3. Perform the token refresh in the background (non-blocking)
        if (currentUser) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
          const rt = typeof window !== "undefined" 
            ? (sessionStorage.getItem("_rt") || localStorage.getItem("_rt") || localStorage.getItem("refreshToken")) 
            : null
          
          if (!rt) return;

          // Background refresh & profile sync
          fetch(`${apiUrl}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refreshToken: rt }),
          }).then(async (refreshRes) => {
            if (refreshRes.ok && isMounted) {
              const data = await refreshRes.json()
              if (data.accessToken) {
                const isAdmin = currentUser?.role === 'super_admin'
                setTokens(data.accessToken, data.refreshToken || rt || "", isAdmin)
                
                // Now fetch the fresh user profile to sync company code
                const meRes = await fetch(`${apiUrl}/api/auth/me`, {
                  headers: { "Authorization": `Bearer ${data.accessToken}` }
                })
                if (meRes.ok) {
                  const freshUser = await meRes.json()
                  setUser(freshUser)
                  localStorage.setItem("smarterp_user", JSON.stringify(freshUser))
                  if (freshUser.company_code) {
                    localStorage.setItem("company_code", freshUser.company_code)
                  }
                  logger.log("[v0] ✅ Profile synced with latest DB state")
                } else {
                  // 🔴 PART 1: SESSION VALIDATION
                  // IF token exists BUT request fails -> logout immediately
                  logger.warn("[v0] Profile sync failed - forcing logout")
                  signOut().then(() => {
                    window.location.href = "/auth/login"
                  })
                }
              }
            } else if (!refreshRes.ok) {
              logger.warn("[v0] Proactive token refresh failed (background) - forcing logout")
              signOut().then(() => {
                window.location.href = "/auth/login"
              })
            }
          }).catch(err => {
            logger.warn("[v0] Proactive token refresh error (background):", err)
            // Only force logout if it's a 401/403, not a network error
            if (err.status === 401 || err.status === 403) {
              signOut().then(() => {
                window.location.href = "/auth/login"
              })
            }
          })
        }
    } catch (err) {
      logger.error("[v0] Auth initialization error:", { error: err })
      if (isMounted) setIsLoading(false)
    }
    }

    initAuth()
    
    return () => { isMounted = false }
  }, [])

  // Sync with Sentry
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: String(user.id),
        email: user.email,
        role: user.role,
        company_id: user.company_id
      })
    } else {
      Sentry.setUser(null)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut, setUser }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
