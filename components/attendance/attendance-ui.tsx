"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AttendanceState = "present" | "late" | "half_day" | "absent" | "leave" | "on_leave" | "clocked-in" | "incomplete" | string | null | undefined

const stateClasses: Record<string, string> = {
  present: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  late: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  half_day: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-300",
  absent: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300",
  leave: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  on_leave: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  "clocked-in": "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  incomplete: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
}

export function AttendanceStatus({ status, className }: { status: AttendanceState; className?: string }) {
  const label = status === "half_day" ? "Half day" : status === "on_leave" || status === "leave" ? "On leave" : status === "clocked-in" ? "Working" : status === "incomplete" ? "Incomplete" : status ? status.replaceAll("_", " ") : "Pending"
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", stateClasses[String(status)] || stateClasses.incomplete, className)}>{label}</span>
}

export function AttendanceMetric({ label, value, detail, icon, tone = "slate", active = false, onClick }: { label: string; value: number | string; detail?: string; icon?: ReactNode; tone?: "slate" | "green" | "amber" | "orange" | "rose" | "blue" | "sky"; active?: boolean; onClick?: () => void }) {
  const tones = {
    slate: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200",
    green: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
    orange: "text-orange-700 bg-orange-100 dark:bg-orange-950 dark:text-orange-300",
    rose: "text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300",
    blue: "text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300",
    sky: "text-sky-700 bg-sky-100 dark:bg-sky-950 dark:text-sky-300",
  }
  const content = <><div className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-muted-foreground">{label}</span>{icon && <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tones[tone])}>{icon}</span>}</div><div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>{detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}</>
  const cls = cn("rounded-2xl border bg-card p-4 text-left shadow-sm transition-all sm:p-5", active ? "border-primary ring-2 ring-primary/15" : "border-border/70", onClick && "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary")
  return onClick ? <button type="button" onClick={onClick} aria-pressed={active} className={cn(cls, "w-full")}>{content}</button> : <div className={cls}>{content}</div>
}
