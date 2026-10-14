"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, ArrowRight, ShieldCheck, Users, Box, AlertCircle, Sparkles, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { apiClient, getAccessToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

type SubscriptionStatusData = {
  plan: {
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

  const isPro = plan.name.toLowerCase() === "pro"
  const isBasic = plan.name.toLowerCase() === "basic"
  const isFree = plan.name.toLowerCase() === "free"
  const isTrial = plan.is_trial
  const daysRemaining = plan.days_remaining || 0

  let planMessage = ""
  const isExpired = !isFree && daysRemaining <= 0

  if (isExpired) {
    planMessage = `Your ${plan.name.toUpperCase()} plan has expired. Upgrade now to restore access.`
  } else if (isTrial) {
    planMessage = `Pro Trial Active — Full enterprise features enabled.`
  } else if (isPro) {
    const rawCycle = (data.billing_cycle || "").toLowerCase()
    const isYearly = rawCycle === "yearly" || rawCycle === "annual" || daysRemaining > 45
    const billingCycle = isYearly ? "Yearly" : "Monthly"
    planMessage = `PRO plan (${billingCycle})`
  } else if (isBasic) {
    planMessage = `BASIC plan`
  } else if (isFree) {
    planMessage = `FREE tier`
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
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-orange-800 dark:text-orange-400">Action Required: </span>
              <span className="text-orange-700 dark:text-orange-300">Your subscription expires soon. Renew to prevent disruption.</span>
            </div>
          </div>
          <Button asChild size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg shrink-0">
            <Link href="/owner/settings?tab=billing">
              Renew Now <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Main Status Card - Compact Layout */}
      <Card className={`border overflow-hidden relative shadow-xs ${isTrial ? 'border-indigo-200 dark:border-indigo-900/60' : 'border-border'}`}>
        {(isTrial || isPro) && (
          <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-indigo-500 to-purple-500" />
        )}
        
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Section 1: Plan Status & Expiry */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isTrial ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-muted text-foreground'}`}>
                {isTrial ? <Zap className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">Subscription Status:</span>
                  <span className="text-xs font-semibold text-primary">{planMessage}</span>
                  {statusBadge && (
                    <Badge variant="outline" className={`font-bold px-2 py-0 text-[10px] ${statusBadge.color}`}>
                      {statusBadge.label}
                    </Badge>
                  )}
                </div>

                {!isFree && data.subscription_expires_at && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>Expires: <strong className="text-foreground">{new Date(data.subscription_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="font-semibold text-foreground/80">{daysRemaining} days remaining</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Quota Badges */}
            <div className="flex items-center gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-border/60 pt-2.5 lg:pt-0 lg:pl-6 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-muted-foreground">Employees:</span>
                <span className="font-bold text-foreground">
                  {plan.employee_limit === null ? "Unlimited" : `${usage.employees} / ${plan.employee_limit}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-muted-foreground">Inventory:</span>
                <span className="font-bold text-foreground">
                  {plan.max_inventory_items === null ? "Unlimited" : `${usage.inventory_items} / ${plan.max_inventory_items}`}
                </span>
              </div>

              {/* Action Button: routes directly to Settings Plan & Billing tab */}
              <Button asChild size="sm" variant="outline" className="h-7 text-xs font-semibold rounded-lg shrink-0 ml-auto lg:ml-2">
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
