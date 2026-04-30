"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useCustomerAuth } from "./CustomerAuthContext"
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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await customerApi.get<Notification[]>("/api/customer/notifications")
      setNotifications(res.data || [])
    } catch (error) {
      logger.error("Error fetching customer notifications:", error)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!customer) {
      // Close any open SSE connection when customer logs out
      if (sseConnection) {
        sseConnection.close()
        setSSEConnection(null)
      }
      return
    }

    // Fetch notifications on mount and poll every 30s
    // (Customer portal uses per-job SSE via /api/customer/jobs/:id/events,
    //  not a global SSE stream — so we poll here instead)
    fetchNotifications()
    const pollInterval = setInterval(fetchNotifications, 30_000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [customer, isLoading, fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      await customerApi.patch(`/api/customer/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      await customerApi.patch("/api/customer/notifications/mark-all-read")
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
