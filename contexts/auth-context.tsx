"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, type AuthState, getCurrentUser, signOut } from "@/lib/auth"
import { dataSyncService } from "@/lib/data-sync-service"

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  isSyncing: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)

    if (currentUser) {
      setIsSyncing(true)
      dataSyncService.syncAllData().finally(() => {
        setIsSyncing(false)
      })

      // Start continuous sync for real-time updates
      dataSyncService.startContinuousSync("jobs", currentUser.id)
      dataSyncService.startContinuousSync("notifications", currentUser.id)
      dataSyncService.startContinuousSync("employees", currentUser.id)
      dataSyncService.startContinuousSync("chat", currentUser.id)
    }

    return () => {
      // Cleanup syncs on unmount
      dataSyncService.stopAllContinuousSync()
    }
  }, [])

  const handleSignOut = async () => {
    dataSyncService.stopAllContinuousSync()
    dataSyncService.clearAllSyncData()
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut, setUser, isSyncing }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
