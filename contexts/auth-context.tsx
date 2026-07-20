"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, type AuthState, getCurrentUser, signOut } from "@/lib/auth"
import { setTokens, getRefreshToken } from "@/lib/apiClient"
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
      try {
        const currentUser = getCurrentUser()
        
        // 1. Immediately update user state from cache to allow instant UI rendering
        if (currentUser && isMounted) {
          setUser(currentUser)
        }
        
        // 2. If there is NO cached user, we can stop loading immediately — no
        //    network call needed, the user is definitively logged out.
        if (!currentUser) {
          if (isMounted) setIsLoading(false)
          return
        }

        // 3. There IS a cached user — perform token refresh to validate it.
        //    Keep isLoading=true until we know the session is still valid.
        //    This prevents the landing page from seeing a stale user and
        //    redirecting to /owner before the refresh confirms or denies it.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        const rt = getRefreshToken()
        
        if (!rt) {
          // No refresh token — cached user is stale, clear it
          signOut()
          if (isMounted) { setUser(null); setIsLoading(false) }
          return
        }

        try {
          const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refreshToken: rt }),
          })

          if (refreshRes.ok && isMounted) {
            const data = await refreshRes.json()
            if (data.accessToken) {
              const isAdmin = currentUser?.role === 'super_admin'
              setTokens(data.accessToken, data.refreshToken || rt || "", isAdmin)
              
              // Fetch fresh profile to sync company code
              try {
                const meRes = await fetch(`${apiUrl}/api/auth/me`, {
                  headers: { "Authorization": `Bearer ${data.accessToken}` }
                })
                if (meRes.ok && isMounted) {
                  const freshUser = await meRes.json()
                  setUser(freshUser)
                  localStorage.setItem("smarterp_user", JSON.stringify(freshUser))
                  if (freshUser.company_code) {
                    localStorage.setItem("company_code", freshUser.company_code)
                  }
                  logger.log("[v0] ✅ Profile synced with latest DB state")
                } else if (isMounted) {
                  logger.warn("[v0] Profile sync failed - clearing session")
                  signOut()
                  setUser(null)
                }
              } catch {
                // /me failed — keep the cached user, not a hard failure
              }
            }
          } else if (isMounted) {
            logger.warn("[v0] Token refresh failed - clearing stale session")
            signOut()
            setUser(null)
          }
        } catch (fetchErr: any) {
          logger.warn("[v0] Token refresh network error:", fetchErr)
          // Network error (cold start, offline) — keep the cached user so the
          // app still works offline, but don't redirect to protected routes
          // (page.tsx waits for authVerified which requires this to complete)
        }

        // 4. Auth check done — allow the rest of the app to render
        if (isMounted) setIsLoading(false)

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
