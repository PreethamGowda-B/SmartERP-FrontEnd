"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Building2, User, Bell, Shield, Globe, SettingsIcon, Copy, Users, Loader2, Eye, EyeOff, Sparkles, CheckCircle2, Zap, Clock, ShieldCheck, ArrowRight, Minus } from "lucide-react"
import Link from "next/link"
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
  features: Record<string, boolean>
}

type UsageInfo = { employees: number, inventory_items: number }

export default function BillingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [isAnnual, setIsAnnual] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await apiClient("/api/subscription/status")
        setPlan(res.plan)
        setUsage(res.usage)
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
      <OwnerLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </OwnerLayout>
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

  const plans = [
    {
      id: 1, name: "Free", limitText: "For small teams starting out", price: 0,
      features: ["Up to 15 employees", "Up to 30 inventory items", "Basic reporting", "Job Management"],
      missing: ["No AI Assistant", "No Payroll Generation", "No Location Tracking", "30-day message history"]
    },
    {
      id: 2, name: "Basic", limitText: "For growing businesses", price: isAnnual ? 9990 : 999,
      features: ["Up to 50 employees", "Up to 200 inventory items", "Location Tracking", "Payroll Generation", "Advanced Reports & Exports", "90-day message history"],
      missing: ["No AI Assistant", "No priority support"]
    },
    {
      id: 3, name: "Pro", limitText: "For scale and maximum impact", price: isAnnual ? 24990 : 2499,
      features: ["Unlimited employees", "Unlimited inventory items", "Smart AI Assistant", "Location Tracking", "Payroll Generation", "Advanced Reports & Exports", "Priority 24/7 Support", "Unlimited message history"],
      missing: [],
      popular: true
    }
  ]

  const formatPrice = (price: number) => {
    if (price === 0) return "Free"
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
  }

  const handleUpgrade = async (planId: number) => {
    if (upgrading) return
    setUpgrading(true)

    try {
      const billingCycle = isAnnual ? 'yearly' : 'monthly'
      
      // 1. Create Order on Backend
      const orderRes = await apiClient("/api/subscription/create-order", {
        method: "POST",
        body: JSON.stringify({ planId, billingCycle })
      })

      if (!orderRes.id) {
        throw new Error(orderRes.message || "Failed to create order")
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "SmartERP",
        description: `Upgrade to ${plans.find(p => p.id === planId)?.name || 'Basic'} Plan`,
        order_id: orderRes.id,
        notes: {
          companyId: user?.company_id,
          planId: planId.toString(),
          billingCycle,
          userId: user?.id
        },
        handler: async function (response: any) {
          try {
            // 3. Verify Payment on Backend
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

            if (verifyRes.ok) {
              toast({
                title: "Upgrade Successful! 🎉",
                description: `Your plan has been upgraded. Redirecting...`,
              })
              router.push("/owner/payment-success")
            } else {
              throw new Error(verifyRes.message || "Verification failed")
            }
          } catch (err: any) {
            logger.error("Payment verification failed", err)
            // Background webhook will finalize it if direct verification fails
            router.push("/owner/payment-success")
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

  return (
    <OwnerLayout>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="space-y-10 animate-in fade-in duration-700 pb-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent mb-2">
              Plans & Billing
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your subscription and view your current usage.
            </p>
          </div>
          
          <div className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 p-1.5 rounded-full inline-flex items-center transition-colors shadow-inner self-start">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${!isAnnual ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isAnnual ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              Yearly <span className="ml-1 text-[10px] uppercase font-bold text-emerald-200 bg-emerald-600/20 px-1.5 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Current Plan Overview Card */}
        {plan && (
          <Card className="border-2 border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-100/20 dark:shadow-indigo-900/10 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-2 h-full ${plan.is_trial ? 'bg-amber-500' : 'bg-indigo-600'}`}></div>
            <CardHeader className="bg-muted/30 pb-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    Current Plan: <span className="text-indigo-600 dark:text-indigo-400 font-black">{plan.name}</span>
                    {plan.is_trial && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-3 py-1">
                         <Clock className="w-3.5 h-3.5 mr-1.5" />
                         Trial ends in {plan.days_remaining} {plan.days_remaining === 1 ? 'day' : 'days'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {plan.is_trial 
                      ? "You are currently experiencing all our premium features for free." 
                      : "You are on a regular subscription."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 px-4 py-2 rounded-full border shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">Status: Active</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-muted-foreground flex items-center gap-2">
                        Users / Employees
                    </span>
                    <span><span className="font-bold text-foreground">{usage?.employees || 0}</span> / {plan.employee_limit === null ? 'Unlimited' : plan.employee_limit}</span>
                  </div>
                  {renderProgress(usage?.employees || 0, plan.employee_limit)}
                  <p className="text-xs text-muted-foreground">Active team members registered to your company.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-muted-foreground flex items-center gap-2">
                        Inventory Items
                    </span>
                    <span><span className="font-bold text-foreground">{usage?.inventory_items || 0}</span> / {plan.max_inventory_items === null ? 'Unlimited' : plan.max_inventory_items}</span>
                  </div>
                  {renderProgress(usage?.inventory_items || 0, plan.max_inventory_items)}
                  <p className="text-xs text-muted-foreground">Total distinct items in your inventory catalog.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Comparison Board */}
        <div>
           <div className="text-center mb-8">
               <h2 className="text-2xl font-bold">Choose the right plan for your business</h2>
               <p className="text-muted-foreground mt-2">No hidden fees, no surprise charges.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
             {plans
                .map((p) => {
                  const isCurrent = plan && !plan.is_trial && plan.id === p.id;
               const isProTrial = plan?.is_trial && p.id === 3;
               
               return (
                 <motion.div 
                    key={p.id}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                 >
                    <Card className={`relative h-full flex flex-col ${p.popular ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-600/10' : 'border border-border'}`}>
                        {p.popular && (
                            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Most Popular
                            </div>
                        )}
                        
                        <CardHeader className="text-center pt-8 pb-6">
                            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                              {p.name}
                            </CardTitle>
                            <CardDescription className="min-h-10 mt-2 text-sm">{p.limitText}</CardDescription>
                            <div className="mt-4 flex flex-col items-center justify-center">
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl lg:text-5xl font-extrabold tracking-tighter">{formatPrice(p.price)}</span>
                                    {p.price > 0 && <span className="text-muted-foreground mb-1.5 font-medium">/ {isAnnual ? 'yr' : 'mo'}</span>}
                                </div>
                                {p.price > 0 && isAnnual && (
                                    <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 font-medium px-2 py-1 rounded mt-2">
                                        Equivalent to roughly {formatPrice(Math.floor(p.price / 12))} / mo
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        
                        <CardContent className="flex-grow space-y-6 pt-2">
                            <ul className="space-y-3 text-sm">
                                {p.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <span className="text-zinc-700 dark:text-zinc-300 font-medium leading-tight my-auto">{f}</span>
                                    </li>
                                ))}
                                {p.missing.map((m, i) => (
                                    <li key={`m-${i}`} className="flex items-start gap-3 opacity-60">
                                        <Minus className="w-5 h-5 text-zinc-400 shrink-0" />
                                        <span className="text-zinc-500 line-through leading-tight my-auto">{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        
                        <CardFooter className="pt-6 pb-8">
                            {isCurrent ? (
                                <Button className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 shadow-none pointer-events-none cursor-default" variant="secondary">
                                    Current Plan
                                </Button>
                            ) : isProTrial ? (
                                <Button className="w-full border-2 border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 pointer-events-none cursor-default shadow-none">
                                    <Clock className="w-4 h-4 mr-2" /> Trial Active
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => handleUpgrade(p.id)} 
                                    disabled={upgrading}
                                    className={`w-full text-white font-medium shadow-md ${p.popular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900'}`}
                                >
                                    {upgrading ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <>
                                        {plan && p.id > plan.id ? "Upgrade" : "Downgrade"} <ArrowRight className="w-4 h-4 ml-2" />
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

        <div className="mt-16 text-center space-y-4">
            <h3 className="text-lg font-semibold">Have more than 50 employees?</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
                Need customized solutions, dedicated support, or custom integrations for a large enterprise? 
            </p>
            <Button variant="outline" className="mt-2 relative overflow-hidden group">
                <span className="relative z-10 flex items-center">Contact Sales <Zap className="w-4 h-4 ml-2 text-amber-500" /></span>
                <span className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 mix-blend-multiply dark:mix-blend-lighten"></span>
            </Button>
        </div>
      </div>
    </OwnerLayout>
  )
}
