"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, CheckCircle, ArrowRight, UserCheck, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/apiClient"

type PricingPlan = {
  id: number; plan_key: string; name: string; price_monthly: number; price_yearly: number
  employee_limit: number | null; max_active_jobs: number | null; max_inventory_items: number | null
  max_storage_bytes: number | null; features: Record<string, boolean>
}

const FEATURE_LABELS: Record<string, string> = {
  messages: "Messaging",
  basic_reports: "Basic reports",
  export_reports: "Report exports",
  payroll: "Payroll",
  ai_assistant: "AI assistant",
  advanced_reports: "Advanced reports and analytics",
  inventory_images: "Inventory image uploads",
  location_tracking: "Location tracking",
  ar_collections: "Accounts receivable collections",
  inventory_forecasts: "Inventory forecasting",
}

function formatStorage(bytes: number | null) {
  if (bytes == null) return "Unlimited file storage"
  if (bytes >= 1024 ** 3) return `${Math.round(bytes / 1024 ** 3)} GB file storage`
  return `${Math.round(bytes / 1024 ** 2)} MB file storage`
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [annual, setAnnual] = useState(false)
  const [catalogError, setCatalogError] = useState(false)

  useEffect(() => {
    let active = true
    apiClient("/api/subscription/plans")
      .then((rows) => { if (active && Array.isArray(rows)) setPlans(rows) })
      .catch(() => { if (active) setCatalogError(true) })
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="p-2 bg-blue-600 rounded-xl shadow-md">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              SmartERP<span className="text-blue-500">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login?mode=login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
              <Link href="/auth/login?mode=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          SmartERP Subscription Plans
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
          Plans for <span className="text-blue-600">Every Business</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Compare current plan prices and employee capacity. Feature access also depends on the user's role and the server-verified company subscription.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="inline-flex rounded-full border bg-card p-1">
            <button type="button" onClick={() => setAnnual(false)} className={`rounded-full px-4 py-2 text-sm ${!annual ? "bg-blue-600 text-white" : "text-muted-foreground"}`}>Monthly</button>
            <button type="button" onClick={() => setAnnual(true)} className={`rounded-full px-4 py-2 text-sm ${annual ? "bg-blue-600 text-white" : "text-muted-foreground"}`}>Annual</button>
          </div>
          <p className="max-w-2xl text-center text-xs text-muted-foreground">New eligible companies can activate an Enterprise trial with a one-time ₹1 payment for 30 days. It does not auto-renew. Refund terms are not configured in the current billing setup; contact SmartERP before paying if you need that information.</p>
        </div>
        {catalogError && <p role="alert" className="mb-6 text-center text-sm text-red-600">Live plan pricing is temporarily unavailable. Please retry later.</p>}
        {!plans.length && !catalogError && <p className="mb-6 text-center text-sm text-muted-foreground">Loading current plans…</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 border flex flex-col justify-between transition-all duration-300 ${
                plan.id === 2
                  ? "bg-card border-blue-500 shadow-2xl ring-2 ring-blue-500/50 relative"
                  : "bg-card/60 border-border hover:border-blue-500/30"
              }`}
            >
              {plan.id === 2 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-6">{plan.id === 1 ? "For a small team getting started." : plan.id === 2 ? "For businesses scaling daily ERP operations." : "For organizations requiring the highest standard plan."}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(annual ? plan.price_yearly : plan.price_monthly)}</span>
                  {(annual ? plan.price_yearly : plan.price_monthly) > 0 && <span className="text-sm text-muted-foreground">/{annual ? "year" : "month"}</span>}
                </div>
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-2.5 text-xs text-foreground font-medium"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /><span>{plan.employee_limit === null ? "Unlimited employees" : `Up to ${plan.employee_limit} employees`}</span></div>
                  <div className="flex items-start gap-2.5 text-xs text-foreground font-medium"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /><span>{plan.max_active_jobs === null ? "Unlimited active jobs" : `Up to ${plan.max_active_jobs} active jobs`}</span></div>
                  <div className="flex items-start gap-2.5 text-xs text-foreground font-medium"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /><span>{plan.max_inventory_items === null ? "Unlimited inventory items" : `Up to ${plan.max_inventory_items} inventory items`}</span></div>
                  <div className="flex items-start gap-2.5 text-xs text-foreground font-medium"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /><span>{formatStorage(plan.max_storage_bytes)}</span></div>
                  {Object.entries(FEATURE_LABELS).filter(([key]) => plan.features?.[key] === true).map(([key, label]) => (
                    <div key={key} className="flex items-start gap-2.5 text-xs text-foreground font-medium"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /><span>{label}</span></div>
                  ))}
                  <p className="text-xs text-muted-foreground">Module access depends on the active subscription and each user's role.</p>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className={`w-full font-bold text-sm ${
                  plan.id === 2
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Link href="/auth/login?mode=signup">
                  {plan.id === 1 ? "Create Starter account" : "Create account and view billing"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Portal Banner */}
      <section className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Looking for the Customer Portal?</h3>
            <p className="text-muted-foreground text-sm">Access your service request status and live technician tracking.</p>
          </div>
          <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-muted font-semibold">
            <Link href="/customer/landing">
              <UserCheck className="mr-2 h-5 w-5 text-primary" />
              Access Customer Portal
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
