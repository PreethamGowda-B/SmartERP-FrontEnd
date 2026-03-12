"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Clock, ArrowRight, ShieldCheck, Users, Box } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/apiClient"

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

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await apiClient("/api/subscription/status")
        setData(res)
      } catch (err) {
        console.error("Failed to fetch subscription status:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  if (loading || !data) {
    return null
  }

  const { plan, usage } = data

  let planMessage = ""
  let isPro = plan.name.toLowerCase() === "pro"
  
  if (plan.is_trial) {
    planMessage = "" // Handled specifically in JSX
  } else if (isPro) {
    // Backend doesn't store billing cycle yet, defaulting to Monthly
    const billingCycle = (data as any).billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'
    planMessage = `You are currently on the PRO plan (${billingCycle}).`
  } else {
    planMessage = `You are currently on the ${plan.name.toUpperCase()} plan.`
  }

  const formatLimit = (limit: number | null) => limit === null ? "Unlimited" : limit
  const isTrial = plan.is_trial

  return (
    <Card className={`border overflow-hidden relative shadow-sm hover:shadow-md transition-shadow ${isTrial ? 'border-indigo-100 dark:border-indigo-900/40' : 'border-border'}`}>
      {isTrial && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
      <CardContent className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Left Side: Plan Status */}
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-3 rounded-full shrink-0 ${isTrial ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            {isTrial ? <Zap className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div className="space-y-1 mt-0.5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Subscription Status
              {isTrial && (
                <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 px-2 py-0.5 rounded-full ml-1">
                  Trial
                </span>
              )}
            </h3>
            <p className="text-sm font-medium text-muted-foreground max-w-xl leading-relaxed">
              {isTrial ? (
                <>
                  🚀 Pro Trial Active — You are currently using the PRO plan (Trial).<br />
                  Trial ends in: {plan.days_remaining} days.
                </>
              ) : (
                planMessage
              )}
            </p>
            
            {/* Expiry Date (if applicable & not trial) */}
            {!isTrial && data.subscription_expires_at && (
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" />
                Renews: {new Date(data.subscription_expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Middle: Usage Stats */}
        <div className="flex sm:items-center gap-4 sm:gap-8 flex-col sm:flex-row flex-1 px-0 md:px-4 border-l-0 md:border-l border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto mt-2 md:mt-0 border-border">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center font-medium">
              <Users className="w-3 h-3 mr-1" /> Employees used:
            </span>
            <span className="text-sm font-bold block">
              {usage.employees} <span className="text-muted-foreground font-medium">/ {formatLimit(plan.employee_limit)}</span>
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center font-medium">
              <Box className="w-3 h-3 mr-1" /> Inventory used:
            </span>
            <span className="text-sm font-bold block">
              {usage.inventory_items} <span className="text-muted-foreground font-medium">/ {formatLimit(plan.max_inventory_items)}</span>
            </span>
          </div>
        </div>

        {/* Right Side: CTA Button */}
        <div className="w-full md:w-auto mt-2 md:mt-0 shrink-0">
          <Button asChild variant={isTrial ? "default" : "outline"} className={`w-full md:w-auto shadow-sm transition-all ${isTrial ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 hover:shadow-md' : ''}`}>
            <Link href="/owner/billing">
              Manage Subscription
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
