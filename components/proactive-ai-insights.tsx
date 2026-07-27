"use client"

import * as React from "react"
import { Sparkles, ArrowRight, ShieldAlert, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface ProactiveInsight {
  id: string
  type: "warning" | "opportunity" | "risk" | "optimization"
  category: "inventory" | "payroll" | "attendance" | "job"
  headline: string
  description: string
  actionLabel: string
  actionHref?: string
  savingsOrRisk?: string
}

export function ProactiveAIInsights() {
  const [insights, setInsights] = React.useState<ProactiveInsight[]>([
    {
      id: "ins-1",
      type: "risk",
      category: "inventory",
      headline: "Inventory Stock Runout Alert",
      description: "Raw Steel Beams & Concrete Mix are projected to run out in 4 days based on current consumption velocity.",
      actionLabel: "Reorder Supplier Materials",
      savingsOrRisk: "Prevents $4,500 Downtime Risk",
    },
    {
      id: "ins-2",
      type: "opportunity",
      category: "payroll",
      headline: "Payroll Cost Optimization",
      description: "Overtime expenses increased 12% this cycle. Shift rebalancing can reduce overall payroll costs by $2,100.",
      actionLabel: "Optimize Shifts",
      savingsOrRisk: "Saves $2,100 / month",
    },
    {
      id: "ins-3",
      type: "warning",
      category: "job",
      headline: "Job #104 Completion Risk",
      description: "Electrical Wiring assignment is 2 days behind milestone schedule. Reassigning 1 technician will restore timeline.",
      actionLabel: "Reassign Technician",
      savingsOrRisk: "Milestone at Risk",
    },
  ])

  const [activeIndex, setActiveIndex] = React.useState(0)
  const current = insights[activeIndex]

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % insights.length)
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "risk":
        return {
          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
        }
      case "opportunity":
        return {
          badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
        }
      default:
        return {
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        }
    }
  }

  const style = getTypeStyle(current.type)

  return (
    <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5 shadow-xs overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", style.badge)}>
                {current.type}
              </Badge>
              <span className="font-bold text-sm tracking-tight text-foreground">{current.headline}</span>
              {current.savingsOrRisk && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {current.savingsOrRisk}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {current.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button size="sm" className="h-8 text-xs font-semibold btn-premium gap-1.5" onClick={handleNext}>
            <span>{current.actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleNext}
            title="Next Insight"
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
