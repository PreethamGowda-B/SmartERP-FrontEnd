"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { apiClient, getAccessToken, isTokenExpired } from "@/lib/apiClient"
import { isPublicRoute } from "@/lib/route-utils"
import { useAuth } from "./auth-context"

export interface PlanFeatures {
  payroll?: boolean
  messages?: boolean
  ai_assistant?: boolean
  basic_reports?: boolean
  export_reports?: boolean
  advanced_reports?: boolean
  inventory_images?: boolean
  priority_support?: boolean
  location_tracking?: boolean
  [key: string]: boolean | undefined
}

export interface SubscriptionPlan {
  id: number
  plan_key?: string
  name: string
  is_trial: boolean
  days_remaining: number
  employee_limit: number | null
  max_inventory_items: number | null
  features: PlanFeatures
}

interface SubscriptionContextType {
  plan: SubscriptionPlan
  planTier: "starter" | "professional" | "enterprise"
  isPro: boolean
  isBasic: boolean
  isFree: boolean
  loading: boolean
  refreshSubscription: () => Promise<void>
}

const DEFAULT_PLAN: SubscriptionPlan = {
  id: 1,
  name: "Starter",
  is_trial: false,
  days_remaining: 0,
  employee_limit: 10,
  max_inventory_items: 50,
  features: {
    payroll: false,
    messages: false,
    ai_assistant: false,
    basic_reports: true,
    export_reports: false,
    advanced_reports: false,
    inventory_images: false,
    priority_support: false,
    location_tracking: false,
  },
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  plan: DEFAULT_PLAN,
  planTier: "starter",
  isPro: false,
  isBasic: false,
  isFree: true,
  loading: true,
  refreshSubscription: async () => {},
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const isPublic = isPublicRoute(pathname)
  const [plan, setPlan] = useState<SubscriptionPlan>(DEFAULT_PLAN)
  const [loading, setLoading] = useState(true)

  const fetchSubscriptionStatus = useCallback(async () => {
    // Never query company subscription on public landing/marketing/auth routes
    if (isPublic) {
      setPlan(DEFAULT_PLAN)
      setLoading(false)
      return
    }

    if (!user) {
      setPlan(DEFAULT_PLAN)
      setLoading(false)
      return
    }

    // Super admins have no company subscription — give them an unlimited sentinel plan
    if (user.role === 'super_admin') {
      setPlan({
        id: 0,
        plan_key: "super_admin",
        name: 'Super Admin',
        is_trial: false,
        days_remaining: 36500,
        employee_limit: null,
        max_inventory_items: null,
        features: {
          payroll: true, messages: true, ai_assistant: true,
          basic_reports: true, export_reports: true, advanced_reports: true,
          inventory_images: true, priority_support: true, location_tracking: true
        }
      })
      setLoading(false)
      return
    }

    try {
      const at = getAccessToken()
      if (!at || isTokenExpired(at)) {
        setLoading(false)
        return
      }
      const res = await apiClient("/api/subscription/status")
      if (res && res.plan) {
        setPlan(res.plan)
      }
    } catch {
      // Fallback to default
    } finally {
      setLoading(false)
    }
  }, [user, isPublic])

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [fetchSubscriptionStatus])

  // Listen for real-time payment activation events
  useEffect(() => {
    const handleActivation = () => {
      fetchSubscriptionStatus()
    }

    const handleFocus = () => {
      const at = getAccessToken()
      if (!isPublic && user?.role === 'owner' && at && !isTokenExpired(at)) {
        fetchSubscriptionStatus()
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("subscription-activated", handleActivation)
      window.addEventListener("focus", handleFocus)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("subscription-activated", handleActivation)
        window.removeEventListener("focus", handleFocus)
      }
    }
  }, [fetchSubscriptionStatus, user?.role, isPublic])

  const planKey = String(plan.plan_key || "").toLowerCase()
  const normalizedName = String(plan.name || "").trim().toLowerCase()
  const isPro = plan.id === 0 || plan.id === 3 || planKey === "enterprise" || normalizedName === "enterprise" || normalizedName === "pro"
  const isBasic = plan.id === 2 || planKey === "professional" || normalizedName === "professional" || normalizedName === "basic"
  const isFree = !isPro && !isBasic
  const planTier = isPro ? "enterprise" : isBasic ? "professional" : "starter"

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        planTier,
        isPro,
        isBasic,
        isFree,
        loading,
        refreshSubscription: fetchSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}
