"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type NavContext = {
  loadingId: string | null
  setLoadingId: (id: string | null) => void
}

const NavLoadingContext = createContext<NavContext>({
  loadingId: null,
  setLoadingId: () => {},
})

const MIN_DISPLAY_MS = 1000 // minimum overlay display when page loads quickly; you can increase to 2000

export function NavLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const startRef = useRef<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // If loading starts, record start time
    if (loadingId) {
      startRef.current = Date.now()
    }
  }, [loadingId])

  useEffect(() => {
    // When pathname changes, consider navigation complete and clear loading after min duration
    if (!loadingId) return
    const started = startRef.current || Date.now()
    const elapsed = Date.now() - started
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
    const t = setTimeout(() => {
      setLoadingId(null)
      startRef.current = null
    }, remaining)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return <NavLoadingContext.Provider value={{ loadingId, setLoadingId }}>{children}</NavLoadingContext.Provider>
}

export function useNavLoading() {
  return useContext(NavLoadingContext)
}
