"use client"

import { useAuth } from "@/contexts/auth-context"
import { useJobs } from "@/contexts/job-context"
import { useNotifications } from "@/contexts/notification-context"
import { useEmployees } from "@/contexts/employee-context"
import { useChat } from "@/contexts/chat-context"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"

export function SyncStatusIndicator() {
  const { isSyncing: authSyncing, user } = useAuth()
  const { isLoading: jobsLoading } = useJobs()
  const { isLoading: notificationsLoading } = useNotifications()
  const { isLoading: employeesLoading } = useEmployees()
  const { isLoading: chatLoading } = useChat()
  const [showIndicator, setShowIndicator] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const isSyncing = authSyncing || jobsLoading || notificationsLoading || employeesLoading || chatLoading

  useEffect(() => {
    if (isSyncing) {
      setShowIndicator(true)
    } else if (user) {
      setLastSyncTime(new Date())
      const timer = setTimeout(() => setShowIndicator(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSyncing, user])

  if (!user || !showIndicator) return null

  const formatSyncTime = () => {
    if (!lastSyncTime) return ""
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 bg-background border border-border rounded-lg shadow-lg animate-fade-in-up">
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-foreground font-medium">Syncing your workspace…</span>
            <span className="text-xs text-muted-foreground">Jobs, employees, messages & more</span>
          </div>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-foreground font-medium">All synced</span>
            <span className="text-xs text-muted-foreground">{formatSyncTime()}</span>
          </div>
        </>
      )}
    </div>
  )
}
