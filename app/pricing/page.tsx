"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, CheckCircle, ArrowRight, UserCheck, Sparkles, Shield, Zap } from "lucide-react"

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small field crews and growing contractors.",
      price: "₹1,999",
      period: "/month",
      features: [
        "Up to 15 Field Technicians",
        "Real-Time GPS Time Tracking",
        "Job Scheduling & Dispatch",
        "Customer Service Portal",
        "Standard Email Support",
      ],
      cta: "Start 30-Day Free Trial",
      popular: false,
    },
    {
      name: "Professional",
      description: "Designed for scaling field service and construction enterprises.",
      price: "₹4,999",
      period: "/month",
      features: [
        "Up to 50 Field Technicians",
        "Automated Payroll & Overtime Logging",
        "Live Telemetry & Geofencing Alerts",
        "Customer Portal with Map Tracking",
        "AI Copilot & Smart Assistant",
        "24/7 Priority Support",
      ],
      cta: "Start 30-Day Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Custom capabilities for high-volume enterprise organizations.",
      price: "Custom",
      period: "",
      features: [
        "Unlimited Field Crews",
        "Dedicated Account Director",
        "Custom ERP Integrations & API Access",
        "White-Labeled Customer Portal",
        "Advanced Audit & Compliance Suite",
        "Custom SLA & Training",
      ],
      cta: "Contact Enterprise Sales",
      popular: false,
    },
  ]

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
          Transparent Pricing, No Hidden Fees
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
          Simple, Flexible Plans for <span className="text-blue-600">Every Scale</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Choose the right plan to command your field crews, automate payroll, and deliver real-time live updates to your clients.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-8 border flex flex-col justify-between transition-all duration-300 ${
                plan.popular
                  ? "bg-card border-blue-500 shadow-2xl ring-2 ring-blue-500/50 relative"
                  : "bg-card/60 border-border hover:border-blue-500/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                      <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className={`w-full font-bold text-sm ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Link href="/auth/login?mode=signup">
                  {plan.cta}
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
