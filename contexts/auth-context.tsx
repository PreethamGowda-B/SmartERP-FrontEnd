"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, type AuthState, getCurrentUser, signOut } from "@/lib/auth"
import { setTokens } from "@/lib/apiClient"

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

          // Background refresh
          fetch(`${apiUrl}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refreshToken: rt }),
          }).then(async (refreshRes) => {
            if (refreshRes.ok && isMounted) {
              const data = await refreshRes.json()
              if (data.accessToken) {
                setTokens(data.accessToken, data.refreshToken || rt || "")
                console.log("[v0] ✅ Proactive token refresh successful (background)")
              }
            } else if (!refreshRes.ok) {
              console.warn("[v0] Proactive token refresh failed (background)")
            }
          }).catch(err => {
            console.warn("[v0] Proactive token refresh error (background):", err)
          })
        }
      } catch (err) {
        console.error("[v0] Auth initialization error:", err)
        if (isMounted) setIsLoading(false)
      }
    }

    initAuth()
    
    return () => { isMounted = false }
  }, [])

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
