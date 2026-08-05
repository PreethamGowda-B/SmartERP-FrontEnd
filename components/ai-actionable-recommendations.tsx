"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Sparkles, Calendar, Wrench, ShieldAlert, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface AiActionableRecommendationsProps {
  machine: any
}

export function AiActionableRecommendations({ machine }: AiActionableRecommendationsProps) {
  const router = useRouter()

  if (!machine) return null

  const RECOMMENDATIONS = [
    {
      id: "rec1",
      title: "Schedule Preventive Maintenance (PM)",
      reason: "Machine Health at 72% due to repeated SV0401 Servo Overload alarms.",
      actionLabel: "Schedule PM in 7 Days",
      icon: Calendar,
      action: () => router.push(`/owner/jobs?create=true&machine_id=${machine.id}&service_type=preventive`),
    },
    {
      id: "rec2",
      title: "Reserve Spindle Cooling Fan Spare Part",
      reason: "Historical alarm frequency predicts cooling fan failure within 150 spindle hours.",
      actionLabel: "Reserve Fan Part",
      icon: Wrench,
      action: () => router.push(`/owner/inventory?reserve_machine_id=${machine.id}`),
    },
  ]

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-900/90 to-slate-900 text-white rounded-3xl border-indigo-700/50 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-300">
            Actionable AI Prescriptive Recommendations
          </h3>
        </div>
        <Badge className="bg-amber-400 text-slate-950 font-black">SmartERP Intelligence</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {RECOMMENDATIONS.map((rec) => {
          const IconComp = rec.icon
          return (
            <div key={rec.id} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <IconComp className="h-4 w-4" /> {rec.title}
                </div>
                <p className="text-xs text-slate-300">{rec.reason}</p>
              </div>
              <Button
                onClick={rec.action}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-9 rounded-xl gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> {rec.actionLabel}
              </Button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
