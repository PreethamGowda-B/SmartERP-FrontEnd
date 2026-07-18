"use client"

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useNotifications } from '@/contexts/notification-context'
import { useMessaging } from '@/hooks/useMessaging'
import type { MessagingState, MessagingActions, SSEMessagingEvent } from '@/types/messaging'

interface MessagingContextType extends MessagingState {
  actions: MessagingActions & { loadInitialData: () => Promise<void> }
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { registerMessagingHandler, unregisterMessagingHandler } = useNotifications()
  const { state, actions } = useMessaging(String(user?.id ?? ''))

  // Load initial data when user is available
  useEffect(() => {
    if (user?.id) {
      actions.loadInitialData()
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Register SSE event handler with NotificationContext
  useEffect(() => {
    registerMessagingHandler((event) => {
      actions.handleSSEEvent(event as SSEMessagingEvent)
    })
    return () => {
      unregisterMessagingHandler()
    }
  }, [registerMessagingHandler, unregisterMessagingHandler]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MessagingContext.Provider value={{ ...state, actions }}>
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessagingContext() {
  const ctx = useContext(MessagingContext)
  if (!ctx) throw new Error('useMessagingContext must be used within MessagingProvider')
  return ctx
}

export type { SSEMessagingEvent }
