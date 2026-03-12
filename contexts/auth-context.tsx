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
    async function initAuth() {
      const currentUser = getCurrentUser()
      setUser(currentUser)

      // ✅ Proactively refresh tokens on EVERY page load.
      // This prevents the race condition where all pages fire before
      // the 401→refresh cycle completes and sets _accessToken.
      if (currentUser) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
          const rt = typeof window !== "undefined" 
            ? (sessionStorage.getItem("_rt") || localStorage.getItem("_rt") || localStorage.getItem("refreshToken")) 
            : null
          
          if (!rt) {
            console.log("[v0] No refresh token found in storage — skipping proactive refresh")
            setIsLoading(false)
            return
          }

          const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: rt ? JSON.stringify({ refreshToken: rt }) : undefined,
          })
          if (refreshRes.ok) {
            const data = await refreshRes.json()
            if (data.accessToken) {
              setTokens(data.accessToken, data.refreshToken || rt || "")
              console.log("[v0] ✅ Proactive token refresh successful")
            }
          } else {
            console.warn("[v0] Proactive token refresh failed — user may need to re-login")
          }
        } catch {
          console.warn("[v0] Proactive token refresh error — continuing without pre-fetched token")
        }
      }

      setIsLoading(false)
    }

    initAuth()
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
