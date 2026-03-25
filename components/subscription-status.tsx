"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, ArrowRight, ShieldCheck, Users, Box, AlertCircle, Sparkles, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/apiClient"
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
  subscription_expires_at: string | null
}

export function SubscriptionStatus() {
  const [data, setData] = useState<SubscriptionStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchStatus() {
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

  if (loading) {
    return null
  }

  if (error || !data) {
    return (
      <Card className="border-border shadow-sm mb-6 bg-red-50/50 dark:bg-red-950/20">
        <CardContent className="p-5 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium text-sm">Unable to load subscription status.</span>
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
  
  if (isTrial) {
    planMessage = `🚀 Pro Trial Active — You are currently using the PRO plan (Trial).`
  } else if (isPro) {
    const billingCycle = (data as any).billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'
    planMessage = `You are currently on the PRO plan (${billingCycle}).`
  } else if (isBasic) {
    planMessage = `You are currently on the BASIC plan.`
  } else if (isFree) {
    planMessage = `You are currently on the FREE plan.`
  } else {
    planMessage = `You are currently on the ${plan.name.toUpperCase()} plan.`
  }

  // Determine Status Indicators
  let statusBadge: { label: string, color: string } | null = null
  let showWarning = false
  
  if (!isFree) {
    if (daysRemaining <= 0) {
      statusBadge = { label: "Expired", color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" }
    } else if (daysRemaining <= 7) {
      statusBadge = { label: "Expiring Soon", color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" }
      showWarning = true
    } else {
      statusBadge = { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" }
    }
  }

  // Visual text progress bar helper
  const renderUsageBar = (used: number, limit: number | null, label: string, icon: any) => {
    const Icon = icon

    if (limit === null) {
      return (
        <div className="space-y-1 w-full min-w-[140px]">
          <span className="text-xs text-muted-foreground flex items-center font-medium mb-1.5">
            <Icon className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> {label}
          </span>
          <div className="text-sm font-bold text-foreground">Unlimited</div>
        </div>
      )
    }

    const pct = Math.min((used / limit) * 100, 100)
    const totalBlocks = 10
    const filledBlocks = Math.round((pct / 100) * totalBlocks)
    const emptyBlocks = totalBlocks - filledBlocks
    const barStr = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks)

    return (
      <div className="space-y-1 w-full min-w-[140px]">
        <span className="text-xs text-muted-foreground flex items-center font-medium mb-1">
          <Icon className="w-3.5 h-3.5 mr-1.5" /> {label}
        </span>
        <div className="font-mono text-xs text-indigo-500 dark:text-indigo-400 tracking-widest leading-none mb-1 shadow-sm opacity-90 overflow-hidden">
          {barStr}
        </div>
        <span className="text-sm font-bold block">
          {used} / {limit} <span className="text-muted-foreground font-medium text-xs">used</span>
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      
      {/* Expiry Warning Alert Box */}
      {showWarning && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
            <div>
              <h4 className="text-orange-800 dark:text-orange-400 font-bold text-sm">Action Required</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300/90 mt-0.5">
                ⚠️ Your plan will expire soon. Renew to avoid service interruption and losing access to premium features.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto shrink-0 bg-orange-600 hover:bg-orange-700 text-white shadow-sm border-none">
            <Link href="/owner/billing">
              Renew Now <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Main Status Card */}
      <Card className={`border overflow-hidden relative shadow-sm hover:shadow-md transition-shadow ${isTrial ? 'border-indigo-200 dark:border-indigo-900/60' : 'border-border'}`}>
        {(isTrial || isPro) && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>}
        
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
            
            {/* Section 1: Plan Status */}
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-3 rounded-xl shrink-0 ${isTrial ? 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {isTrial ? <Zap className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
              <div className="space-y-1 mt-0.5 max-w-lg">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  Subscription Status
                  {statusBadge && (
                    <Badge variant="outline" className={`ml-2 font-bold px-2.5 py-0.5 shadow-sm text-xs ${statusBadge.color}`}>
                      {statusBadge.label}
                    </Badge>
                  )}
                </h3>
                <p className="text-sm font-medium text-muted-foreground whitespace-pre-line leading-relaxed">
                  {planMessage}
                </p>
                
                {!isFree && data.subscription_expires_at && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2.5">
                    <p className="text-xs text-muted-foreground flex items-center bg-zinc-100 dark:bg-zinc-900/80 px-2.5 py-1.5 rounded-md shadow-inner border border-zinc-200 dark:border-zinc-800">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-400 shrink-0" />
                      Your plan expires on: <strong className="ml-1.5 text-zinc-700 dark:text-zinc-300">
                        {new Date(data.subscription_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </strong>
                    </p>
                    <p className={`text-xs font-bold px-2 py-1 rounded-md ${daysRemaining <= 7 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      {daysRemaining} day{daysRemaining !== 1 && 's'} remaining
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Visual Usage Stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 xl:gap-8 flex-1 px-0 xl:px-4 border-l-0 xl:border-l border-t xl:border-t-0 pt-4 xl:pt-0 w-full xl:w-auto border-border">
              {renderUsageBar(usage.employees, plan.employee_limit, "Employees", Users)}
              {renderUsageBar(usage.inventory_items, plan.max_inventory_items, "Inventory", Box)}
            </div>

            {/* Section 3: CTA Button (Manage Subscription) */}
            <div className="w-full xl:w-auto mt-2 xl:mt-0 shrink-0 flex items-center justify-end">
              <Button asChild variant={showWarning ? "default" : "outline"} className={`w-full sm:w-auto shadow-sm transition-all font-semibold ${showWarning ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'}`}>
                <Link href="/owner/billing">
                  {showWarning ? "Renew Now" : "Manage Subscription"}
                </Link>
              </Button>
            </div>
          </div>

          {/* Section 4: Upsell logic for Free Plan */}
          {isFree && (
            <div className="mt-6 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/20 dark:to-purple-950/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed max-w-2xl">
                  Upgrade your plan to unlock premium features like AI Assistant, Payroll, and Location Tracking.
                </p>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-none">
                <Link href="/owner/billing">
                  Upgrade Plan <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
