"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2, AlertCircle, PlayCircle, PauseCircle } from "lucide-react"

interface JobCardExecutionProps {
  status: string
  progress: number
  estimatedHours?: number
  actualHours?: number
  stage?: string
}

export function JobCardExecution({
  status,
  progress = 0,
  estimatedHours = 8,
  actualHours = 0,
  stage,
}: JobCardExecutionProps) {
  const currentProgress = Math.min(100, Math.max(0, progress))

  const stages = ["Open", "Assigned", "In Progress", "Completed"]
  const currentStageIndex =
    status === "completed" || status === "verified"
      ? 3
      : status === "active" || status === "in_progress" || status === "in progress"
      ? 2
      : status === "assigned"
      ? 1
      : 0

  return (
    <div className="space-y-2.5 py-1">
      {/* Stepper Progress Indicator */}
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>Stage: <strong className="text-foreground font-bold">{stage || stages[currentStageIndex]}</strong></span>
        </div>
        <span className="font-mono font-bold text-foreground">{currentProgress.toFixed(0)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress value={currentProgress} className="h-2 rounded-full bg-muted" />
      </div>

      {/* Metric Breakdown Strip */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 font-medium">
        <span>Est: {estimatedHours} hrs</span>
        {actualHours > 0 && <span>Logged: {actualHours} hrs</span>}
        <div className="flex items-center gap-1">
          {stages.map((st, i) => (
            <span
              key={st}
              className={`h-1.5 w-3 rounded-full transition-colors ${
                i <= currentStageIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              title={st}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
