"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Bell, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  UserCheck, 
  MessageSquare,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LiveToastItem {
  id: string
  title: string
  message: string
  type?: string
  created_at?: string
  data?: any
  read?: boolean
}

interface LiveNotificationToastProps {
  toasts: LiveToastItem[]
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
  isMuted: boolean
  onToggleMute: () => void
}

function getToastIconAndStyle(type: string = "system") {
  const t = type.toLowerCase()
  if (t.includes("job") || t === "work_order") {
    return {
      icon: Briefcase,
      badgeText: "JOB",
      colorClass: "border-blue-500/40 bg-slate-900/95 text-blue-100 dark:border-blue-500/60 shadow-blue-950/40",
      accentBg: "bg-blue-500/20 text-blue-400",
      progressBg: "bg-blue-500",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white"
    }
  }
  if (t.includes("invoice") || t.includes("payment") || t.includes("payroll") || t.includes("financial")) {
    return {
      icon: DollarSign,
      badgeText: "FINANCE",
      colorClass: "border-emerald-500/40 bg-slate-900/95 text-emerald-100 dark:border-emerald-500/60 shadow-emerald-950/40",
      accentBg: "bg-emerald-500/20 text-emerald-400",
      progressBg: "bg-emerald-500",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white"
    }
  }
  if (t.includes("leave") || t.includes("hr") || t.includes("attendance") || t.includes("request")) {
    return {
      icon: Calendar,
      badgeText: "HR & ESS",
      colorClass: "border-amber-500/40 bg-slate-900/95 text-amber-100 dark:border-amber-500/60 shadow-amber-950/40",
      accentBg: "bg-amber-500/20 text-amber-400",
      progressBg: "bg-amber-500",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white"
    }
  }
  if (t.includes("message") || t.includes("chat")) {
    return {
      icon: MessageSquare,
      badgeText: "MESSAGING",
      colorClass: "border-indigo-500/40 bg-slate-900/95 text-indigo-100 dark:border-indigo-500/60 shadow-indigo-950/40",
      accentBg: "bg-indigo-500/20 text-indigo-400",
      progressBg: "bg-indigo-500",
      btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white"
    }
  }
  if (t.includes("proof") || t.includes("action") || t.includes("urgent") || t.includes("emergency")) {
    return {
      icon: ShieldAlert,
      badgeText: "FIELD ALERT",
      colorClass: "border-rose-500/40 bg-slate-900/95 text-rose-100 dark:border-rose-500/60 shadow-rose-950/40",
      accentBg: "bg-rose-500/20 text-rose-400",
      progressBg: "bg-rose-500",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white"
    }
  }
  return {
    icon: Bell,
    badgeText: "SYSTEM",
    colorClass: "border-cyan-500/40 bg-slate-900/95 text-slate-100 dark:border-cyan-500/60 shadow-cyan-950/40",
    accentBg: "bg-cyan-500/20 text-cyan-400",
    progressBg: "bg-cyan-500",
    btnClass: "bg-cyan-600 hover:bg-cyan-700 text-white"
  }
}

function SingleToast({
  toast,
  onDismiss,
  onMarkRead,
}: {
  toast: LiveToastItem
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
}) {
  const router = useRouter()
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const DURATION = 6000 // 6 seconds

  useEffect(() => {
    if (isPaused) return
    const interval = 50
    const step = (interval / DURATION) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer)
          onDismiss(toast.id)
          return 0
        }
        return prev - step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isPaused, toast.id, onDismiss])

  const style = getToastIconAndStyle(toast.type)
  const IconComponent = style.icon

  const handleAction = () => {
    onMarkRead(toast.id)
    onDismiss(toast.id)
    
    // Direct navigation based on embedded url or fallback
    let targetUrl = toast.data?.url
    if (!targetUrl) {
      if (toast.type?.includes("job")) targetUrl = "/employee/jobs"
      else if (toast.type?.includes("leave") || toast.type?.includes("hr")) targetUrl = "/hr/requests"
      else if (toast.type?.includes("invoice") || toast.type?.includes("payment")) targetUrl = "/owner/finance"
      else if (toast.type?.includes("payroll")) targetUrl = "/employee/payroll"
      else targetUrl = "/notifications"
    }

    router.push(targetUrl)
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "group relative w-80 sm:w-96 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-x-0 overflow-hidden my-1.5",
        style.colorClass
      )}
      style={{ animation: "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Type Icon Badge */}
        <div className={cn("p-2.5 rounded-xl shrink-0 font-bold mt-0.5", style.accentBg)}>
          <IconComponent className="h-5 w-5 animate-bounce" />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/10">
              {style.badgeText}
            </span>
            <span className="text-[10px] text-white/60 font-mono">Just now</span>
          </div>

          <h4 className="text-sm font-black text-white tracking-tight line-clamp-1">
            {toast.title}
          </h4>
          <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">
            {toast.message}
          </p>

          {/* Action Row */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAction}
              className={cn("h-7 px-3 text-xs font-extrabold rounded-lg shadow-sm transition-all", style.btnClass)}
            >
              View <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onMarkRead(toast.id)
                onDismiss(toast.id)
              }}
              className="h-7 px-2 text-[11px] font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
            >
              Dismiss
            </Button>
          </div>
        </div>

        {/* Close Icon */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-75 ease-linear", style.progressBg)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function LiveNotificationToastContainer({
  toasts,
  onDismiss,
  onMarkRead,
  isMuted,
  onToggleMute,
}: LiveNotificationToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col items-end pointer-events-none space-y-2 max-h-screen overflow-hidden p-2">
      {/* Sound Mute Toggle Header Bar */}
      <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 px-3 py-1 rounded-xl text-white text-[11px] shadow-lg backdrop-blur-md mb-1">
        <span className="font-semibold text-slate-300">Live Alerts</span>
        <button
          onClick={onToggleMute}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-bold"
          title={isMuted ? "Unmute Live Sound" : "Mute Live Sound"}
        >
          {isMuted ? (
            <>
              <VolumeX className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-rose-400 text-[10px]">Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Sound On</span>
            </>
          )}
        </button>
      </div>

      {/* Stack of toasts */}
      <div className="pointer-events-auto flex flex-col items-end space-y-1">
        {toasts.slice(0, 4).map((t) => (
          <SingleToast
            key={t.id}
            toast={t}
            onDismiss={onDismiss}
            onMarkRead={onMarkRead}
          />
        ))}
      </div>
    </div>
  )
}
