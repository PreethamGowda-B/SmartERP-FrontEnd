"use client"

import React from "react"
import { Users, Briefcase, Box, HardDrive, Bot, Sparkles, ArrowRight, ShieldAlert, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/contexts/subscription-context"

export interface LimitModalData {
  limitType: "employee" | "job" | "inventory" | "storage" | "ai_messages"
  currentCount: number
  maxLimit: number
  title?: string
  currentPlan?: string
  onUnlockedResume?: () => void
}

interface PlanLimitModalProps {
  isOpen: boolean
  onClose: () => void
  data: LimitModalData
}

export function PlanLimitModal({ isOpen, onClose, data }: PlanLimitModalProps) {
  const router = useRouter()
  const { isBasic, isFree } = useSubscription()

  const limitIcons = {
    employee: Users,
    job: Briefcase,
    inventory: Box,
    storage: HardDrive,
    ai_messages: Bot,
  }

  const limitLabels = {
    employee: "Employees",
    job: "Active Jobs",
    inventory: "Inventory Items",
    storage: "Storage Space",
    ai_messages: "Daily AI Messages",
  }

  const Icon = limitIcons[data.limitType] || ShieldAlert
  const label = limitLabels[data.limitType] || "Usage"
  const title = data.title || `${label} Limit Reached`

  const formatValue = (val: number) => {
    if (data.limitType === "storage") {
      const mb = Math.round(val / (1024 * 1024))
      return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
    }
    return String(val)
  }

  const handleUpgrade = (tier: "basic" | "pro") => {
    onClose()
    router.push(`/owner/billing?selected=${tier}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border border-border/80 shadow-2xl bg-card">
        <div className="sr-only">
          <DialogTitle>Plan Limit Reached</DialogTitle>
          <DialogDescription>You have reached the limit for your current subscription plan.</DialogDescription>
        </div>
        {/* Top Decorative Amber Banner */}
        <div className="h-3 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600" />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
                {title}
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Your current {data.currentPlan || "Free"} Plan limit has been exhausted
              </p>
            </div>
          </div>

          {/* Current Usage Progress Card */}
          <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-wider">Current Usage:</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                {formatValue(data.currentCount)} / {formatValue(data.maxLimit)} {label}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full w-full animate-pulse" />
            </div>
          </div>

          {/* Recommendation Description */}
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3.5 rounded-xl border border-border/40">
            {data.limitType === "employee" && "Upgrade to Basic (up to 50 employees) or Pro (unlimited workforce) to continue expanding your company."}
            {data.limitType === "job" && "Upgrade to Basic (up to 100 jobs) or Pro (unlimited active jobs) to manage higher task volumes."}
            {data.limitType === "inventory" && "Upgrade to Basic (up to 500 items) or Pro (unlimited inventory) to track all products and supplies."}
            {data.limitType === "storage" && "Upgrade to Basic (5 GB) or Pro (100 GB) to upload more documents and receipts."}
            {data.limitType === "ai_messages" && "Upgrade to Basic (300 msgs/day) or Pro (unlimited AI) for continuous SmartERP AI assistance."}
          </p>

          {/* Key Upgrade Benefits */}
          <div className="space-y-1.5 pt-1">
            <h4 className="text-[11px] font-bold text-foreground tracking-wide uppercase">Upgrade benefits:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-foreground">
              {[
                "⚡ Instant Limit Extension",
                "💳 Full Payroll & Payslips",
                "📍 Live GPS Tracking",
                "📈 PDF & Excel Data Exports",
                "🤖 Specialist AI Assistants",
                "🔄 Auto-Resume Interrupted Action",
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
            {isFree && (
              <Button
                onClick={() => handleUpgrade("basic")}
                className="w-full h-10 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md gap-2"
              >
                <span>Upgrade to Basic Plan</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            )}

            <Button
              onClick={() => handleUpgrade("pro")}
              className="w-full h-11 text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg btn-premium gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Upgrade to Pro Plan (Unlimited)</span>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
