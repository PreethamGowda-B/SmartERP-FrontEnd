"use client"
import { getApiOrigin } from "@/lib/api-environment.mjs";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./auth-context"
import { toast } from "sonner"
import { usePathname, useRouter } from "next/navigation"
import { apiClient, getAuthToken, getValidAccessToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { playEnterpriseChime } from "@/lib/sound-chime"

export interface Notification {
  id: string
  type: "job" | "material_request" | "payroll" | "message" | "chat_message" | string
  title: string
  message: string
  created_at: string
  read: boolean
  priority: "low" | "medium" | "high" | "urgent" | string
  data?: any // Additional data for the notification
}

// Callback type for MessagingContext to receive SSE events
export type MessagingSSEHandler = (event: { type: string; data: unknown }) => void

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "created_at" | "read">) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  getUnreadCount: () => number
  refreshNotifications: () => Promise<void>
  isConnected: boolean
  isMuted: boolean
  toggleMute: () => void
  registerMessagingHandler: (handler: MessagingSSEHandler) => void
  unregisterMessagingHandler: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isMuted, setIsMuted] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMuted(localStorage.getItem("smarterp_sound_muted") === "true")
    }
  }, [])

  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const isCustomerRoute = pathname?.startsWith("/customer") ?? false
  const router = useRouter()
  const sseConnectionRef = useRef<EventSource | null>(null)
  const sseRetryCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reconnectTrigger, setReconnectTrigger] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const messagingHandlerRef = useRef<MessagingSSEHandler | null>(null)

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("smarterp_sound_muted", String(next))
      }
      return next
    })
  }, [])

  const registerMessagingHandler = useCallback((handler: MessagingSSEHandler) => {
    messagingHandlerRef.current = handler
  }, [])

  const unregisterMessagingHandler = useCallback(() => {
    messagingHandlerRef.current = null
  }, [])

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (isCustomerRoute) {
      setNotifications([])
      return
    }
    if (!user || !getAuthToken()) return
    try {
      const data = await apiClient("/api/notifications")
      const parsed = Array.isArray(data) ? data.map((n: any) => {
        let parsedData = n.data
        if (typeof parsedData === "string") {
          try { parsedData = JSON.parse(parsedData) } catch {}
        }
        return { ...n, data: parsedData }
      }) : []
      setNotifications(parsed)
      logger.log(`✅ Fetched ${parsed.length} notifications`)
    } catch (error: any) {
      const isAuthErr = error?.status === 401 || error?.status === '401' || error?.message === "Authentication required"
      if (!isAuthErr) {
        logger.error("❌ Error fetching notifications:", error)
      }
    }
  }, [user, isCustomerRoute])

  // Initialize FCM and request permission
  const setupFCM = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const { messaging, VAPID_KEY } = await import("@/lib/firebase");
        if (!messaging) {
          logger.log("FCM messaging disabled (missing firebaseConfig.projectId)");
          return;
        }
        const { getToken: getFCMToken, onMessage } = await import("firebase/messaging");

        // Explicitly register service worker for reliability
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        logger.log("✅ Service Worker registered:", registration.scope);

        // Handle foreground messages
        onMessage(messaging, (payload) => {
          logger.log("🔔 FCM Foreground message received:", payload);
          if (payload.notification) {
            new Notification(payload.notification.title || "New Notification", {
              body: payload.notification.body,
              icon: '/icon.png',
              badge: '/icon.png',
              data: payload.data
            });
          }
        });

        const currentToken = await getFCMToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          logger.log("✅ FCM Token generated:", currentToken);
          await apiClient("/api/notifications/devices", {
            method: "POST",
            body: JSON.stringify({
              fcmToken: currentToken,
              deviceType: 'web'
            }),
          });
        }
      }
    } catch (error) {
      logger.error("❌ Error setting up FCM:", error);
    }
  }, []);

  // Establish SSE connection for real-time notifications
  useEffect(() => {
    let isCancelled = false
    let activeEventSource: EventSource | null = null

    async function initSSE() {
      if (isCustomerRoute) {
        sseConnectionRef.current?.close()
        sseConnectionRef.current = null
        setNotifications([])
        setIsConnected(false)
        return
      }
      if (!user) {
        if (sseConnectionRef.current) {
          sseConnectionRef.current.close()
          sseConnectionRef.current = null
        }
        setIsConnected(false)
        return
      }

      // Proactively ensure fresh, non-expired token before connecting
      const hasValidSession = Boolean(await getValidAccessToken())
      if (!hasValidSession || isCancelled) {
        setIsConnected(false)
        return
      }

      fetchNotifications()
      setupFCM()

      const BACKEND_URL = getApiOrigin()
      const sseUrl = `${BACKEND_URL}/api/notifications/sse`
      const eventSource = new EventSource(sseUrl, {
        withCredentials: true,
      })
      activeEventSource = eventSource

      eventSource.onopen = () => {
        logger.log("📡 SSE connection established")
        sseRetryCountRef.current = 0
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connected") {
            logger.log("✅ SSE connected:", data.message)
          } else if (data.type === "new_message" || data.type === "status_change" || data.type === "typing_indicator" || data.type === "receipt_update") {
            if (messagingHandlerRef.current) {
              messagingHandlerRef.current({ type: data.type, data: data.data })
            }
          } else if (data.type === "notification") {
            let notification = data.data
            if (notification && typeof notification.data === "string") {
              try { notification.data = JSON.parse(notification.data) } catch {}
            }
            logger.log("🔔 New notification received:", notification)

            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("smarterp:notification", { detail: notification }))
            }

            // 1. Update Notification Center state
            setNotifications((prev) => {
              if (notification?.id && prev.some((item) => item.id === notification.id)) return prev
              return [notification, ...prev]
            })

            // 2. Play Crisp Web Audio Chime Sound (if not muted)
            if (!isMuted) {
              playEnterpriseChime()
            }

            // 3. Clean White Sonner Toast with Direct Action Link
            const actionData = notification.data || {}
            const jobId = actionData.job_id || actionData.jobId || notification.job_id || (notification.type === "job" ? notification.id : null)
            toast(notification.title || "New Notification", {
              description: notification.message || "",
              duration: 6000,
              action: jobId
                ? {
                    label: "View",
                    onClick: () => {
                      const role = String(user?.role || "").toLowerCase()
                      const destination = notification.type === "chat_message"
                        ? role === "employee"
                          ? `/employee/messages?tab=jobs&jobId=${encodeURIComponent(jobId)}`
                          : role === "customer"
                            ? `/customer/job/${encodeURIComponent(jobId)}`
                            : `/owner/jobs/${encodeURIComponent(jobId)}`
                        : role === "employee"
                          ? actionData.url || "/employee/jobs"
                          : role === "customer"
                            ? actionData.url || `/customer/job/${encodeURIComponent(jobId)}`
                            : actionData.url || `/owner/jobs/${encodeURIComponent(jobId)}`
                      router.push(destination)
                    },
                  }
                : undefined,
            })
          }
        } catch (error) {
          logger.error("❌ Error parsing SSE message:", error)
        }
      }

      eventSource.onerror = async () => {
        setIsConnected(false)
        eventSource.close()
        
        if (user && !isCancelled) {
          // If tab is in background or device is offline, do not spin in reconnect loop.
          // reconnectWhenActive will cleanly reconnect when the tab becomes active or internet returns.
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
          if (typeof navigator !== 'undefined' && !navigator.onLine) return

          // Re-validate token before scheduling reconnect
          await getValidAccessToken()
          if (isCancelled) return
          const delay = Math.min(1000 * (2 ** sseRetryCountRef.current), 30_000)
          sseRetryCountRef.current = Math.min(sseRetryCountRef.current + 1, 5)
          reconnectTimerRef.current = setTimeout(() => {
            if (!isCancelled) setReconnectTrigger(prev => prev + 1)
          }, delay)
        }
      }

      sseConnectionRef.current = eventSource
    }

    initSSE()

    // Listen for cross-app token refresh so SSE automatically reconnects with fresh token
    const handleTokenRefreshed = () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      setReconnectTrigger(prev => prev + 1)
    }
    window.addEventListener("auth-token-refreshed", handleTokenRefreshed)
    const reconnectWhenActive = () => {
      if (!navigator.onLine || document.visibilityState !== "visible" || isCancelled || !user) return
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (activeEventSource?.readyState !== EventSource.OPEN) setReconnectTrigger(prev => prev + 1)
    }
    window.addEventListener("online", reconnectWhenActive)
    document.addEventListener("visibilitychange", reconnectWhenActive)

    const pollInterval = setInterval(() => {
      if (user && typeof document !== 'undefined' && document.visibilityState === 'visible' && navigator.onLine) {
        fetchNotifications()
      }
    }, 60000)

    return () => {
      isCancelled = true
      window.removeEventListener("auth-token-refreshed", handleTokenRefreshed)
      window.removeEventListener("online", reconnectWhenActive)
      document.removeEventListener("visibilitychange", reconnectWhenActive)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (activeEventSource) {
        activeEventSource.close()
      }
      if (sseConnectionRef.current) {
        sseConnectionRef.current.close()
        sseConnectionRef.current = null
      }
      clearInterval(pollInterval)
      setIsConnected(false)
      logger.log("📡 SSE connection closed")
    }
  }, [user, isLoading, isCustomerRoute, fetchNotifications, setupFCM, reconnectTrigger, isMuted, router])

  const addNotification = (notificationData: Omit<Notification, "id" | "created_at" | "read">) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = async (id: string) => {
    try {
      await apiClient(`/api/notifications/${id}/read`, {
        method: "PATCH",
      })

      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
      logger.log(`✅ Notification ${id} marked as read`)
    } catch (error) {
      logger.error("❌ Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiClient("/api/notifications/mark-all-read", {
        method: "PATCH",
      })

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      logger.log("✅ All notifications marked as read")
    } catch (error) {
      logger.error("❌ Error marking all as read:", error)
    }
  }

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        getUnreadCount,
        refreshNotifications: fetchNotifications,
        isConnected,
        isMuted,
        toggleMute,
        registerMessagingHandler,
        unregisterMessagingHandler,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
