"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, CheckCircle2, Zap, Clock, ShieldCheck, ArrowRight, Minus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

declare global {
  interface Window {
    Razorpay: any
  }
}

type PlanInfo = {
  id: number
  name: string
  is_trial: boolean
  days_remaining: number
  employee_limit: number | null
  max_inventory_items: number | null
  max_active_jobs: number | null
  max_storage_bytes: number | null
  subscription_status?: string
  features: Record<string, boolean>
}

type PlanOption = {
  id: number
  name: string
  plan_key: string
  price_monthly: number
  price_yearly: number
  employee_limit: number | null
  max_inventory_items: number | null
  max_active_jobs: number | null
  max_storage_bytes: number | null
  features: Record<string, boolean>
}

const BILLING_FEATURE_LABELS: Record<string, string> = {
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

function formatStorageLimit(bytes: number | null) {
  if (bytes == null) return "Unlimited file storage"
  if (bytes >= 1024 ** 3) return `${Math.round(bytes / 1024 ** 3)} GB file storage`
  return `${Math.round(bytes / 1024 ** 2)} MB file storage`
}

function formatStorageUsage(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

type UsageInfo = { employees: number, inventory_items: number, storage_bytes: number }
type SubscriptionPayment = {
  id: string; purpose: string; plan_id: number; billing_cycle: string
  amount_paise: number | string; currency: string; status: string
  provider_status?: string | null; razorpay_order_id: string
  razorpay_payment_id?: string | null; captured_at?: string | null
  created_at: string; attempts: Array<{ status: string; created_at: string }>
}

export function BillingView() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [trialEligible, setTrialEligible] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState("active")
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)
  const [paymentHistory, setPaymentHistory] = useState<SubscriptionPayment[]>([])

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await apiClient("/api/subscription/status")
        setPlan(res.plan)
        setUsage(res.usage)
        setTrialEligible(Boolean(res.trial_eligible))
        setSubscriptionStatus(res.subscription_status || "active")
        const catalog = await apiClient("/api/subscription/plans")
        setPlans(Array.isArray(catalog) ? catalog : [])
        const payments = await apiClient("/api/subscription/payments")
        setPaymentHistory(Array.isArray(payments) ? payments : [])
      } catch (err) {
        logger.error("Failed to fetch billing status", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  const renderProgress = (used: number, limit: number | null) => {
    if (limit === null) return <Progress value={100} className="h-2 opacity-50 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-500" />
    const pct = Math.min((used / limit) * 100, 100)
    let colorClass = "[&>div]:bg-indigo-600"
    if (pct > 90) colorClass = "[&>div]:bg-rose-500"
    else if (pct > 75) colorClass = "[&>div]:bg-amber-500"
    
    return <Progress value={pct} className={`h-2 ${colorClass}`} />
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "₹0"
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
  }

  const handleUpgrade = async (planId: number) => {
    if (upgrading) return
    setUpgrading(true)

    try {
      const billingCycle = isAnnual ? 'yearly' : 'monthly'
      
      const orderRes = await apiClient("/api/subscription/create-order", {
        method: "POST",
        body: JSON.stringify({ planId, billingCycle })
      })

      if (!orderRes.id) {
        throw new Error(orderRes.message || "Failed to create order")
      }

      const options = {
        key: orderRes.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "SmartERP",
        description: `Upgrade to ${plans.find(p => p.id === planId)?.name || 'Professional'} Plan`,
        order_id: orderRes.id,
        notes: {
          companyId: user?.company_id,
          planId: planId.toString(),
          billingCycle,
          userId: user?.id
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await apiClient("/api/subscription/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                billingCycle
              })
            })

            if (verifyRes.ok || verifyRes.success) {
              toast({
                title: "Upgrade Successful! 🎉",
                description: "Your plan has been upgraded. Redirecting...",
              })
              window.dispatchEvent(new CustomEvent("subscription-activated"))
              router.push("/owner/billing?payment=verified")
            } else {
              throw new Error(verifyRes.message || "Verification failed")
            }
          } catch (err: any) {
            logger.error("[Razorpay] Payment verification handler catch:", err)
            router.push(`/owner/payment-success?order_id=${response?.razorpay_order_id || 'N/A'}&payment_id=${response?.razorpay_payment_id || 'N/A'}&plan_id=${planId}&billing_cycle=${billingCycle}&signature=${response?.razorpay_signature || ''}`)
          } finally {
            setUpgrading(false)
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#4f46e5",
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response: any) => {
        toast({ title: "Payment not completed", description: response?.error?.description || "No subscription change was made.", variant: "destructive" })
        setUpgrading(false)
      })
      rzp.open()

    } catch (err: any) {
      logger.error("Upgrade error:", err)
      toast({
        title: "Upgrade Error",
        description: err.message || "Failed to initiate upgrade process.",
        variant: "destructive"
      })
    } finally {
      setUpgrading(false)
    }
  }

  const handleStartTrial = async () => {
    if (upgrading || !trialEligible) return
    setUpgrading(true)
    try {
      const order = await apiClient("/api/subscription/trial/create-order", { method: "POST", body: JSON.stringify({}) })
      if (!order?.id || !order?.key) throw new Error(order?.message || "Trial payment is unavailable")
      const checkout = new window.Razorpay({
        key: order.key, order_id: order.id, amount: order.amount, currency: order.currency,
        name: "SmartERP", description: "One-time ₹1 payment for a 30-day Enterprise trial",
        prefill: { name: user?.name, email: user?.email }, theme: { color: "#4f46e5" },
        handler: async (response: any) => {
          try {
            const verified = await apiClient("/api/subscription/trial/verify-payment", {
              method: "POST", body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })
            if (!verified?.success) throw new Error(verified?.message || "Payment verification is pending")
            window.dispatchEvent(new CustomEvent("subscription-activated"))
            toast({ title: "30-day trial activated", description: "Your ₹1 payment was verified. The trial will not automatically renew." })
            const status = await apiClient("/api/subscription/status")
            setPlan(status.plan)
            setUsage(status.usage)
            setTrialEligible(Boolean(status.trial_eligible))
            setSubscriptionStatus(status.subscription_status || "trial")
          } catch (error: any) {
            toast({ title: "Trial payment verification pending", description: error?.message || "Refresh billing status or retry verification.", variant: "destructive" })
          } finally { setUpgrading(false) }
        },
        modal: { ondismiss: () => setUpgrading(false) }
      })
      checkout.on("payment.failed", (response: any) => {
        toast({ title: "Payment not completed", description: response?.error?.description || "The trial was not activated.", variant: "destructive" })
        setUpgrading(false)
      })
      checkout.open()
    } catch (error: any) {
      toast({ title: "Unable to start trial", description: error?.message || "Trial payment is not available.", variant: "destructive" })
      setUpgrading(false)
    }
  }

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="space-y-10 animate-in fade-in duration-700 pb-10 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent mb-1">
              Subscription & Billing
            </h2>
            <p className="text-muted-foreground text-sm">
              Manage your subscription and view your real-time company usage quotas.
            </p>
          </div>
          
          <div className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 p-1.5 rounded-full inline-flex items-center transition-colors shadow-inner self-start">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${!isAnnual ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${isAnnual ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              Yearly <span className="ml-1 text-[10px] uppercase font-bold text-emerald-200 bg-emerald-600/20 px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {trialEligible && (
          <Card className="border-indigo-200 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/30">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold">Start a 30-day Enterprise trial</h3>
                <p className="mt-1 text-sm text-muted-foreground">Pay ₹1 once to activate. It does not automatically renew or charge a paid plan.</p>
                <p className="mt-1 text-xs text-muted-foreground">Refund terms are not configured in the current billing system; confirm the published policy before launch.</p>
              </div>
              <Button onClick={handleStartTrial} disabled={upgrading} className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700">
                {upgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Pay ₹1 and start trial
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Plan Overview Card */}
        {plan && (
          <Card className="border-2 border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-100/20 dark:shadow-indigo-900/10 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-2 h-full ${plan.is_trial ? 'bg-amber-500' : 'bg-indigo-600'}`}></div>
            <CardHeader className="bg-muted/30 pb-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-3">
                    Current Plan: <span className="text-indigo-600 dark:text-indigo-400 font-black">{plan.name}</span>
                    {plan.is_trial && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-3 py-1 text-xs">
                         <Clock className="w-3.5 h-3.5 mr-1.5" />
                         Trial ends in {plan.days_remaining} {plan.days_remaining === 1 ? 'day' : 'days'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1.5">
                    {plan.is_trial 
                      ? "Your ₹1 payment activated this 30-day Enterprise trial; it will not auto-renew."
                      : "You are on an active subscription plan."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-full border shadow-xs text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Status: {plan.is_trial ? "Trial active" : subscriptionStatus === "pending_trial_payment" ? "Starter · trial payment not made" : subscriptionStatus}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground flex items-center gap-2">
                        Users / Employees
                    </span>
                    <span><span className="font-bold text-foreground">{usage?.employees || 0}</span> / {plan.employee_limit === null ? 'Unlimited' : plan.employee_limit}</span>
                  </div>
                  {renderProgress(usage?.employees || 0, plan.employee_limit)}
                  <p className="text-[11px] text-muted-foreground">Active team members registered to your company.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground flex items-center gap-2">
                        Inventory Items
                    </span>
                    <span><span className="font-bold text-foreground">{usage?.inventory_items || 0}</span> / {plan.max_inventory_items === null ? 'Unlimited' : plan.max_inventory_items}</span>
                  </div>
                  {renderProgress(usage?.inventory_items || 0, plan.max_inventory_items)}
                  <p className="text-[11px] text-muted-foreground">Total distinct items in your inventory catalog.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground flex items-center gap-2">File storage</span>
                    <span><span className="font-bold text-foreground">{formatStorageUsage(usage?.storage_bytes || 0)}</span> / {plan.max_storage_bytes === null ? 'Unlimited' : formatStorageLimit(plan.max_storage_bytes).replace(' file storage', '')}</span>
                  </div>
                  {plan.max_storage_bytes !== null && renderProgress(usage?.storage_bytes || 0, plan.max_storage_bytes)}
                  <p className="text-[11px] text-muted-foreground">Accounted file uploads and employee documents.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Comparison Board */}
        <div>
           <div className="text-center mb-8">
               <h3 className="text-xl font-bold">Choose the right plan for your business</h3>
               <p className="text-muted-foreground text-xs mt-1">No hidden fees, no surprise charges.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
             {plans.map((p) => {
               const isCurrent = plan && !plan.is_trial && plan.id === p.id;
               const isProTrial = plan?.is_trial && p.id === 3;
               const price = isAnnual ? p.price_yearly : p.price_monthly;
               const limitSummary = p.employee_limit === null ? "Unlimited employees" : `Up to ${p.employee_limit} employees`;
               
               return (
                 <motion.div 
                    key={p.id}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                 >
                    <Card className={`relative h-full flex flex-col ${p.id === 2 ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-600/10' : 'border border-border'}`}>
                        {p.id === 2 && (
                            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Most Popular
                            </div>
                        )}
                        
                        <CardHeader className="text-center pt-8 pb-5">
                            <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                              {p.name}
                            </CardTitle>
                            <CardDescription className="min-h-8 mt-1.5 text-xs">{limitSummary}</CardDescription>
                            <div className="mt-3 flex flex-col items-center justify-center">
                                <div className="flex items-end gap-1">
                                    <span className="text-3xl lg:text-4xl font-extrabold tracking-tighter">{formatPrice(price)}</span>
                                    {price > 0 && <span className="text-muted-foreground mb-1 font-medium text-xs">/ {isAnnual ? 'yr' : 'mo'}</span>}
                                </div>
                                {price > 0 && isAnnual && (
                                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 font-medium px-2 py-0.5 rounded mt-1.5">
                                        Equivalent to ~{formatPrice(Math.floor(p.price_yearly / 12))} / mo
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        
                        <CardContent className="flex-grow space-y-4 pt-2">
                            <ul className="space-y-2.5 text-xs">
                              <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>{p.employee_limit === null ? "Unlimited employees" : `${p.employee_limit} employee seats`}</span></li>
                              <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>{p.max_active_jobs === null ? "Unlimited active jobs" : `${p.max_active_jobs} active jobs`}</span></li>
                              <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>{p.max_inventory_items === null ? "Unlimited inventory items" : `${p.max_inventory_items} inventory items`}</span></li>
                              <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>{formatStorageLimit(p.max_storage_bytes)}</span></li>
                              {Object.entries(BILLING_FEATURE_LABELS).filter(([key]) => p.features?.[key] === true).map(([key, label]) => (
                                <li key={key} className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>{label}</span></li>
                              ))}
                              <li className="text-muted-foreground">Available modules are governed by the active company subscription and role permissions.</li>
                            </ul>
                        </CardContent>
                        
                        <CardFooter className="pt-4 pb-6">
                            {isCurrent ? (
                                <Button className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 shadow-none pointer-events-none cursor-default text-xs h-9" variant="secondary">
                                    Current Plan
                                </Button>
                            ) : isProTrial ? (
                                <Button className="w-full border-2 border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 pointer-events-none cursor-default shadow-none text-xs h-9">
                                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Trial Active
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => handleUpgrade(p.id)} 
                                    disabled={upgrading}
                                    className={`w-full text-white font-medium shadow-md text-xs h-9 ${p.id === 2 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900'}`}
                                >
                                    {upgrading ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <>
                                        {plan && p.id < plan.id ? "Downgrade" : "Upgrade"} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                      </>
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                 </motion.div>
               )
             })}
           </div>
        </div>

        <section className="mt-10 rounded-xl border bg-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold">Subscription payment history</h3>
          <p className="mt-1 text-xs text-muted-foreground">Provider-confirmed subscription orders and recorded payment attempts.</p>
          {paymentHistory.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No subscription payments recorded yet.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {paymentHistory.map((payment) => (
                <li key={payment.id} className="grid gap-2 py-3 text-xs sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{payment.purpose === "trial_activation" ? "30-day Enterprise trial" : `${plans.find((p) => p.id === payment.plan_id)?.name || `Plan ${payment.plan_id}`} · ${payment.billing_cycle}`}</p>
                    <p className="mt-1 break-all text-muted-foreground">Order {payment.razorpay_order_id}{payment.razorpay_payment_id ? ` · Payment ${payment.razorpay_payment_id}` : ""}</p>
                    <p className="mt-1 text-muted-foreground">{new Date(payment.captured_at || payment.created_at).toLocaleString()} · {payment.attempts?.length || 0} attempt(s)</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="font-semibold">{formatPrice(Number(payment.amount_paise) / 100)}</span>
                    <Badge variant={payment.status === "captured" ? "default" : "secondary"}>{payment.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Job Invoices Section */}
        <JobInvoicesSection />
      </div>
    </>
  )
}

function JobInvoicesSection() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await apiClient("/api/jobs/invoices/all")
        setInvoices(Array.isArray(data) ? data : [])
      } catch (err) {
        logger.error("Failed to load job invoices", err)
      } finally {
        setLoading(false)
      }
    }
    loadInvoices()
  }, [])

  return (
    <Card className="mt-8 border border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          Service Invoices
          <Badge variant="outline" className="ml-auto font-mono text-[11px]">
            Auto-retry Backoff: 3 Attempts Active
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">Generated invoices and billing records for completed service jobs.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading job invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            No job invoices generated yet. Click "Generate Invoice" on any completed job in the Jobs tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Generated Date</th>
                  <th className="py-3 px-4 text-right">PDF Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{inv.invoice_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{inv.job_title || 'Service Job'}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.customer_name || 'Client'}</td>
                    <td className="py-3 px-4 font-bold">₹{parseFloat(inv.total_amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{new Date(inv.generated_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {inv.pdf_url ? (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
                        >
                          Download Invoice PDF
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">PDF Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
