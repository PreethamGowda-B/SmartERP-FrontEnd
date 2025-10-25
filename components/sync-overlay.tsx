"use client"

import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export function SyncOverlay() {
  const { isSyncing, user } = useAuth()

  if (!user || !isSyncing) return null

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
      <div className="bg-background border border-border rounded-lg p-8 shadow-lg text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Syncing your workspace</h2>
          <p className="text-sm text-muted-foreground mt-2">Loading jobs, employees, messages and more...</p>
        </div>
        <div className="flex gap-2 justify-center pt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  )
}
