"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { apiClient } from "@/lib/apiClient"
import { isPublicRoute } from "@/lib/route-utils"
import { useAuth } from "@/contexts/auth-context"
import { ClockInRequiredModal } from "@/components/clock-in-required-modal"
import { toast } from "sonner"

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
  // Browser storage is only a display hint. The backend attendance row is the
  // authority for whether an employee can perform a company operation.
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const readAttendanceStatus = useCallback(async (): Promise<boolean | null> => {
    // The backend attendance row is authoritative. A saved browser marker must
    // never grant access when the API is unavailable or the shift was closed.
    if (isPublicRoute(pathname) || (user?.role && user.role !== "employee") || (pathname && !pathname.startsWith("/employee"))) {
      setIsClockedIn(false)
      return false
    }

    try {
      const res = await apiClient<any>("/api/attendance/today", { skipCache: true } as any)
      const attendance = res?.attendance || res
      const hasClockIn = Boolean(
        attendance?.check_in_time ||
        attendance?.checkInTime ||
        attendance?.clock_in_time ||
        attendance?.clock_in ||
        attendance?.clockIn
      )
      const hasClockOut = Boolean(
        attendance?.check_out_time ||
        attendance?.checkOutTime ||
        attendance?.clock_out_time ||
        attendance?.clock_out ||
        attendance?.clockOut
      )
      // Match requireClockIn: automatic and manual clock-outs both close the shift.
      const clockedIn = hasClockIn && !hasClockOut
      setIsClockedIn(clockedIn)

      if (typeof window !== "undefined") {
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        if (clockedIn) localStorage.setItem("_clocked_in_date", today)
        else localStorage.removeItem("_clocked_in_date")
      }
      return clockedIn
    } catch {
      setIsClockedIn(false)
      return null
    }
  }, [user?.role, pathname])

  const refreshAttendance = useCallback(async () => {
    setLoading(true)
    try {
      await readAttendanceStatus()
    } finally {
      setLoading(false)
    }
  }, [readAttendanceStatus])

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
    const attendanceStatus = await readAttendanceStatus()
    if (attendanceStatus === true) {
      callback()
      return
    }
    if (attendanceStatus === null) {
      toast.error("Could not verify your clock-in status. Check your connection and try again.")
      return
    }
    setIsModalOpen(true)
  }, [readAttendanceStatus])

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
