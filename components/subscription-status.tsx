"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Users,
  Package,
  AlertCircle,
  AlertTriangle,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { useSubscription } from "@/contexts/subscription-context"
import { cn } from "@/lib/utils"

export function SubscriptionStatus() {
  const { statusData: data, loading, error: subError, refreshSubscription } = useSubscription()

  if (loading) return null

  if (subError || !data) {
    return (
      <Card className="rounded-[20px] border border-border shadow-xs bg-muted/40">
        <CardContent className="p-3.5 flex items-center justify-between gap-2.5 text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Subscription status synchronizing.</span>
          </div>
          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => void refreshSubscription(true)}>
            Retry
          </Button>
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
  const daysRemaining = plan.days_remaining ?? 0

  let planMessage = ""
  const isExpired = !isFree && daysRemaining <= 0

  if (isExpired) {
    planMessage = `${plan.name.toUpperCase()} Plan (Expired)`
  } else if (isTrial) {
    planMessage = `${plan.name.toUpperCase()} Plan (Trial)`
  } else if (isPro) {
    const rawCycle = (data.billing_cycle || "").toLowerCase()
    const isYearly = rawCycle === "yearly" || rawCycle === "annual" || daysRemaining > 45
    const billingCycle = isYearly ? "Yearly" : "Monthly"
    planMessage = `ENTERPRISE Plan (${billingCycle})`
  } else if (isBasic) {
    planMessage = `PROFESSIONAL Plan`
  } else if (isFree) {
    planMessage = `STARTER Tier`
  } else {
    planMessage = `${plan.name.toUpperCase()} Plan`
  }

  // Determine Status Indicators
  let statusBadge: { label: string; color: string; icon: React.ReactNode } | null = null
  let showWarning = false

  if (!isFree) {
    if (daysRemaining <= 0) {
      statusBadge = {
        label: "Expired",
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
        icon: <AlertCircle className="h-3 w-3" />,
      }
    } else if (daysRemaining <= 7) {
      statusBadge = {
        label: "Expiring Soon",
        color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50",
        icon: <Clock className="h-3 w-3" />,
      }
      showWarning = true
    } else {
      statusBadge = {
        label: "Active",
        color: "bg-[#EAF8F0] text-[#059669] border-[#B7EBD0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
        icon: (
          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
          </svg>
        ),
      }
    }
  } else {
    statusBadge = {
      label: "Active",
      color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
      icon: <ShieldCheck className="h-3 w-3" />,
    }
  }

  // Expiry Date Formatting
  let expiryDateText = "Continuous"
  if (data.subscription_expires_at) {
    const expDate = new Date(data.subscription_expires_at)
    if (!isNaN(expDate.getTime())) {
      expiryDateText = expDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
  } else if (isTrial && data.trial_ends_at) {
    const trialDate = new Date(data.trial_ends_at)
    if (!isNaN(trialDate.getTime())) {
      expiryDateText = trialDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
  } else if (isFree) {
    expiryDateText = "Lifetime Free"
  }

  // Crew & SKU usage strings
  const crewLimitText =
    plan.employee_limit === null || plan.employee_limit === undefined
      ? "Unlimited"
      : `${usage?.employees ?? 0} / ${plan.employee_limit}`

  const skuLimitText =
    plan.max_inventory_items === null || plan.max_inventory_items === undefined
      ? "Unlimited"
      : `${usage?.inventory_items ?? 0} / ${plan.max_inventory_items}`

  return (
    <div className="space-y-3">
      {/* Expiry Warning Notice */}
      {showWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">Subscription Notice: </span>
              <span className="text-amber-800 dark:text-amber-300">
                Your subscription plan requires renewal soon to avoid service interruption.
              </span>
            </div>
          </div>
          <Button asChild size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl shrink-0 font-semibold shadow-xs">
            <Link href="/owner/settings?tab=billing">
              Renew Plan <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Main Subscription Card - Recreated according to reference image */}
      <Card className="rounded-[20px] border border-slate-200/90 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden relative dark:border-slate-800 dark:bg-card">
        {/* Subtle organic green background accent near bottom left (matching reference) */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-16 bg-gradient-to-tr from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent rounded-bl-[20px]" />
        <svg
          className="pointer-events-none absolute -bottom-0.5 -left-0.5 w-72 h-10 text-emerald-500/[0.07] dark:text-emerald-500/[0.04]"
          viewBox="0 0 280 40"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0 40 L0 18 Q60 5 130 25 T280 12 L280 40 Z" />
        </svg>

        <CardContent className="p-4 sm:px-6 sm:py-4.5 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            
            {/* 1. Left: Subscription icon, Organization tier, Plan name, Status */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF8F0] border border-[#D1F2E0] flex items-center justify-center shrink-0 dark:bg-emerald-950/40 dark:border-emerald-900/50 shadow-2xs">
                <ShieldCheck className="h-7 w-7 text-[#059669] dark:text-emerald-400" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 space-y-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block tracking-normal">
                  Organization Tier
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  {planMessage}
                </h3>
                <div>
                  {statusBadge && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs",
                        statusBadge.color
                      )}
                    >
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vertical separator 1 */}
            <div className="hidden lg:block w-px h-12 bg-slate-200/80 dark:bg-slate-800 shrink-0" />

            {/* 2. Middle: Expiration date and remaining days */}
            <div className="flex flex-col justify-center space-y-2 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF8F0] border border-[#D1F2E0] flex items-center justify-center shrink-0 text-[#059669] dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block leading-none">
                    Expires On
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight block mt-1">
                    {expiryDateText}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-0.5 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <div className="leading-none">
                  {daysRemaining > 0 ? (
                    <>
                      <span className="font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
                        {daysRemaining}
                      </span>{" "}
                      <span className="font-medium text-slate-500 dark:text-slate-400">days remaining</span>
                    </>
                  ) : isExpired ? (
                    <span className="font-bold text-rose-600 dark:text-rose-400">Plan expired</span>
                  ) : (
                    <span className="font-medium text-slate-500 dark:text-slate-400">Active</span>
                  )}
                </div>
              </div>
            </div>

            {/* Vertical separator 2 */}
            <div className="hidden lg:block w-px h-12 bg-slate-200/80 dark:bg-slate-800 shrink-0" />

            {/* 3. Section: Crew and SKU limits with separate icons */}
            <div className="flex flex-row sm:flex-row lg:flex-col gap-2 min-w-0">
              {/* Crew Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#EEF4FF] border border-blue-100/90 dark:bg-blue-950/20 dark:border-blue-900/40 min-w-[130px]">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 dark:bg-blue-900/50 dark:text-blue-400">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Crew</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {crewLimitText}
                  </span>
                </div>
              </div>

              {/* SKUs Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F8F2FD] border border-purple-100/90 dark:bg-purple-950/20 dark:border-purple-900/40 min-w-[130px]">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 dark:bg-purple-900/50 dark:text-purple-400">
                  <Package className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">SKUs</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {skuLimitText}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Right: Manage Subscription button */}
            <div className="flex items-center lg:pl-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              <Button
                asChild
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-semibold text-sm shadow-xs transition-all hover:shadow-md gap-2 cursor-pointer"
              >
                <Link href="/owner/settings?tab=billing">
                  <Settings className="h-4 w-4" />
                  <span>Manage Subscription</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
