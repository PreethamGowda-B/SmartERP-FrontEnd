"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useCustomerAuth } from "./CustomerAuthContext"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import customerApi from "@/lib/customerApi"
import { logger } from "@/lib/logger"

export interface Notification {
  id: string
  type: "job" | "chat_message" | "message"
  title: string
  message: string
  created_at: string
  read: boolean
  priority: "low" | "medium" | "high"
  data?: any
}

interface CustomerNotificationContextType {
  notifications: Notification[]
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  getUnreadCount: () => number
  refreshNotifications: () => Promise<void>
}

const CustomerNotificationContext = createContext<CustomerNotificationContextType | undefined>(undefined)

export function CustomerNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { customer, isLoading } = useCustomerAuth()
  const router = useRouter()
  const [sseConnection, setSSEConnection] = useState<EventSource | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await customerApi.get<Notification[]>("/api/notifications")
      setNotifications(res.data || [])
    } catch (error) {
      logger.error("Error fetching customer notifications:", error)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!customer) {
      if (sseConnection) {
        sseConnection.close()
        setSSEConnection(null)
      }
      return
    }

    fetchNotifications()

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://smarterp-backendend.onrender.com"
    // For customers, we might need to handle token differently if they don't use getAccessToken()
    // Looking at CustomerAuthContext, it uses cookies mostly.
    const sseUrl = `${BACKEND_URL}/api/notifications/sse`
    const eventSource = new EventSource(sseUrl, { withCredentials: true })

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "notification") {
          const notification = data.data
          setNotifications((prev) => [notification, ...prev])

          // Play sound
          new Audio("/notification.mp3").play().catch(() => {})

          // Show toast
          toast(notification.title, {
            description: notification.message,
            action: {
              label: "View",
              onClick: () => {
                let path = "/customer/notifications"
                if (notification.type === "chat_message" && notification.data?.job_id) {
                  path = `/customer/job/${notification.data.job_id}`
                }
                router.push(path)
                markAsRead(notification.id)
              }
            }
          })
        }
      } catch (error) {
        logger.error("Error parsing customer SSE:", error)
      }
    }

    setSSEConnection(eventSource)
    return () => eventSource.close()
  }, [customer, isLoading, fetchNotifications, router])

  const markAsRead = async (id: string) => {
    try {
      await customerApi.patch(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      await customerApi.patch("/api/notifications/mark-all-read")
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {}
  }

  const getUnreadCount = () => notifications.filter(n => !n.read).length

  return (
    <CustomerNotificationContext.Provider
      value={{
        notifications,
        markAsRead,
        markAllAsRead,
        getUnreadCount,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </CustomerNotificationContext.Provider>
  )
}

export function useCustomerNotifications() {
  const context = useContext(CustomerNotificationContext)
  if (!context) throw new Error("useCustomerNotifications must be used within CustomerNotificationProvider")
  return context
}
