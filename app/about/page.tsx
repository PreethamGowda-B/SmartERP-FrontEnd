"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, ShieldCheck, Users, ArrowRight, UserCheck } from "lucide-react"

export default function AboutPage() {
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
              <Link href="/auth/login?mode=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6">About SmartERP</h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
          SmartERP is built by Prozync Innovations to empower construction companies, service contractors, and field workforce operators with real-time field telemetry, automated payroll, and seamless customer service portals.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
            <Link href="/auth/login?mode=signup">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-muted font-semibold">
            <Link href="/customer/landing">
              <UserCheck className="mr-2 h-5 w-5 text-primary" />
              Customer Portal
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
