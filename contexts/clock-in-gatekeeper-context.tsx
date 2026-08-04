"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/apiClient"
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
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const refreshAttendance = useCallback(async () => {
    try {
      const res = await apiClient<{ success?: boolean; attendance?: any; clock_in?: string; clock_out?: string }>("/api/attendance/today")
      const att = res?.attendance || res
      const hasClockIn = Boolean(att?.clock_in || att?.clockIn)
      const hasClockOut = Boolean(att?.clock_out || att?.clockOut)
      setIsClockedIn(hasClockIn && !hasClockOut)
    } catch (err) {
      // Fail-safe: assume false if check fails so gatekeeper protects operational actions
      setIsClockedIn(false)
    } finally {
      setLoading(false)
    }
  }, [])

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
