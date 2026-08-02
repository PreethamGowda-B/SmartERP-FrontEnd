"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Zap, Filter, Search, CheckCircle2, XCircle, MessageSquare, Clock, User, Building2, AlertTriangle, ChevronRight, RefreshCw, ShieldAlert, FileText, Package, Users } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { useNotifications } from "@/contexts/notification-context"

interface WorkRequest {
  id: string
  request_type: string
  category: string
  urgency: string
  status: string
  submitted_by_name: string
  submitted_by_role: string
  title: string
  reason: string
  created_at: string
  job_title?: string
  invoice_number?: string
  invoice_total?: number
  owner_response?: string
  payload?: any
}

const CATEGORIES = [
  { id: "all", label: "All Requests" },
  { id: "jobs", label: "Jobs & Field" },
  { id: "customers", label: "Customer Requests" },
  { id: "finance", label: "Finance & Discounts" },
  { id: "inventory", label: "Inventory & Supply" },
  { id: "hr", label: "HR & Leaves" },
  { id: "safety", label: "Safety Alerts" },
]

export function ExecutiveWorkQueueDrawer({ trigger }: { trigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [requests, setRequests] = React.useState<WorkRequest[]>([])
  const [loading, setLoading] = React.useState(false)
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("pending")
  const [search, setSearch] = React.useState("")

  // Response inline state
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
      const res = await apiClient(`/api/work-requests?${q.toString()}`)
      if (res?.success) {
        setRequests(res.requests || [])
      }
    } catch (err) {
      console.error("Error fetching work queue:", err)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, statusFilter, search])

  React.useEffect(() => {
    if (isOpen) {
      fetchQueue()
    }
  }, [isOpen, fetchQueue])

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

  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="relative h-8 px-2 gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 shrink-0"
            title="Executive Work Queue"
          >
            <Zap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden 2xl:inline text-[11px]">Work Queue</span>
            {pendingCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col bg-background">
        <SheetHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-black tracking-tight">Executive Approval Command Center</SheetTitle>
                <p className="text-xs text-muted-foreground">Unified approval queue across all SmartERP modules</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchQueue} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Search & Category Pills */}
          <div className="space-y-3 pt-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search requests by title, submitter, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={categoryFilter === cat.id ? "default" : "outline"}
                  className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                    categoryFilter === cat.id
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1">
              <span>Status:</span>
              {["pending", "approved", "rejected", "all"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase transition-colors ${
                    statusFilter === st
                      ? "bg-primary/10 text-primary font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </SheetHeader>

        {/* Requests Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-foreground">No Pending Actions</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                All employee field requests, customer disputes, and material approvals are up to date.
              </p>
            </div>
          ) : (
            requests.map((req) => {
              const isEmergency = req.urgency === "emergency"
              const isSelected = activeReqId === req.id

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isEmergency
                      ? "bg-rose-50/70 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800"
                      : req.status === "pending"
                      ? "bg-card border-border/80 shadow-xs hover:border-primary/40"
                      : "bg-muted/30 border-border/40 opacity-75"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-background">
                        {req.category}
                      </Badge>
                      {isEmergency && (
                        <Badge variant="destructive" className="text-[9px] font-black uppercase px-2 py-0 animate-pulse">
                          🚨 EMERGENCY SOS
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(req.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Title & Submitter */}
                  <div>
                    <h4 className="text-sm font-extrabold text-foreground leading-snug">{req.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <User className="h-3 w-3 text-primary" />
                      <strong className="text-foreground font-semibold">{req.submitted_by_name}</strong> ({req.submitted_by_role})
                    </p>
                  </div>

                  {/* Reason / Details */}
                  {req.reason && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-xl italic">
                      "{req.reason}"
                    </p>
                  )}

                  {/* Related Context */}
                  {(req.job_title || req.invoice_number) && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1 border-t border-border/40 font-medium">
                      {req.job_title && (
                        <span className="truncate max-w-[200px]">Job: <strong className="text-foreground">{req.job_title}</strong></span>
                      )}
                      {req.invoice_number && (
                        <span>Inv: <strong className="text-foreground">{req.invoice_number}</strong> (₹{req.invoice_total?.toLocaleString()})</span>
                      )}
                    </div>
                  )}

                  {/* Action Controls */}
                  {req.status === "pending" && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      {!isSelected ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => handleAction(req.id, "approve")}
                            disabled={actionLoading}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 font-bold"
                            onClick={() => setActiveReqId(req.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setActiveReqId(req.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-in fade-in duration-150">
                          <Textarea
                            placeholder="Add owner response or rejection reason..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            className="text-xs h-16 rounded-xl"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setActiveReqId(null)}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-rose-600 text-white font-bold"
                              onClick={() => handleAction(req.id, "reject")}
                              disabled={actionLoading}
                            >
                              Confirm Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 text-white font-bold"
                              onClick={() => handleAction(req.id, "approve")}
                              disabled={actionLoading}
                            >
                              Confirm Approve
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {req.owner_response && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <strong>Owner Response:</strong> {req.owner_response}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
