import { apiClient } from "./apiClient"
import { getCurrentUserId } from "./auth"

export interface SyncStatus {
  isLoading: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  error: string | null
}

export interface SyncOptions {
  forceRefresh?: boolean
  userId?: string
}

class DataSyncService {
  private syncTimestamps: Map<string, number> = new Map()
  private syncIntervals: Map<string, ReturnType<typeof setInterval>> = new Map()
  private readonly SYNC_INTERVAL = 5000 // 5 seconds for real-time updates

  /**
   * Fetch jobs from backend and sync with local storage
   */
  async syncJobs(options: SyncOptions = {}): Promise<any[]> {
    const userId = options.userId || getCurrentUserId()
    if (!userId) {
      console.log("[v0] No user ID available for job sync")
      return []
    }

    try {
      console.log("[v0] Syncing jobs from backend...")
      const jobs = await apiClient("/api/jobs", { method: "GET" })

      if (Array.isArray(jobs)) {
        // Normalize and filter jobs for current user
        const userJobs = jobs.map((job: any) => ({
          id: job.id?.toString?.() ?? String(job._db_row?.id ?? job.id ?? ""),
          title: job.title ?? job.name ?? job.jobTitle ?? "",
          description: job.description ?? job.details ?? "",
          assignedEmployees: Array.isArray(job.assignedEmployees)
            ? job.assignedEmployees.map((a: any) => String(a))
            : job.assigned_to
              ? [String(job.assigned_to)]
              : [],
          ...job,
        }))

        localStorage.setItem("smarterp-jobs", JSON.stringify(userJobs))
        this.syncTimestamps.set("jobs", Date.now())
        console.log("[v0] Jobs synced successfully:", userJobs.length)
        return userJobs
      }
      return []
    } catch (error) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL
      if (backendUrl && backendUrl !== "http://localhost:4000") {
        console.error("[v0] Failed to sync jobs:", error)
      } else {
        console.log("[v0] Backend unavailable, using local jobs. Error:", (error as Error).message)
      }
      return this.getLocalJobs()
    }
  }

  /**
   * Fetch notifications from backend
   */
  async syncNotifications(options: SyncOptions = {}): Promise<any[]> {
    const userId = options.userId || getCurrentUserId()
    if (!userId) {
      console.log("[v0] No user ID available for notification sync")
      return []
    }

    try {
      console.log("[v0] Syncing notifications from backend...")
      const notifications = await apiClient("/api/notifications", { method: "GET" })

      if (Array.isArray(notifications)) {
        localStorage.setItem("smarterp-notifications", JSON.stringify(notifications))
        this.syncTimestamps.set("notifications", Date.now())
        console.log("[v0] Notifications synced successfully:", notifications.length)
        return notifications
      }
      return []
    } catch (error) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL
      if (backendUrl && backendUrl !== "http://localhost:4000") {
        console.error("[v0] Failed to sync notifications:", error)
      } else {
        console.log("[v0] Backend unavailable, using local notifications. Error:", (error as Error).message)
      }
      return this.getLocalNotifications()
    }
  }

  /**
   * Fetch employees from backend
   */
  async syncEmployees(options: SyncOptions = {}): Promise<any[]> {
    const userId = options.userId || getCurrentUserId()
    if (!userId) {
      console.log("[v0] No user ID available for employee sync")
      return []
    }

    try {
      console.log("[v0] Syncing employees from backend...")
      const employees = await apiClient("/api/employees", { method: "GET" })

      if (Array.isArray(employees)) {
        localStorage.setItem("smarterp-employees", JSON.stringify(employees))
        this.syncTimestamps.set("employees", Date.now())
        console.log("[v0] Employees synced successfully:", employees.length)
        return employees
      }
      return []
    } catch (error) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL
      if (backendUrl && backendUrl !== "http://localhost:4000") {
        console.error("[v0] Failed to sync employees:", error)
      } else {
        console.log("[v0] Backend unavailable, using local employees. Error:", (error as Error).message)
      }
      return this.getLocalEmployees()
    }
  }

  /**
   * Fetch chat messages from backend
   */
  async syncChat(options: SyncOptions = {}): Promise<any[]> {
    const userId = options.userId || getCurrentUserId()
    if (!userId) {
      console.log("[v0] No user ID available for chat sync")
      return []
    }

    try {
      console.log("[v0] Syncing chat messages from backend...")
      const messages = await apiClient("/api/chat", { method: "GET" })

      if (Array.isArray(messages)) {
        localStorage.setItem("smarterp-chat-messages", JSON.stringify(messages))
        this.syncTimestamps.set("chat", Date.now())
        console.log("[v0] Chat messages synced successfully:", messages.length)
        return messages
      }
      return []
    } catch (error) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL
      if (backendUrl && backendUrl !== "http://localhost:4000") {
        console.error("[v0] Failed to sync chat:", error)
      } else {
        console.log("[v0] Backend unavailable, using local chat messages. Error:", (error as Error).message)
      }
      return this.getLocalChat()
    }
  }

  /**
   * Sync all user data at once
   */
  async syncAllData(options: SyncOptions = {}): Promise<{
    jobs: any[]
    notifications: any[]
    employees: any[]
    chat: any[]
  }> {
    console.log("[v0] Starting full workspace sync...")
    const [jobs, notifications, employees, chat] = await Promise.all([
      this.syncJobs(options),
      this.syncNotifications(options),
      this.syncEmployees(options),
      this.syncChat(options),
    ])

    console.log("[v0] Full workspace sync completed")
    return { jobs, notifications, employees, chat }
  }

  /**
   * Start continuous sync for a data type
   */
  startContinuousSync(dataType: "jobs" | "notifications" | "employees" | "chat", userId?: string) {
    const key = `${dataType}-sync`

    // Clear existing interval if any
    if (this.syncIntervals.has(key)) {
      clearInterval(this.syncIntervals.get(key)!)
    }

    // Start new interval
    const intervalId = setInterval(() => {
      if (dataType === "jobs") this.syncJobs({ userId })
      else if (dataType === "notifications") this.syncNotifications({ userId })
      else if (dataType === "employees") this.syncEmployees({ userId })
      else if (dataType === "chat") this.syncChat({ userId })
    }, this.SYNC_INTERVAL)

    this.syncIntervals.set(key, intervalId)
    console.log(`[v0] Started continuous sync for ${dataType}`)
  }

  /**
   * Stop continuous sync for a data type
   */
  stopContinuousSync(dataType: "jobs" | "notifications" | "employees" | "chat") {
    const key = `${dataType}-sync`
    if (this.syncIntervals.has(key)) {
      clearInterval(this.syncIntervals.get(key)!)
      this.syncIntervals.delete(key)
      console.log(`[v0] Stopped continuous sync for ${dataType}`)
    }
  }

  /**
   * Stop all continuous syncs
   */
  stopAllContinuousSync() {
    this.syncIntervals.forEach((intervalId) => clearInterval(intervalId))
    this.syncIntervals.clear()
    console.log("[v0] Stopped all continuous syncs")
  }

  /**
   * Get local jobs from storage
   */
  getLocalJobs(): any[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("smarterp-jobs")
    return stored ? JSON.parse(stored) : []
  }

  /**
   * Get local notifications from storage
   */
  getLocalNotifications(): any[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("smarterp-notifications")
    return stored ? JSON.parse(stored) : []
  }

  /**
   * Get local employees from storage
   */
  getLocalEmployees(): any[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("smarterp-employees")
    return stored ? JSON.parse(stored) : []
  }

  /**
   * Get local chat messages from storage
   */
  getLocalChat(): any[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("smarterp-chat-messages")
    return stored ? JSON.parse(stored) : []
  }

  /**
   * Get last sync time for a data type
   */
  getLastSyncTime(dataType: string): number | null {
    return this.syncTimestamps.get(dataType) || null
  }

  /**
   * Clear all sync data
   */
  clearAllSyncData() {
    this.stopAllContinuousSync()
    this.syncTimestamps.clear()
    localStorage.removeItem("smarterp-jobs")
    localStorage.removeItem("smarterp-notifications")
    localStorage.removeItem("smarterp-employees")
    localStorage.removeItem("smarterp-chat-messages")
    console.log("[v0] Cleared all sync data")
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService()
