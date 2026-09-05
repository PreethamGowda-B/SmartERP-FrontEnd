"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Command,
  Table,
  Zap,
  ShieldCheck,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

const TOUR_STEPS = [
  {
    title: "Welcome to SmartERP 🚀",
    subtitle: "Your Enterprise Operating Intelligence System",
    description:
      "SmartERP brings together Inventory, HR, Payroll, Attendance, Tasks, and Approvals into a unified, high-performance workspace.",
    icon: Sparkles,
    badge: "Step 1 of 4",
    highlight: "Command Center HUD",
  },
  {
    title: "Global Command Palette (⌘K)",
    subtitle: "Navigate Anywhere in Milliseconds",
    description:
      "Press ⌘K at any time to open the global command palette. Search employees, jump to inventory items, trigger approvals, or run quick actions instantly.",
    icon: Command,
    badge: "Step 2 of 4",
    highlight: "Shortcut: ⌘K",
  },
  {
    title: "Enterprise Data Tables",
    subtitle: "Linear-Fast Tables with Saved Views",
    description:
      "Custom density toggles, instant column visibility, CSV/PDF exports, and saved layout views give you maximum productivity on large datasets.",
    icon: Table,
    badge: "Step 3 of 4",
    highlight: "Saved Layout Views",
  },
  {
    title: "Proactive AI Copilot (⌘I)",
    subtitle: "Your Live Business Operating Assistant",
    description:
      "Click the floating AI button or press ⌘I to ask questions about your payroll, inventory stockouts, or employee attendance in real time.",
    icon: Zap,
    badge: "Step 4 of 4",
    highlight: "AI Assistant: ⌘I",
  },
]

export function OnboardingTourModal() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user || !mounted) return

    const storageKey = `smarterp_onboarding_completed_${user.id || user.company_id}`
    const isCompleted = localStorage.getItem(storageKey)

    // Show onboarding modal automatically on first login if not completed
    if (!isCompleted) {
      const timer = setTimeout(() => setOpen(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [user, mounted])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = () => {
    if (user) {
      const storageKey = `smarterp_onboarding_completed_${user.id || user.company_id}`
      localStorage.setItem(storageKey, "true")
    }
    setOpen(false)
  }

  if (!mounted || !open) return null

  const step = TOUR_STEPS[currentStep]
  const IconComponent = step.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl">
        <div className="sr-only">
          <DialogTitle>SmartERP Onboarding Tour</DialogTitle>
          <DialogDescription>Step-by-step guide to get you started with SmartERP.</DialogDescription>
        </div>
        <div className="h-2 bg-linear-to-r from-primary via-emerald-500 to-accent" />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold text-primary">
              {step.badge}
            </Badge>
            <button
              onClick={handleComplete}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Skip Tour <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 text-center sm:text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto sm:mx-0">
                <IconComponent className="w-7 h-7 text-primary" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-foreground">{step.title}</h3>
                <p className="text-xs font-semibold text-primary mt-1">{step.subtitle}</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Feature Highlight: <strong className="text-foreground">{step.highlight}</strong></span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>

            <Button size="sm" onClick={handleNext} className="text-xs font-semibold btn-premium gap-1.5">
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  Get Started <CheckCircle2 className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
