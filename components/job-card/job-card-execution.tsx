"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, AlertCircle, ShieldAlert, Lock, UserCheck, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { useClockInGatekeeper } from "@/contexts/clock-in-gatekeeper-context"

interface JobCardExecutionProps {
  jobId: string
  status: string
  progress: number
  estimatedHours?: number
  actualHours?: number
  stage?: string
  role?: "owner" | "employee"
  isAcceptedByCurrentUser?: boolean
  acceptedByName?: string | null
  acceptedAt?: string | null
  onActionComplete?: () => void
  onEmergencyOverride?: () => void
}

export function JobCardExecution({
  jobId,
  status,
  progress = 0,
  estimatedHours = 8,
  actualHours = 0,
  stage,
  role = "owner",
  isAcceptedByCurrentUser = false,
  acceptedByName = null,
  acceptedAt = null,
  onActionComplete,
  onEmergencyOverride,
}: JobCardExecutionProps) {
  const { withClockInCheck } = useClockInGatekeeper()
  const [currentProgress, setCurrentProgress] = React.useState(Math.min(100, Math.max(0, progress)))
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isAccepting, setIsAccepting] = React.useState(false)
  const [isDeclining, setIsDeclining] = React.useState(false)

  React.useEffect(() => {
    setCurrentProgress(Math.min(100, Math.max(0, progress)))
  }, [progress])

  const stages = ["Open", "Assigned", "In Progress", "Completed"]
  const currentStageIndex =
    status === "completed" || status === "verified"
      ? 3
      : status === "active" || status === "in_progress" || status === "in progress"
      ? 2
      : status === "assigned" || status === "accepted"
      ? 1
      : 0

  const doSaveProgress = async () => {
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

  const handleSaveProgress = async () => {
    if (role === "employee") {
      withClockInCheck(() => doSaveProgress())
    } else {
      doSaveProgress()
    }
  }

  const doAcceptJob = async () => {
    setIsAccepting(true)
    try {
      await apiClient(`/api/jobs/${jobId}/accept`, { method: "POST" })
      toast.success("Job accepted! Field controls are now unlocked for you.")
      if (onActionComplete) onActionComplete()
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept job")
    } finally {
      setIsAccepting(false)
    }
  }

  const handleAcceptJob = async () => {
    if (role === "employee") {
      withClockInCheck(() => doAcceptJob())
    } else {
      doAcceptJob()
    }
  }

  const doDeclineJob = async () => {
    setIsDeclining(true)
    try {
      await apiClient(`/api/jobs/${jobId}/decline`, { method: "POST" })
      toast.info("Job declined.")
      if (onActionComplete) onActionComplete()
    } catch (err: any) {
      toast.error(err?.message || "Failed to decline job")
    } finally {
      setIsDeclining(false)
    }
  }

  const handleDeclineJob = async () => {
    if (role === "employee") {
      withClockInCheck(() => doDeclineJob())
    } else {
      doDeclineJob()
    }
  }

  const isProgressChanged = Math.round(currentProgress) !== Math.round(progress)

  return (
    <div className="space-y-2.5 py-1">
      {/* Stepper Progress Indicator */}
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>
            Stage: <strong className="text-foreground font-bold">{stage || stages[currentStageIndex]}</strong>
          </span>
        </div>
        <span className="font-mono font-bold text-foreground">{currentProgress.toFixed(0)}%</span>
      </div>

      {/* Progress Bar Display */}
      <div className="space-y-2">
        <Progress value={currentProgress} className="h-2 rounded-full bg-muted" />

        {/* ── CASE 1: EMPLOYEE PORTAL — ASSIGNED / ACCEPTED BY CURRENT USER ── */}
        {role === "employee" && isAcceptedByCurrentUser && status !== "cancelled" && (
          <div className="pt-1 space-y-2">
            <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1 font-bold">
                <UserCheck className="h-3.5 w-3.5" /> Field Technician Workspace (Unlocked)
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Drag slider to update progress</span>
            </div>
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
                className="w-full h-8 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all active:scale-[0.99]"
                onClick={handleSaveProgress}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save Field Progress ({currentProgress}%)
              </Button>
            )}
          </div>
        )}

        {/* ── CASE 2: EMPLOYEE PORTAL — ACCEPTED BY ANOTHER USER (VIEW ONLY) ── */}
        {role === "employee" && !isAcceptedByCurrentUser && acceptedByName && (
          <div className="p-2.5 rounded-xl bg-muted/60 border border-border/70 text-[11px] space-y-1">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                Assigned To: <strong className="text-primary">{acceptedByName}</strong>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">Read-Only</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground">
              Accepted {acceptedAt ? new Date(acceptedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}. You are viewing in read-only mode.
            </p>
          </div>
        )}

        {/* ── CASE 3: EMPLOYEE PORTAL — UNASSIGNED / PENDING ACCEPTANCE ── */}
        {role === "employee" && !isAcceptedByCurrentUser && !acceptedByName && status !== "completed" && status !== "cancelled" && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              onClick={handleAcceptJob}
              disabled={isAccepting}
            >
              {isAccepting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Accept Job
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] font-bold border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl"
              onClick={handleDeclineJob}
              disabled={isDeclining}
            >
              {isDeclining ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Decline
            </Button>
          </div>
        )}

        {/* ── CASE 4: OWNER PORTAL — READ-ONLY MONITORING CONSOLE ── */}
        {role === "owner" && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10.5px] text-muted-foreground font-medium flex items-center gap-1">
              <Lock className="h-3 w-3 text-muted-foreground" /> Supervisory Monitoring (Read-Only)
            </span>
            {onEmergencyOverride && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 px-2 rounded-lg"
                onClick={onEmergencyOverride}
              >
                <ShieldAlert className="h-3 w-3 mr-1 text-amber-600" />
                Emergency Override
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
