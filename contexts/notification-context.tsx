"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

export interface Notification {
  id: string
  type: "job" | "material_request" | "payroll" | "message" | "chat_message"
  title: string
  message: string
  created_at: string
  read: boolean
  priority: "low" | "medium" | "high"
  data?: any // Additional data for the notification
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "created_at" | "read">) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  getUnreadCount: () => number
  refreshNotifications: () => Promise<void>
  isConnected: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// BACKEND_URL removed as apiClient handles it

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sseConnection, setSSEConnection] = useState<EventSource | null>(null)
  const [reconnectTrigger, setReconnectTrigger] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiClient("/api/notifications")
      setNotifications(data || [])
      logger.log(`✅ Fetched ${data?.length || 0} notifications`)
    } catch (error) {
      logger.error("❌ Error fetching notifications:", error)
    }
  }, [user])

  // Initialize FCM and request permission
  const setupFCM = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const { messaging, VAPID_KEY } = await import("@/lib/firebase");
        const { getToken: getFCMToken, onMessage } = await import("firebase/messaging");

        // Explicitly register service worker for reliability
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        logger.log("✅ Service Worker registered:", registration.scope);

        // Handle foreground messages
        onMessage(messaging, (payload) => {
          logger.log("🔔 FCM Foreground message received:", payload);
          // REQUIREMENT: Work when app is OPEN. Show system notification in mobile bar.
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
          // Send token to the new multi-device endpoint
          await apiClient("/api/notifications/devices", {
            method: "POST",
            body: JSON.stringify({
              fcmToken: currentToken,
              deviceType: 'web'
            }),
          });
        } else {
          logger.log("⚠️ No registration token available. Request permission to generate one.");
        }
      }
    } catch (error) {
      logger.error("❌ Error setting up FCM:", error);
    }
  }, [user]);

  // Establish SSE connection for real-time notifications
  useEffect(() => {
    // Wait for auth to finish (proactive token refresh) before making API calls
    if (isLoading) return

    if (!user) {
      if (sseConnection) {
        sseConnection.close()
        setSSEConnection(null)
      }
      return
    }

    fetchNotifications()
    setupFCM() // Request FCM permission

    // SSE requires token as query param since EventSource doesn't support custom headers
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://smarterp-backendend.onrender.com"
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
        } else if (data.type === "notification") {
          const notification = data.data
          logger.log("🔔 New notification received:", notification)

          setNotifications((prev) => [notification, ...prev])

          // 1. Play notification sound
          const audio = new Audio("/notification.mp3")
          audio.play().catch((e) => logger.log("🔇 Audio play blocked by browser", e))

          // 2. Show toast notification
          const isChatMessage = notification.type === "chat_message"
          toast(notification.title, {
            description: notification.message,
            duration: isChatMessage ? 8000 : 5000,
            action: {
              label: "View",
              onClick: () => {
                // Determine redirect path based on notification type/data
                let redirectPath = "/notifications"
                if (user.role === "owner") {
                  if (notification.type === "job") redirectPath = "/owner/jobs"
                  else if (notification.type === "material_request") redirectPath = "/owner/materials"
                } else {
                  if (notification.type === "job") redirectPath = "/employee/jobs"
                  else if (notification.type === "chat_message") redirectPath = "/employee/jobs"
                  else if (notification.type === "message") redirectPath = "/employee/messages"
                }
                router.push(redirectPath)
                markAsRead(notification.id)
              },
            },
          })
        }
      } catch (error) {
        logger.error("❌ Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
      
      // Auto-reconnect after 3 seconds with fresh token
      if (user) {
        setTimeout(() => {
          setReconnectTrigger(prev => prev + 1)
        }, 3000)
      }
    }

    setSSEConnection(eventSource)

    // FIX 5: NOTIFICATION SYNC (Fallback polling every 60s)
    const pollInterval = setInterval(() => {
      if (user) fetchNotifications()
    }, 60000)

    return () => {
      eventSource.close()
      clearInterval(pollInterval)
      setIsConnected(false)
      logger.log("📡 SSE connection closed")
    }
  }, [user, isLoading, fetchNotifications, router, reconnectTrigger])

  const addNotification = (notificationData: Omit<Notification, "id" | "created_at" | "read">) => {
    // This is for local notifications only (not used in production)
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
        isConnected
      }}
    >
      {children}
      
      {/* 🔴 PART 9: SSE UX POLISH (Live Indicator) */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 pointer-events-none select-none">
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border transition-all duration-500 ${
          isConnected 
            ? "bg-green-500/10 text-green-600 border-green-500/20" 
            : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 animate-pulse"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500"
          }`} />
          {isConnected ? "Live" : "Reconnecting..."}
        </div>
      </div>
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
