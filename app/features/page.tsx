"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Building2, Users, Clock, DollarSign, MessageSquare, MapPin,
  ShieldCheck, Zap, ArrowRight, UserCheck, Smartphone, CheckCircle
} from "lucide-react"

export default function FeaturesPage() {
  const features = [
    { icon: Users, title: "Crew Management", description: "Real-time workforce scheduling, role permissions, and active job dispatching across field teams." },
    { icon: Building2, title: "Job Tracking", description: "Monitor job progress, material requests, and field site updates live from start to finish." },
    { icon: Clock, title: "GPS Time Tracking", description: "Geofenced clock-in/out, automatic overtime logging, break audits, and timesheet exports." },
    { icon: DollarSign, title: "Automated Payroll", description: "Seamless wage computation, tax deductions, pay slip generation, and financial summaries." },
    { icon: MessageSquare, title: "Smart AI Copilot", description: "Instant answers for crew policies, schedule queries, material requests, and task updates." },
    { icon: MapPin, title: "Live Field Telemetry", description: "Real-time map tracking for field teams with geofencing alerts and location history." },
    { icon: ShieldCheck, title: "Enterprise Security", description: "Multi-tenant RBAC, end-to-end encryption, and fully compliant audit trails." },
    { icon: Zap, title: "Workflow Automation", description: "Automate recurring job assignments, instant SMS alerts, and client notifications." },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
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
              <Link href="/auth/login?mode=signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
          <Zap className="h-3.5 w-3.5" />
          Enterprise Field Intelligence
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
          Everything You Need to <span className="text-blue-600">Command Field Crews</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          From GPS time tracking to automated payroll and client live visibility, explore the full suite of SmartERP capabilities.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="p-6 rounded-2xl border border-border bg-card hover:border-blue-500/40 hover:shadow-xl transition-all duration-300">
                <div className="mb-4 p-3 bg-blue-500/10 rounded-xl w-fit">
                  <Icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-foreground mb-4">Ready to Modernize Your Operations?</h2>
          <p className="text-muted-foreground mb-8 text-sm">Join field service and construction leaders using SmartERP.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8">
              <Link href="/auth/login?mode=signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-muted font-semibold">
              <Link href="/customer/landing">
                <UserCheck className="mr-2 h-5 w-5 text-primary" />
                Customer Portal
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
