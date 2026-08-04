"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, User, MoreVertical, Building2, Clock, Sparkles } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface JobCardHeaderProps {
  id: string
  title: string
  client: string
  location?: string
  status: string
  priority: string
  startDate?: string
  assignedCrew?: { id: string; name: string; avatar?: string }[]
  role?: "owner" | "employee"
  isCustomerJob?: boolean
  isAiCreated?: boolean
  source?: string
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
}

export function JobCardHeader({
  id,
  title,
  client,
  location,
  status,
  priority,
  startDate,
  assignedCrew = [],
  role = "owner",
  isCustomerJob = false,
  isAiCreated = false,
  source,
  onEdit,
  onDelete,
  onView,
}: JobCardHeaderProps) {
  const isCust = isCustomerJob || source === "customer" || source === "customer_portal"
  const isAi = isAiCreated || source === "ai_copilot" || source === "SmartERP Intelligence"
  const getStatusBadge = (st: string) => {
    const s = (st || "open").toLowerCase()
    switch (s) {
      case "active":
      case "in progress":
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
      case "completed":
      case "verified":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
      case "assigned":
      case "accepted":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
      case "disputed":
        return "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 animate-pulse"
      case "cancelled":
      case "declined":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getPriorityBadge = (pr: string) => {
    const p = (pr || "normal").toLowerCase()
    switch (p) {
      case "high":
      case "emergency":
      case "urgent":
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  return (
    <div className="space-y-2.5 pb-3 border-b border-border/50">
      {/* Top Meta Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
            #{id.slice(0, 8).toUpperCase()}
          </span>
          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${getStatusBadge(status)}`}>
            {status.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${getPriorityBadge(priority)}`}>
            {priority}
          </Badge>
          {isAi && (
            <Badge className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1 shadow-xs">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              ✨ AI Created
            </Badge>
          )}
          {isCust ? (
            <Badge className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 flex items-center gap-1 shadow-xs">
              <User className="h-3 w-3" />
              Customer Request
            </Badge>
          ) : (
            <Badge className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Internal Job
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {startDate && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <Calendar className="h-3 w-3" />
              {new Date(startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </span>
          )}

          {role === "owner" && (onEdit || onDelete || onView) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Job options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 z-50">
                {onView && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      React.startTransition(() => onView())
                    }}
                  >
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      React.startTransition(() => onEdit())
                    }}
                  >
                    Edit Job
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      React.startTransition(() => onDelete())
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete Job
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Main Title & Client Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-medium text-foreground/90">
              <Building2 className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              {client}
            </span>
            {location && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {location}
              </span>
            )}
          </div>
        </div>

        {/* Assigned Technicians Stack */}
        {assignedCrew.length > 0 && (
          <div className="flex items-center -space-x-2 shrink-0 pt-0.5">
            {assignedCrew.slice(0, 3).map((member, idx) => (
              <Avatar key={member.id || idx} className="h-7 w-7 border-2 border-background ring-1 ring-border/50">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {assignedCrew.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                +{assignedCrew.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
