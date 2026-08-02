"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, AlertCircle, PlayCircle, PauseCircle, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"

interface JobCardExecutionProps {
  jobId: string
  status: string
  progress: number
  estimatedHours?: number
  actualHours?: number
  stage?: string
  role?: "owner" | "employee"
  onActionComplete?: () => void
}

export function JobCardExecution({
  jobId,
  status,
  progress = 0,
  estimatedHours = 8,
  actualHours = 0,
  stage,
  role = "owner",
  onActionComplete,
}: JobCardExecutionProps) {
  const [currentProgress, setCurrentProgress] = React.useState(Math.min(100, Math.max(0, progress)))
  const [isUpdating, setIsUpdating] = React.useState(false)

  React.useEffect(() => {
    setCurrentProgress(Math.min(100, Math.max(0, progress)))
  }, [progress])

  const stages = ["Open", "Assigned", "In Progress", "Completed"]
  const currentStageIndex =
    status === "completed" || status === "verified"
      ? 3
      : status === "active" || status === "in_progress" || status === "in progress"
      ? 2
      : status === "assigned"
      ? 1
      : 0

  const handleSaveProgress = async () => {
    setIsUpdating(true)
    try {
      await apiClient(`/api/jobs/${jobId}/progress`, {
        method: "POST",
        body: JSON.stringify({ progress: currentProgress }),
      })
      toast.success(`Progress updated to ${currentProgress}%!`)
      if (onActionComplete) onActionComplete()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update progress")
    } finally {
      setIsUpdating(false)
    }
  }

  const isProgressChanged = Math.round(currentProgress) !== Math.round(progress)

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

      {/* Progress Bar & Slider */}
      <div className="space-y-2">
        <Progress value={currentProgress} className="h-2 rounded-full bg-muted" />

        {/* Interactive Progress Slider for In-Progress Jobs */}
        {status !== "completed" && status !== "cancelled" && (
          <div className="pt-1 space-y-2">
            <Slider
              value={[currentProgress]}
              onValueChange={(val) => setCurrentProgress(val[0])}
              max={100}
              step={5}
              className="py-1 cursor-pointer"
            />
            {isProgressChanged && (
              <Button
                size="sm"
                className="w-full h-7 text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveProgress}
                disabled={isUpdating}
              >
                Save Progress ({currentProgress}%)
              </Button>
            )}
          </div>
        )}
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
