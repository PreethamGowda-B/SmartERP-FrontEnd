"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import {
  CheckCircle2, XCircle, MessageSquare, Clock, AlertTriangle,
  User, Briefcase, FileText, Package, ShieldAlert, ArrowRight,
  Search, RefreshCw, Send, Check, X, ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface WorkRequest {
  id: string
  company_id: number
  request_type: string
  category: string
  urgency: "urgent" | "high" | "normal" | "low"
  status: "pending" | "approved" | "rejected"
  submitted_by_id: string
  submitted_by_name: string
  submitted_by_role: string
  job_id?: string
  invoice_id?: string
  title: string
  reason: string
  evidence_urls?: string[]
  payload?: any
  owner_response?: string
  actioned_at?: string
  created_at: string
}

const CATEGORIES = [
  { id: "all", label: "All Requests", icon: Briefcase },
  { id: "jobs", label: "Employee Field Requests", icon: User },
  { id: "customers", label: "Customer Requests", icon: User },
  { id: "finance", label: "Invoice & Discount Requests", icon: FileText },
  { id: "inventory", label: "Inventory & Materials", icon: Package },
  { id: "hr", label: "HR & Leaves", icon: Clock },
  { id: "safety", label: "Safety Alerts", icon: ShieldAlert },
]

export function ApprovalCenterView({ initialCategory = "all" }: { initialCategory?: string }) {
  const [requests, setRequests] = React.useState<WorkRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [categoryFilter, setCategoryFilter] = React.useState(initialCategory)
  const [statusFilter, setStatusFilter] = React.useState("pending")
  const [search, setSearch] = React.useState("")

  const [activeReqId, setActiveReqId] = React.useState<string | null>(null)
  const [responseText, setResponseText] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)

  const fetchQueue = React.useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        category: categoryFilter,
        status: statusFilter,
        search,
      })
      const res = await apiClient(`/api/work-requests?${q}`)
      if (res.success) {
        setRequests(res.requests || [])
      }
    } catch (err) {
      console.error("Error fetching approval center requests:", err)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, statusFilter, search])

  React.useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const handleAction = async (id: string, actionType: "approve" | "reject" | "reply") => {
    setActionLoading(true)
    try {
      await apiClient(`/api/work-requests/${id}/action`, {
        method: "PATCH",
        body: JSON.stringify({
          action: actionType,
          owner_response: responseText,
        }),
      })

      toast.success(`Request ${actionType === "approve" ? "Approved ✅" : actionType === "reject" ? "Rejected ❌" : "Updated 💬"}`)
      setActiveReqId(null)
      setResponseText("")
      fetchQueue()
    } catch (err: any) {
      toast.error(err?.message || "Failed to execute action")
    } finally {
      setActionLoading(false)
    }
  }

  // Calculate counts per category for badges
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: requests.length }
    requests.forEach((r) => {
      const cat = r.category || "jobs"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [requests])

  return (
    <div className="space-y-6">
      {/* 1. Header & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-2xl border border-border/70 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Executive Approval Center</h2>
            <p className="text-xs text-muted-foreground">Review, action, and clear operational requests across SmartERP</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search request, job, or requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex rounded-xl border border-border p-1 bg-muted/40">
            {(["pending", "approved", "rejected"] as const).map((st) => (
              <Button
                key={st}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs font-bold capitalize px-3 rounded-lg transition-all",
                  statusFilter === st ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                )}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={fetchQueue} title="Refresh requests">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* 2. Categorized View Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const count = categoryCounts[cat.id] || 0
          const isActive = categoryFilter === cat.id

          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card hover:bg-muted/50 text-muted-foreground border-border/70"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. Categorized Request Cards List */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-card rounded-2xl border border-border/70">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Loading approval requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-card rounded-2xl border border-border/70">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-foreground">Approval Queue Clean</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            There are no {statusFilter} {categoryFilter !== "all" ? categoryFilter : ""} requests requiring executive review at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const isUrgent = req.urgency === "urgent" || req.urgency === "high"

            return (
              <Card
                key={req.id}
                className={cn(
                  "rounded-2xl border bg-card backdrop-blur-xs transition-all duration-200 hover:shadow-md",
                  isUrgent ? "border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10" : "border-border/70"
                )}
              >
                <CardContent className="p-5 space-y-3.5">
                  {/* Top Bar: Urgency + Status + Category */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                          req.urgency === "urgent"
                            ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                            : req.urgency === "high"
                            ? "bg-orange-100 text-orange-800 border-orange-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        )}
                      >
                        {req.urgency || "normal"} priority
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        {req.category}
                      </Badge>
                    </div>

                    <Badge
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full",
                        req.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {req.status}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-base text-foreground leading-tight">{req.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{req.reason}</p>
                  </div>

                  {/* Requester & References */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Submitted By</span>
                      <span className="font-semibold text-foreground">{req.submitted_by_name} ({req.submitted_by_role})</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Reference</span>
                      {req.job_id ? (
                        <a href={`/owner/jobs`} className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1">
                          Job #{req.job_id.substring(0, 8)} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : req.invoice_id ? (
                        <a href={`/owner/finance/invoices`} className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1">
                          Invoice #{req.invoice_id.substring(0, 8)} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="font-mono text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  {/* Owner Response Box (if already actioned) */}
                  {req.owner_response && (
                    <div className="p-3 bg-muted/60 rounded-xl border border-border/50 text-xs space-y-1">
                      <span className="font-bold text-foreground block">Executive Decision Note:</span>
                      <p className="text-muted-foreground leading-relaxed">{req.owner_response}</p>
                    </div>
                  )}

                  {/* Inline Action Dock */}
                  {req.status === "pending" && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      {activeReqId === req.id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Add executive response notes (optional)..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            className="h-8 text-xs rounded-xl"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setActiveReqId(null)}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs font-bold px-3"
                              disabled={actionLoading}
                              onClick={() => handleAction(req.id, "reject")}
                            >
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                              disabled={actionLoading}
                              onClick={() => handleAction(req.id, "approve")}
                            >
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            onClick={() => setActiveReqId(req.id)}
                          >
                            Reply & Action
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs font-bold px-3"
                            onClick={() => {
                              setActiveReqId(req.id)
                              handleAction(req.id, "reject")
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 shadow-xs"
                            onClick={() => {
                              setActiveReqId(req.id)
                              handleAction(req.id, "approve")
                            }}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
