"use client"

import { useAuth } from "@/contexts/auth-context"
import { useJobs } from "@/contexts/job-context"
import { useNotifications } from "@/contexts/notification-context"
import { useEmployees } from "@/contexts/employee-context"
import { useChat } from "@/contexts/chat-context"

/**
 * Hook to check if any data is currently syncing
 */
export function useIsSyncing() {
  const { isSyncing: authSyncing } = useAuth()
  const { isLoading: jobsLoading } = useJobs()
  const { isLoading: notificationsLoading } = useNotifications()
  const { isLoading: employeesLoading } = useEmployees()
  const { isLoading: chatLoading } = useChat()

  return authSyncing || jobsLoading || notificationsLoading || employeesLoading || chatLoading
}

/**
 * Hook to get all synced workspace data
 */
export function useWorkspaceData() {
  const { user } = useAuth()
  const { jobs } = useJobs()
  const { notifications } = useNotifications()
  const { employees } = useEmployees()
  const { messages } = useChat()

  return {
    user,
    jobs,
    notifications,
    employees,
    messages,
  }
}

/**
 * Hook to get sync status for each data type
 */
export function useSyncStatus() {
  const { isSyncing: authSyncing } = useAuth()
  const { isLoading: jobsLoading } = useJobs()
  const { isLoading: notificationsLoading } = useNotifications()
  const { isLoading: employeesLoading } = useEmployees()
  const { isLoading: chatLoading } = useChat()

  return {
    auth: authSyncing,
    jobs: jobsLoading,
    notifications: notificationsLoading,
    employees: employeesLoading,
    chat: chatLoading,
  }
}
