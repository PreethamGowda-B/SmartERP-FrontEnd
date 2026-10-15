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
  const [isClockedIn, setIsClockedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem("_clocked_in_date")
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    return stored === today
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const refreshAttendance = useCallback(async () => {
    try {
      // Clock-in gatekeeper is only active for employees inside the employee portal
      if (isPublicRoute(pathname) || (user?.role && user.role !== 'employee') || (pathname && !pathname.startsWith('/employee'))) {
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
      const res = await apiClient<any>("/api/attendance/today", { skipCache: true } as any)
      const att = res?.attendance || res
      const hasClockIn = Boolean(
        att?.check_in_time ||
        att?.checkInTime ||
        att?.clock_in_time ||
        att?.clock_in ||
        att?.clockIn
      )
      // Auto-clock-out performed by system cron at 7 PM should NOT lock out active technicians
      const isAutoClockOut = Boolean(att?.is_auto_clocked_out)
      const hasManualClockOut = Boolean(
        (att?.check_out_time || att?.checkOutTime || att?.clock_out_time || att?.clock_out || att?.clockOut) &&
        !isAutoClockOut
      )

      const clockedInNow = hasClockIn && !hasManualClockOut
      setIsClockedIn(clockedInNow)
      if (typeof window !== "undefined") {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        if (clockedInNow) {
          localStorage.setItem("_clocked_in_date", today)
        } else if (hasManualClockOut) {
          localStorage.removeItem("_clocked_in_date")
        }
      }
    } catch {
      // If network fails, check if local storage recorded clock in for today
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("_clocked_in_date")
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        if (stored === today) {
          setIsClockedIn(true)
        }
      }
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

  const withClockInCheck = useCallback(async (callback: () => void) => {
    if (isClockedIn) {
      callback()
      return
    }

    // Fast check local storage fallback before showing modal
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    const stored = typeof window !== "undefined" ? localStorage.getItem("_clocked_in_date") : null
    if (stored === today) {
      setIsClockedIn(true)
      callback()
      return
    }

    // Live re-check before blocking
    try {
      const res = await apiClient<any>("/api/attendance/today", { skipCache: true } as any)
      const att = res?.attendance || res
      const hasClockIn = Boolean(
        att?.check_in_time || att?.checkInTime || att?.clock_in_time || att?.clock_in || att?.clockIn
      )
      const hasManualClockOut = Boolean(
        (att?.check_out_time || att?.checkOutTime || att?.clock_out_time || att?.clock_out || att?.clockOut) &&
        !att?.is_auto_clocked_out
      )
      if (hasClockIn && !hasManualClockOut) {
        setIsClockedIn(true)
        if (typeof window !== "undefined") localStorage.setItem("_clocked_in_date", today)
        callback()
        return
      }
    } catch (err) {
      console.warn("Gatekeeper live check error:", err)
    }

    setIsModalOpen(true)
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
