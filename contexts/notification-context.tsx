"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

import { LiveNotificationToastContainer, LiveToastItem } from "@/components/live-notification-toast"
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
  const [liveToasts, setLiveToasts] = useState<LiveToastItem[]>([])
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("smarterp_sound_muted") === "true"
    }
    return false
  })

  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sseConnection, setSSEConnection] = useState<EventSource | null>(null)
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

  const handleDismissLiveToast = useCallback((id: string) => {
    setLiveToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
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
  }, [user])

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
    if (isLoading) return

    if (!user) {
      if (sseConnection) {
        sseConnection.close()
        setSSEConnection(null)
      }
      return
    }

    fetchNotifications()
    setupFCM()

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.prozync.in"
    const token = getAuthToken()
    const sseUrl = token
      ? `${BACKEND_URL}/api/notifications/sse?token=${encodeURIComponent(token)}`
      : `${BACKEND_URL}/api/notifications/sse`
    const eventSource = new EventSource(sseUrl, {
      withCredentials: true,
    })

    eventSource.onopen = () => {
      logger.log("📡 SSE connection established")
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

          // 1. Update Notification Center state
          setNotifications((prev) => [notification, ...prev])

          // 2. Add Live Slide-In Toast Popup
          setLiveToasts((prev) => [
            {
              id: String(notification.id || Date.now()),
              title: notification.title || "Notification",
              message: notification.message || "",
              type: notification.type || "system",
              created_at: notification.created_at || new Date().toISOString(),
              data: notification.data || {},
              read: false,
            },
            ...prev.slice(0, 5), // Keep max 5
          ])

          // 3. Play Crisp Web Audio Chime Sound (if not muted)
          if (!isMuted) {
            playEnterpriseChime()
          }

          // 4. Toast Fallback
          toast(notification.title, {
            description: notification.message,
            duration: 6000,
          })
        }
      } catch (error) {
        logger.error("❌ Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
      
      if (user) {
        setTimeout(() => {
          setReconnectTrigger(prev => prev + 1)
        }, 3000)
      }
    }

    setSSEConnection(eventSource)

    const pollInterval = setInterval(() => {
      if (user) fetchNotifications()
    }, 60000)

    return () => {
      eventSource.close()
      clearInterval(pollInterval)
      setIsConnected(false)
      logger.log("📡 SSE connection closed")
    }
  }, [user?.id, isLoading, fetchNotifications, setupFCM, reconnectTrigger, isMuted])

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
      <LiveNotificationToastContainer
        toasts={liveToasts}
        onDismiss={handleDismissLiveToast}
        onMarkRead={markAsRead}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />
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
