"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { apiClient, isTokenExpired } from "@/lib/apiClient"
import { isPublicRoute } from "@/lib/route-utils"
import { useAuth } from "@/contexts/auth-context"
import { ClockInRequiredModal } from "@/components/clock-in-required-modal"

interface ClockInGatekeeperContextType {
  isClockedIn: boolean
  loading: boolean
  refreshAttendance: () => Promise<void>
  withClockInCheck: (callback: () => void) => void
  openClockInModal: () => void
}

const ClockInGatekeeperContext = createContext<ClockInGatekeeperContextType>({
  isClockedIn: false,
  loading: true,
  refreshAttendance: async () => {},
  withClockInCheck: (cb) => cb(),
  openClockInModal: () => {},
})

export function ClockInGatekeeperProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const refreshAttendance = useCallback(async () => {
    try {
      // Clock-in gatekeeper is only active for employees inside the employee portal
      if (isPublicRoute(pathname) || user?.role !== 'employee' || !pathname?.startsWith('/employee')) {
        setIsClockedIn(false)
        setLoading(false)
        return
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("_at") || localStorage.getItem("accessToken") : null
      if (!token || isTokenExpired(token)) {
        setIsClockedIn(false)
        setLoading(false)
        return
      }
      const res = await apiClient<any>("/api/attendance/today")
      const att = res?.attendance || res
      const hasClockIn = Boolean(
        att?.check_in_time ||
        att?.checkInTime ||
        att?.clock_in_time ||
        att?.clock_in ||
        att?.clockIn
      )
      const hasClockOut = Boolean(
        att?.check_out_time ||
        att?.checkOutTime ||
        att?.clock_out_time ||
        att?.clock_out ||
        att?.clockOut
      )
      setIsClockedIn(hasClockIn && !hasClockOut)
    } catch {
      // Fail-safe: assume false if check fails so gatekeeper protects operational actions
      setIsClockedIn(false)
    } finally {
      setLoading(false)
    }
  }, [user?.role, pathname])

  useEffect(() => {
    refreshAttendance()

    // Listen to custom clock-in/out window events if dispatched by attendance page
    const handleAttendanceChange = () => {
      refreshAttendance()
    }

    window.addEventListener("attendance-status-changed", handleAttendanceChange)
    return () => {
      window.removeEventListener("attendance-status-changed", handleAttendanceChange)
    }
  }, [refreshAttendance])

  const withClockInCheck = useCallback((callback: () => void) => {
    if (isClockedIn) {
      callback()
    } else {
      setIsModalOpen(true)
    }
  }, [isClockedIn])

  const openClockInModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  return (
    <ClockInGatekeeperContext.Provider
      value={{
        isClockedIn,
        loading,
        refreshAttendance,
        withClockInCheck,
        openClockInModal,
      }}
    >
      {children}
      <ClockInRequiredModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </ClockInGatekeeperContext.Provider>
  )
}

export function useClockInGatekeeper() {
  return useContext(ClockInGatekeeperContext)
}
