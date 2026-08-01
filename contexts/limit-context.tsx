"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useSubscription } from "@/contexts/subscription-context"
import { PlanLimitModal, LimitModalData } from "../components/plan-limit-modal"

interface LimitContextType {
  triggerLimitModal: (data: LimitModalData) => void
  closeLimitModal: () => void
  checkClientLimit: (limitType: "employee" | "job" | "inventory" | "storage" | "ai_messages", currentCount: number, onUnlockedResume?: () => void) => boolean
}

const LimitContext = createContext<LimitContextType>({
  triggerLimitModal: () => {},
  closeLimitModal: () => {},
  checkClientLimit: () => true,
})

export function LimitProvider({ children }: { children: React.ReactNode }) {
  const [modalData, setModalData] = useState<LimitModalData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { plan, isPro, isBasic, isFree } = useSubscription()

  const triggerLimitModal = useCallback((data: LimitModalData) => {
    setModalData(data)
    setIsOpen(true)
  }, [])

  const closeLimitModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Listen for server-side 403 PLAN_LIMIT_REACHED events from apiClient
  useEffect(() => {
    const handleServerLimit = (e: Event) => {
      const customEv = e as CustomEvent
      const details = customEv.detail || {}
      triggerLimitModal({
        limitType: details.limitType || "job",
        currentCount: details.currentCount || 0,
        maxLimit: details.maxLimit || 0,
        currentPlan: details.currentPlan || "Free",
      })
    }

    if (typeof window !== "undefined") {
      window.addEventListener("plan-limit-reached", handleServerLimit)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("plan-limit-reached", handleServerLimit)
      }
    }
  }, [triggerLimitModal])

  // Execute interrupted action resumption upon subscription activation
  useEffect(() => {
    const handleActivation = () => {
      if (isOpen && modalData?.onUnlockedResume) {
        console.log("⚡ [LimitContext] Subscription Activated! Resuming Interrupted Action...")
        const callback = modalData.onUnlockedResume
        setIsOpen(false)
        setModalData(null)
        setTimeout(() => {
          callback()
        }, 300)
      } else if (isOpen) {
        setIsOpen(false)
        setModalData(null)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("subscription-activated", handleActivation)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("subscription-activated", handleActivation)
      }
    }
  }, [isOpen, modalData])

  // Client-side pre-write limit check
  const checkClientLimit = useCallback(
    (
      limitType: "employee" | "job" | "inventory" | "storage" | "ai_messages",
      currentCount: number,
      onUnlockedResume?: () => void
    ): boolean => {
      if (isPro) return true // Pro has no limits

      let maxLimit = 0
      let title = ""

      if (limitType === "employee") {
        maxLimit = isBasic ? 50 : 10
        title = "Employee Limit Reached"
      } else if (limitType === "job") {
        maxLimit = isBasic ? 100 : 15
        title = "Job Limit Reached"
      } else if (limitType === "inventory") {
        maxLimit = isBasic ? 500 : 50
        title = "Inventory Limit Reached"
      } else if (limitType === "storage") {
        maxLimit = isBasic ? 5 * 1024 * 1024 * 1024 : 250 * 1024 * 1024
        title = "Storage Limit Reached"
      } else if (limitType === "ai_messages") {
        maxLimit = isBasic ? 300 : 20
        title = "Daily AI Limit Reached"
      }

      if (currentCount >= maxLimit) {
        triggerLimitModal({
          limitType,
          currentCount,
          maxLimit,
          title,
          currentPlan: plan.name || (isBasic ? "Basic" : "Free"),
          onUnlockedResume,
        })
        return false // Blocked
      }

      return true // Allowed
    },
    [isPro, isBasic, plan.name, triggerLimitModal]
  )

  return (
    <LimitContext.Provider value={{ triggerLimitModal, closeLimitModal, checkClientLimit }}>
      {children}
      {modalData && (
        <PlanLimitModal
          isOpen={isOpen}
          onClose={closeLimitModal}
          data={modalData}
        />
      )}
    </LimitContext.Provider>
  )
}

export function useLimit() {
  return useContext(LimitContext)
}
