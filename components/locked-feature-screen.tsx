"use client"

import React from "react"
import { Lock, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/contexts/subscription-context"

interface LockedFeatureScreenProps {
  featureTitle: string
  featureDescription: string
  requiredTier?: "basic" | "pro"
  benefits?: string[]
}

export function LockedFeatureScreen({
  featureTitle,
  featureDescription,
  requiredTier = "pro",
  benefits = [
    "AI Intelligence & Multi-Agent Assistant",
    "Executive Level Analytics & Insights",
    "Automated GST Reconciliation & Filing",
    "Full Payroll Processing & Direct Deposit",
    "CRM Sales Pipeline & Deal Automation",
    "Advanced Exportable Audit & Financial Reports",
  ],
}: LockedFeatureScreenProps) {
  const router = useRouter()
  const { isPro, isBasic } = useSubscription()

  // If user has required tier, render nothing (allows parent component to show feature)
  const isUnlocked = requiredTier === "basic" ? (isBasic || isPro) : isPro
  if (isUnlocked) return null

  const handleReturn = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/owner")
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-xl w-full bg-card border border-border/80 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-violet-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center mb-6 shadow-inner">
          <Lock className="w-10 h-10 text-amber-500 dark:text-amber-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2 mb-3">
          <span>{featureTitle}</span>
          <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
          🔒 {featureDescription}
        </p>

        {/* Benefits Grid */}
        <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 mb-8 text-left">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
            Upgrade to {requiredTier === "pro" ? "Pro Plan" : "Basic or Pro Plan"} to unlock:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-medium text-foreground">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleReturn}
            className="h-11 px-6 text-xs font-semibold"
          >
            Return to Dashboard
          </Button>

          <Button
            onClick={() => router.push(`/owner/billing?selected=${requiredTier}`)}
            className="h-11 px-8 text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg btn-premium gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade to {requiredTier === "pro" ? "Pro" : "Basic"} Now</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
