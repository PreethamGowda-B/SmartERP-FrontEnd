"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, type AuthState, getCurrentUser, signOut } from "@/lib/auth"
import { setTokens, getRefreshToken, getAccessToken, isTokenExpired } from "@/lib/apiClient"
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
        
        // 1. Immediately update user state & stop loading from cache for instant UI rendering
        if (currentUser && isMounted) {
          setUser(currentUser)
          setIsLoading(false)
        }
        
        // 2. If there is NO cached user, stop loading immediately
        if (!currentUser) {
          if (isMounted) setIsLoading(false)
          return
        }

        // 3. Check access token & refresh status
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"
        const at = getAccessToken()
        const rt = getRefreshToken()
        
        if (!rt && !at) {
          signOut()
          if (isMounted) { setUser(null); setIsLoading(false) }
          return
        }

        // If access token is still fresh, sync profile directly without prematurely rotating refresh token
        if (at && !isTokenExpired(at)) {
          try {
            const meController = new AbortController()
            const meTimeoutId = setTimeout(() => meController.abort(), 3500)

            const meRes = await fetch(`${apiUrl}/api/auth/me`, {
              headers: { "Authorization": `Bearer ${at}` },
              signal: meController.signal,
            })
            clearTimeout(meTimeoutId)

            if (meRes.ok && isMounted) {
              const freshUser = await meRes.json()
              setUser(freshUser)
              localStorage.setItem("smarterp_user", JSON.stringify(freshUser))
              if (freshUser.company_code) {
                localStorage.setItem("company_code", freshUser.company_code)
              }
              logger.log("[v0] ✅ Profile synced with latest DB state")
              return
            } else if (meRes.status === 401 || meRes.status === 403) {
              // Access token was rejected by server — fall through to refresh
              logger.log("[v0] Access token rejected by server, falling back to refresh")
            } else {
              // Non-auth error (e.g. 500, network offline) — preserve active session
              return
            }
          } catch {
            // Profile fetch timeout/failure — keep active cached user session
            return
          }
        }

        if (!rt) {
          signOut()
          if (isMounted) { setUser(null); setIsLoading(false) }
          return
        }

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 4000)

          const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refreshToken: rt }),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (refreshRes.status === 401 || refreshRes.status === 403) {
            // Only sign out if the access token is also expired or missing
            const currentAt = getAccessToken()
            if (!currentAt || isTokenExpired(currentAt)) {
              logger.warn("[v0] Stored session is invalid or expired — clearing session and signing out")
              await signOut()
              if (isMounted) {
                setUser(null)
                setIsLoading(false)
              }
            }
            return
          }

          if (refreshRes.ok && isMounted) {
            const data = await refreshRes.json()
            if (data.accessToken) {
              const isAdmin = currentUser?.role === 'super_admin'
              setTokens(data.accessToken, data.refreshToken || rt || "", isAdmin)
              
              // Fetch fresh profile with 3000ms timeout
              try {
                const meController = new AbortController()
                const meTimeoutId = setTimeout(() => meController.abort(), 3000)

                const meRes = await fetch(`${apiUrl}/api/auth/me`, {
                  headers: { "Authorization": `Bearer ${data.accessToken}` },
                  signal: meController.signal,
                })
                clearTimeout(meTimeoutId)

                if (meRes.ok && isMounted) {
                  const freshUser = await meRes.json()
                  setUser(freshUser)
                  localStorage.setItem("smarterp_user", JSON.stringify(freshUser))
                  if (freshUser.company_code) {
                    localStorage.setItem("company_code", freshUser.company_code)
                  }
                  logger.log("[v0] ✅ Profile synced with latest DB state")
                }
              } catch {
                // Profile fetch timeout/failure — keep cached user session
              }
            }
          }
        } catch (fetchErr: any) {
          logger.warn("[v0] Token refresh timeout or network error — keeping cached user session:", fetchErr)
        }
      } catch (err) {
        logger.error("[v0] Auth initialization error:", err)
      } finally {
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
  }, [user?.id, user?.email, user?.role, user?.company_id])

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
