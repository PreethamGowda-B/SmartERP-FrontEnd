"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Users, Clock, AlertCircle, CheckCircle2, XCircle, CalendarCheck, RefreshCw, Sparkles, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type AttendanceState =
  | "present"
  | "late"
  | "half_day"
  | "absent"
  | "leave"
  | "on_leave"
  | "clocked-in"
  | "incomplete"
  | string
  | null
  | undefined

interface StatusConfig {
  label: string
  badgeClass: string
  dotClass: string
  pulse?: boolean
}

const statusConfigs: Record<string, StatusConfig> = {
  present: {
    label: "Present",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  late: {
    label: "Late Arrival",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  half_day: {
    label: "Half Day",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300",
    dotClass: "bg-orange-500",
  },
  absent: {
    label: "Absent",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
  leave: {
    label: "On Leave",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300",
    dotClass: "bg-sky-500",
  },
  on_leave: {
    label: "On Leave",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300",
    dotClass: "bg-sky-500",
  },
  "clocked-in": {
    label: "Working (Checked In)",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300",
    dotClass: "bg-blue-500",
    pulse: true,
  },
  incomplete: {
    label: "Incomplete",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
    dotClass: "bg-slate-400",
  },
}

export function AttendanceStatus({
  status,
  isLate,
  className,
  showDot = true,
}: {
  status: AttendanceState
  isLate?: boolean
  className?: string
  showDot?: boolean
}) {
  const key = String(status || "").toLowerCase()
  const config = statusConfigs[key] || {
    label: status ? String(status).replaceAll("_", " ") : "Pending",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
    dotClass: "bg-slate-400",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-tight select-none transition-colors",
        config.badgeClass,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {config.pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                config.dotClass
              )}
            />
          )}
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.dotClass)} />
        </span>
      )}
      <span>{config.label}</span>
      {isLate && key !== "late" && (
        <span className="ml-1 rounded px-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300">
          Late
        </span>
      )}
    </span>
  )
}

export function AttendanceMetric({
  label,
  value,
  detail,
  percent,
  icon,
  tone = "slate",
  active = false,
  onClick,
}: {
  label: string
  value: number | string
  detail?: string
  percent?: number
  icon?: ReactNode
  tone?: "slate" | "green" | "amber" | "orange" | "rose" | "blue" | "sky"
  active?: boolean
  onClick?: () => void
}) {
  const tones = {
    slate: {
      icon: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200",
      activeRing: "border-slate-400 ring-slate-400/15",
      badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    green: {
      icon: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300",
      activeRing: "border-emerald-500 ring-emerald-500/20",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    amber: {
      icon: "text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300",
      activeRing: "border-amber-500 ring-amber-500/20",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
    orange: {
      icon: "text-orange-700 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-300",
      activeRing: "border-orange-500 ring-orange-500/20",
      badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    },
    rose: {
      icon: "text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300",
      activeRing: "border-rose-500 ring-rose-500/20",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    },
    blue: {
      icon: "text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300",
      activeRing: "border-blue-500 ring-blue-500/20",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },
    sky: {
      icon: "text-sky-700 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300",
      activeRing: "border-sky-500 ring-sky-500/20",
      badge: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    },
  }

  const selectedTone = tones[tone] || tones.slate

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 truncate">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform",
              selectedTone.icon
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        {percent !== undefined && (
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded-md tabular-nums shrink-0",
              selectedTone.badge
            )}
          >
            {percent}%
          </span>
        )}
      </div>

      {detail && (
        <div className="mt-1 text-xs text-muted-foreground/90 truncate">
          {detail}
        </div>
      )}
    </>
  )

  const cls = cn(
    "relative rounded-2xl border bg-card p-4 text-left shadow-xs transition-all sm:p-5",
    active
      ? cn("border-primary ring-2 bg-primary/[0.02]", selectedTone.activeRing)
      : "border-border/70 hover:border-border hover:shadow-sm",
    onClick && "cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  )

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn(cls, "w-full")}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}

export function AttendanceWorkforceDistribution({
  present = 0,
  late = 0,
  halfDay = 0,
  onLeave = 0,
  absent = 0,
  total = 0,
}: {
  present?: number
  late?: number
  halfDay?: number
  onLeave?: number
  absent?: number
  total?: number
}) {
  const safeTotal = total > 0 ? total : Math.max(1, present + late + halfDay + onLeave + absent)
  const pct = (val: number) => Math.round((val / safeTotal) * 100)

  const segments = [
    { label: "On Time", count: Math.max(0, present - late), pct: pct(Math.max(0, present - late)), color: "bg-emerald-500", textColor: "text-emerald-700 dark:text-emerald-400" },
    { label: "Late", count: late, pct: pct(late), color: "bg-amber-500", textColor: "text-amber-700 dark:text-amber-400" },
    { label: "Half Day", count: halfDay, pct: pct(halfDay), color: "bg-orange-500", textColor: "text-orange-700 dark:text-orange-400" },
    { label: "On Leave", count: onLeave, pct: pct(onLeave), color: "bg-sky-500", textColor: "text-sky-700 dark:text-sky-400" },
    { label: "Absent", count: absent, pct: pct(absent), color: "bg-rose-500", textColor: "text-rose-700 dark:text-rose-400" },
  ].filter((s) => s.count > 0)

  if (total === 0 && segments.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-foreground tracking-tight flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          Today&apos;s Workforce Coverage Breakdown
        </span>
        <span className="text-muted-foreground">
          {present + onLeave} of {total} staff accounted for ({pct(present + onLeave)}%)
        </span>
      </div>

      {/* Segmented bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex gap-0.5">
        {segments.map((s, idx) => (
          <div
            key={idx}
            className={cn("h-full transition-all duration-500", s.color)}
            style={{ width: `${s.pct}%` }}
            title={`${s.label}: ${s.count} (${s.pct}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-1">
        {segments.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", s.color)} />
            <span className="font-medium text-foreground">{s.label}:</span>
            <span className="font-semibold tabular-nums">{s.count}</span>
            <span className="text-[10px] text-muted-foreground/75">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AttendancePageHeader({
  title = "Attendance",
  description = "A live view of today's shift, exceptions, and team coverage.",
  badgeText = "Live · 30s sync",
  workDate,
  timezone = "Asia/Kolkata",
  onRefresh,
  refreshing = false,
  actions,
}: {
  title?: string
  description?: string
  badgeText?: string
  workDate?: string
  timezone?: string
  onRefresh?: () => void
  refreshing?: boolean
  actions?: ReactNode
}) {
  const formattedDate = workDate
    ? new Date(workDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: timezone,
      })
    : new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: timezone,
      })

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-1">
          <Clock className="h-3.5 w-3.5" /> Workforce Operations · {formattedDate}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="h-8 px-2.5 rounded-full gap-1.5 border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 font-medium text-xs"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {badgeText}
        </Badge>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-xl border-border/80 text-xs font-semibold hover:bg-accent/40"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-primary")} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        )}

        {actions}
      </div>
    </div>
  )
}
