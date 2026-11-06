"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { apiClient, getAccessToken, isTokenExpired } from "@/lib/apiClient"
import { isPublicRoute } from "@/lib/route-utils"
import { useAuth } from "./auth-context"
import { DEFAULT_PLAN } from "@/lib/subscription-plan-default"
import { logger } from "@/lib/logger"

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
  ar_collections?: boolean
  inventory_forecasts?: boolean
  [key: string]: boolean | undefined
}

export interface SupportPolicy {
  channels: ReadonlyArray<"email" | "whatsapp">
  firstResponseBusinessHours: number
}

export interface SubscriptionPlan {
  id: number
  plan_key?: string
  name: string
  is_trial: boolean
  days_remaining: number
  employee_limit: number | null
  max_inventory_items: number | null
  max_active_jobs?: number | null
  max_storage_bytes?: number | null
  messages_history_days?: number
  features: PlanFeatures
  support_policy: SupportPolicy
}

export interface SubscriptionUsage {
  employees: number
  inventory_items: number
  storage_bytes?: number
}

export interface SubscriptionLimits {
  employees_remaining: number | null
  inventory_remaining: number | null
}

export interface SubscriptionStatusData {
  plan: SubscriptionPlan
  usage: SubscriptionUsage
  limits: SubscriptionLimits
  trial_started_at: string | null
  trial_ends_at: string | null
  subscription_expires_at: string | null
  is_first_login: boolean
  billing_cycle?: string
  trial_eligible?: boolean
}

interface SubscriptionContextType {
  plan: SubscriptionPlan
  statusData: SubscriptionStatusData | null
  planTier: "starter" | "professional" | "enterprise"
  isPro: boolean
  isBasic: boolean
  isFree: boolean
  isTrial: boolean
  daysRemaining: number
  trialEndsAt: string | null
  loading: boolean
  error: Error | null
  refreshSubscription: (force?: boolean) => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  plan: DEFAULT_PLAN as SubscriptionPlan,
  statusData: null,
  planTier: "starter",
  isPro: false,
  isBasic: false,
  isFree: true,
  isTrial: false,
  daysRemaining: 0,
  trialEndsAt: null,
  loading: true,
  error: null,
  refreshSubscription: async () => {},
})

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const isPublic = isPublicRoute(pathname)
  const [plan, setPlan] = useState<SubscriptionPlan>(DEFAULT_PLAN as SubscriptionPlan)
  const [statusData, setStatusData] = useState<SubscriptionStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const inFlightPromiseRef = useRef<Promise<SubscriptionStatusData | null> | null>(null)
  const lastFetchedRef = useRef<number>(0)

  const fetchSubscriptionStatus = useCallback(async (force = false) => {
    // Never query company subscription on public landing/marketing/auth routes
    if (isPublic) {
      setPlan(DEFAULT_PLAN as SubscriptionPlan)
      setStatusData(null)
      setLoading(false)
      setError(null)
      return
    }

    if (!user) {
      setPlan(DEFAULT_PLAN as SubscriptionPlan)
      setStatusData(null)
      setLoading(false)
      setError(null)
      return
    }

    // Super admins have no company subscription — give them an unlimited sentinel plan
    if (user.role === 'super_admin') {
      const superAdminPlan: SubscriptionPlan = {
        id: 0,
        plan_key: "super_admin",
        name: 'Super Admin',
        is_trial: false,
        days_remaining: 36500,
        employee_limit: null,
        max_inventory_items: null,
        max_active_jobs: null,
        max_storage_bytes: null,
        features: {
          payroll: true, messages: true, ai_assistant: true,
          basic_reports: true, export_reports: true, advanced_reports: true,
          inventory_images: true, priority_support: true, location_tracking: true,
          ar_collections: true, inventory_forecasts: true
        },
        support_policy: { channels: ["email", "whatsapp"], firstResponseBusinessHours: 4 },
      }
      setPlan(superAdminPlan)
      setStatusData({
        plan: superAdminPlan,
        usage: { employees: 0, inventory_items: 0, storage_bytes: 0 },
        limits: { employees_remaining: null, inventory_remaining: null },
        trial_started_at: null,
        trial_ends_at: null,
        subscription_expires_at: null,
        is_first_login: false,
      })
      setLoading(false)
      setError(null)
      return
    }

    // Deduplication check: if cached within 30s and not forced, reuse
    if (!force && lastFetchedRef.current > 0 && Date.now() - lastFetchedRef.current < 30000 && statusData) {
      return
    }

    // In-flight deduplication: return shared promise if currently fetching
    if (inFlightPromiseRef.current) {
      try {
        await inFlightPromiseRef.current
      } catch {
        // already handled by root caller
      }
      return
    }

    const fetchPromise = (async () => {
      const at = getAccessToken()
      if (!at || isTokenExpired(at)) {
        return null
      }
      const res = await apiClient<SubscriptionStatusData>("/api/subscription/status", {
        timeoutMs: 30000,
      })
      return res
    })()

    inFlightPromiseRef.current = fetchPromise

    try {
      const res = await fetchPromise
      if (res && res.plan) {
        setPlan(res.plan)
        setStatusData(res)
        setError(null)
        lastFetchedRef.current = Date.now()
      }
    } catch (err: any) {
      const isAbort = err?.name === "AbortError" || err?.message?.toLowerCase()?.includes("cancelled")
      if (!isAbort) {
        logger.warn("[SubscriptionContext] Failed to load subscription status:", err?.message || err)
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      inFlightPromiseRef.current = null
      setLoading(false)
    }
  }, [user, isPublic, statusData])

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [fetchSubscriptionStatus])

  // Listen for real-time payment activation events
  useEffect(() => {
    const handleActivation = () => {
      fetchSubscriptionStatus(true)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("subscription-activated", handleActivation)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("subscription-activated", handleActivation)
      }
    }
  }, [fetchSubscriptionStatus])

  const planKey = String(plan.plan_key || "").toLowerCase()
  const normalizedName = String(plan.name || "").trim().toLowerCase()
  const isPro = plan.id === 0 || plan.id === 3 || planKey === "enterprise" || normalizedName === "enterprise" || normalizedName === "pro"
  const isBasic = plan.id === 2 || planKey === "professional" || normalizedName === "professional" || normalizedName === "basic"
  const isFree = !isPro && !isBasic
  const planTier = isPro ? "enterprise" : isBasic ? "professional" : "starter"
  const isTrial = Boolean(plan.is_trial)
  const daysRemaining = Number(plan.days_remaining || 0)
  const trialEndsAt = statusData?.trial_ends_at || (plan as any)?.trial_ends_at || null

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        statusData,
        planTier,
        isPro,
        isBasic,
        isFree,
        isTrial,
        daysRemaining,
        trialEndsAt,
        loading,
        error,
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
