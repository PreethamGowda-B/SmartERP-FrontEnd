"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getAccessToken } from "@/lib/apiClient"

export interface Notification {
  id: string
  type: "job" | "material_request" | "payroll" | "message"
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://smarterp-backendend.onrender.com"

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()
  const router = useRouter()
  const [sseConnection, setSSEConnection] = useState<EventSource | null>(null)

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`, {
        credentials: "include", // Send HttpOnly cookies
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        console.log(`✅ Fetched ${data.length} notifications`)
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error)
    }
  }, [user])

  // Initialize FCM and request permission
  const setupFCM = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const { messaging, VAPID_KEY } = await import("@/lib/firebase");
        const { getToken: getFCMToken } = await import("firebase/messaging");

        const currentToken = await getFCMToken(messaging, {
          vapidKey: VAPID_KEY,
        });

        if (currentToken) {
          console.log("✅ FCM Token generated");
          // Send token to backend
          await fetch(`${BACKEND_URL}/api/auth/update-push-token`, {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(getAccessToken() ? { "Authorization": `Bearer ${getAccessToken()}` } : {}),
            },
            body: JSON.stringify({ pushToken: currentToken }),
          });
        } else {
          console.log("⚠️ No registration token available. Request permission to generate one.");
        }
      }
    } catch (error) {
      console.error("❌ Error setting up FCM:", error);
    }
  }, [user]);

  // Establish SSE connection for real-time notifications
  useEffect(() => {
    // We remove the early "token check" here since auth depends on HttpOnly cookies now
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
    const token = getAccessToken()
    const sseUrl = token
      ? `${BACKEND_URL}/api/notifications/sse?token=${encodeURIComponent(token)}`
      : `${BACKEND_URL}/api/notifications/sse`
    const eventSource = new EventSource(sseUrl, {
      withCredentials: true,
    })

    eventSource.onopen = () => {
      console.log("📡 SSE connection established")
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "connected") {
          console.log("✅ SSE connected:", data.message)
        } else if (data.type === "notification") {
          const notification = data.data
          console.log("🔔 New notification received:", notification)

          setNotifications((prev) => [notification, ...prev])

          // 1. Play notification sound
          const audio = new Audio("/notification.mp3")
          audio.play().catch((e) => console.log("🔇 Audio play blocked by browser", e))

          // 2. Show toast notification
          toast(notification.title, {
            description: notification.message,
            duration: 5000,
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
                  else if (notification.type === "message") redirectPath = "/employee/messages"
                }
                router.push(redirectPath)
                markAsRead(notification.id)
              },
            },
          })
        }
      } catch (error) {
        console.error("❌ Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error)
      eventSource.close()
    }

    setSSEConnection(eventSource)

    return () => {
      eventSource.close()
      console.log("📡 SSE connection closed")
    }
  }, [user, fetchNotifications, router])

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
      const response = await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include", // Send HttpOnly cookies
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
        )
        console.log(`✅ Notification ${id} marked as read`)
      }
    } catch (error) {
      console.error("❌ Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications/mark-all-read`, {
        method: "PATCH",
        credentials: "include", // Send HttpOnly cookies
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
        console.log("✅ All notifications marked as read")
      }
    } catch (error) {
      console.error("❌ Error marking all as read:", error)
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
