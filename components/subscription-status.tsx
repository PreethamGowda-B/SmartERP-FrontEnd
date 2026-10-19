"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, ArrowRight, ShieldCheck, Users, Box, AlertCircle, Sparkles, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { apiClient, getAccessToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

type SubscriptionStatusData = {
  plan: {
    id?: number | string
    name: string
    is_trial: boolean
    days_remaining: number
    employee_limit: number | null
    max_inventory_items: number | null
  }
  usage: {
    employees: number
    inventory_items: number
  }
  billing_cycle?: string
  subscription_expires_at: string | null
}

export function SubscriptionStatus() {
  const [data, setData] = useState<SubscriptionStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchStatus() {
      if (!getAccessToken()) {
        setLoading(false)
        return
      }
      try {
        const res = await apiClient("/api/subscription/status")
        setData(res)
      } catch (err) {
        logger.error("Failed to fetch subscription status:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  if (loading) return null

  if (error || !data) {
    return (
      <Card className="border-border shadow-xs bg-red-50/50 dark:bg-red-950/20">
        <CardContent className="p-3.5 flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Unable to synchronize subscription status.</span>
        </CardContent>
      </Card>
    )
  }

  const { plan, usage } = data

  const normalizedPlanName = String(plan.name || "").trim().toLowerCase()
  const isPro = Number(plan.id) === 3 || normalizedPlanName === "enterprise" || normalizedPlanName === "pro"
  const isBasic = Number(plan.id) === 2 || normalizedPlanName === "professional" || normalizedPlanName === "basic"
  const isFree = Number(plan.id) === 1 || normalizedPlanName === "starter" || normalizedPlanName === "free"
  const isTrial = plan.is_trial
  const daysRemaining = plan.days_remaining || 0

  let planMessage = ""
  const isExpired = !isFree && daysRemaining <= 0

  if (isExpired) {
    planMessage = `Your ${plan.name.toUpperCase()} plan has expired. Upgrade now to restore access.`
  } else if (isTrial) {
    planMessage = `30-day Enterprise trial active`
  } else if (isPro) {
    const rawCycle = (data.billing_cycle || "").toLowerCase()
    const isYearly = rawCycle === "yearly" || rawCycle === "annual" || daysRemaining > 45
    const billingCycle = isYearly ? "Yearly" : "Monthly"
    planMessage = `ENTERPRISE plan (${billingCycle})`
  } else if (isBasic) {
    planMessage = `PROFESSIONAL plan`
  } else if (isFree) {
    planMessage = `STARTER tier`
  } else {
    planMessage = `${plan.name.toUpperCase()} plan`
  }

  // Determine Status Indicators
  let statusBadge: { label: string, color: string } | null = null
  let showWarning = false
  
  if (!isFree) {
    if (daysRemaining <= 0) {
      statusBadge = { label: "Expired", color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400" }
    } else if (daysRemaining <= 7) {
      statusBadge = { label: "Expiring Soon", color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400" }
      showWarning = true
    } else {
      statusBadge = { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400" }
    }
  }

  return (
    <div className="space-y-3">
      {/* Expiry Warning Alert Box */}
      {showWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">Subscription Notice: </span>
              <span className="text-amber-800 dark:text-amber-300">Your subscription plan requires renewal soon to avoid service interruption.</span>
            </div>
          </div>
          <Button asChild size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0 font-semibold shadow-xs">
            <Link href="/owner/settings?tab=billing">
              Renew Plan <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Main Status Card - Executive Ribbon */}
      <Card className={cn(
        "rounded-2xl border overflow-hidden relative shadow-xs bg-card transition-all",
        isTrial ? "border-primary/40 bg-gradient-to-r from-card via-primary/5 to-card" : "border-border/70"
      )}>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Section 1: Plan Status & Expiry */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "p-2.5 rounded-xl shrink-0",
                isTrial
                  ? "bg-primary/10 text-primary"
                  : isPro
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-secondary text-foreground"
              )}>
                {isTrial ? <Zap className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">Organization Tier:</span>
                  <span className="text-xs font-semibold text-primary">{planMessage}</span>
                  {statusBadge && (
                    <Badge variant="outline" className={cn("font-bold px-2 py-0 text-[10px] rounded-full", statusBadge.color)}>
                      {statusBadge.label}
                    </Badge>
                  )}
                </div>

                {!isFree && data.subscription_expires_at && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>Expires: <strong className="text-foreground">{new Date(data.subscription_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="font-semibold text-foreground tabular-nums font-mono">{daysRemaining} days remaining</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Quota Indicators & CTA */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-border/60 pt-3 lg:pt-0 lg:pl-6 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">Crew:</span>
                <span className="font-bold text-foreground font-mono tabular-nums">
                  {plan.employee_limit === null ? "Unlimited" : `${usage.employees} / ${plan.employee_limit}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium">SKUs:</span>
                <span className="font-bold text-foreground font-mono tabular-nums">
                  {plan.max_inventory_items === null ? "Unlimited" : `${usage.inventory_items} / ${plan.max_inventory_items}`}
                </span>
              </div>

              {/* Action Button: routes directly to Settings Plan & Billing tab */}
              <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold rounded-xl shrink-0 ml-auto lg:ml-2 border-border/80 hover:bg-secondary">
                <Link href="/owner/settings?tab=billing">
                  Manage Subscription
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
