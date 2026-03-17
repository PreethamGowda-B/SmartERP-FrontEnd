"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"

type LoadingContextType = {
  isLoading: boolean // Delayed state for the main loader
  isActivelyLoading: boolean // Immediate state for background UI dimming
  message: string | null
  showLoading: (message?: string) => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

const ANTI_FLICKER_DELAY = 300 // ms
const MIN_DISPLAY_TIME = 800 // ms

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isActivelyLoading, setIsActivelyLoading] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const displayStartTimeRef = useRef<number | null>(null)
  const pathname = usePathname()

  const stopLoading = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    
    setIsActivelyLoading(false)
    const now = Date.now()
    const elapsed = displayStartTimeRef.current ? now - displayStartTimeRef.current : 0
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed)

    setTimeout(() => {
      setShouldShow(false)
      setMessage(null)
      displayStartTimeRef.current = null
    }, remaining)
  }, [])

  const startLoading = useCallback((msg?: string) => {
    setMessage(msg || "Loading...")
    setIsActivelyLoading(true)
    
    if (timerRef.current) clearTimeout(timerRef.current)
    
    timerRef.current = setTimeout(() => {
      setShouldShow(true)
      displayStartTimeRef.current = Date.now()
    }, ANTI_FLICKER_DELAY)
  }, [])

  useEffect(() => {
    stopLoading()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, stopLoading])

  return (
    <LoadingContext.Provider value={{ isLoading: shouldShow, isActivelyLoading, message, showLoading: startLoading, hideLoading: stopLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}
