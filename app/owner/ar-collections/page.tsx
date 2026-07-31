"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { arCollectionsApi, ArAgingSummary, ArSchedule } from "@/lib/arCollectionsApi"
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Pause, 
  Play, 
  RefreshCw, 
  Search, 
  Filter, 
  Sparkles,
  ShieldAlert
} from "lucide-react"

export default function ArCollectionsPage() {
  const { toast } = useToast()
  const [aging, setAging] = useState<ArAgingSummary | null>(null)
  const [schedules, setSchedules] = useState<ArSchedule[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filterStage, setFilterStage] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // AI Payment Plan Modal
  const [selectedOfferSchedule, setSelectedOfferSchedule] = useState<ArSchedule | null>(null)
  const [aiOfferText, setAiOfferText] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [filterStage])

  const fetchData = async () => {
    try {
      setLoading(true)
      const summaryData = await arCollectionsApi.getSummary()
      const schedData = await arCollectionsApi.getSchedules(filterStage === "all" ? undefined : filterStage)

      if (summaryData.success) setAging(summaryData.aging)
      if (schedData.success) setSchedules(schedData.schedules || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load AR collection data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncInvoices = async () => {
    try {
      setLoading(true)
      const data = await arCollectionsApi.syncInvoices()
      toast({ title: "Invoices Synced", description: data.message })
      fetchData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to sync invoices.", variant: "destructive" })
      setLoading(false)
    }
  }

  const handleDispatchReminder = async (scheduleId: string) => {
    try {
      const data = await arCollectionsApi.dispatchReminder(scheduleId, "whatsapp")
      toast({ title: "WhatsApp Reminder Dispatched", description: "Meta Business Utility Template message sent to client." })
      fetchData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to dispatch reminder.", variant: "destructive" })
    }
  }

  const handleTogglePause = async (schedule: ArSchedule) => {
    try {
      if (schedule.is_paused) {
        await arCollectionsApi.resumeSchedule(schedule.id)
        toast({ title: "Schedule Resumed", description: "Automated reminders re-enabled." })
      } else {
        await arCollectionsApi.pauseSchedule(schedule.id)
        toast({ title: "Schedule Paused", description: "Automated reminders paused for this client." })
      }
      fetchData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update schedule.", variant: "destructive" })
    }
  }

  const handleGeneratePaymentPlan = async (schedule: ArSchedule) => {
    setSelectedOfferSchedule(schedule)
    try {
      const dueDate = new Date(schedule.due_date)
      const today = new Date()
      const overdueDays = Math.max(1, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))

      const res = await arCollectionsApi.generatePaymentPlanOffer({
        customerName: schedule.customer_name,
        outstandingAmount: Number(schedule.amount_outstanding),
        overdueDays,
      })

      if (res.success) setAiOfferText(res.offer)
    } catch (err: any) {
      setAiOfferText("Offer 50% down payment today with 2% discount, remaining 50% in 14 days.")
    }
  }

  const filteredSchedules = schedules.filter(
    (s) =>
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(s.invoice_id).includes(searchTerm)
  )

  return (
    <OwnerLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-primary" />
              Autonomous AR Collections Agent
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated multi-stage overdue payment reminders, Meta WhatsApp templates, and AI payment plan negotiation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSyncInvoices}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Unpaid Invoices
            </Button>
          </div>
        </div>

        {/* Aging Bucket KPI Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current (Not Overdue)</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{aging ? Number(aging.current_amount).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Due within terms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">1–30 Days Overdue</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                ₹{aging ? Number(aging.bucket_1_30).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Stage 1 & 2 Follow-ups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">31–60 Days Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ₹{aging ? Number(aging.bucket_31_60).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Stage 3 AI Negotiation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">61+ Days High Risk</CardTitle>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                ₹{aging ? (Number(aging.bucket_61_90) + Number(aging.bucket_90_plus)).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Escalated / Credit Hold</p>
            </CardContent>
          </Card>
        </div>

        {/* Schedules Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active AR Collection Tracking Schedules</CardTitle>
              <CardDescription>Multi-stage automated reminder schedules per outstanding invoice</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-xs"
              >
                <option value="all">All Stages</option>
                <option value="pre_due_3d">Pre-Due (3 Days)</option>
                <option value="due_1d">Due 1 Day</option>
                <option value="overdue_7d">Overdue 7 Days</option>
                <option value="overdue_14d">Overdue 14 Days</option>
                <option value="overdue_30d">Overdue 30 Days</option>
                <option value="settled">Settled</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 w-full sm:w-80">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Client or Invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Client Name</th>
                    <th className="px-4 py-3">Invoice ID</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Outstanding Amount</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Next Scheduled Reminder</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading AR collection schedules...
                      </td>
                    </tr>
                  ) : filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No collection schedules found. Click "Sync Unpaid Invoices" to populate.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{s.customer_name}</td>
                        <td className="px-4 py-3 font-mono">#{s.invoice_id}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(s.due_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">
                          ₹{Number(s.amount_outstanding).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {s.current_stage === "pre_due_3d" && <Badge className="bg-emerald-500/10 text-emerald-600">Pre-Due 3d</Badge>}
                          {s.current_stage === "due_1d" && <Badge className="bg-amber-500/10 text-amber-600">Due 1d</Badge>}
                          {s.current_stage === "overdue_7d" && <Badge className="bg-orange-500/10 text-orange-600">Overdue 7d</Badge>}
                          {s.current_stage === "overdue_14d" && <Badge className="bg-rose-500/10 text-rose-600">Overdue 14d</Badge>}
                          {s.current_stage === "overdue_30d" && <Badge className="bg-purple-500/10 text-purple-600">Overdue 30d</Badge>}
                          {s.current_stage === "settled" && <Badge className="bg-emerald-500/10 text-emerald-600">Settled</Badge>}
                          {s.is_paused && <Badge variant="secondary" className="ml-1">Paused</Badge>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {s.next_scheduled_reminder ? new Date(s.next_scheduled_reminder).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                            onClick={() => handleDispatchReminder(s.id)}
                          >
                            <Send className="mr-1 h-3.5 w-3.5" /> WhatsApp
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600"
                            onClick={() => handleGeneratePaymentPlan(s)}
                          >
                            <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Offer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleTogglePause(s)}
                          >
                            {s.is_paused ? <Play className="h-3.5 w-3.5 text-emerald-500" /> : <Pause className="h-3.5 w-3.5 text-amber-500" />}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Payment Plan Offer Modal */}
        <Dialog open={!!selectedOfferSchedule} onOpenChange={() => setSelectedOfferSchedule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Payment Plan Offer Generator
              </DialogTitle>
              <DialogDescription>
                Groq Llama 3.3 70B suggested negotiation message for client <strong>{selectedOfferSchedule?.customer_name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4 text-xs font-mono">
                {aiOfferText || "Generating payment plan options..."}
              </div>
              <p className="text-xs text-muted-foreground">
                Max early settlement discount permitted: <strong>2.00%</strong> per company policy.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  toast({ title: "Offer Copied", description: "Payment plan offer ready for client email/WhatsApp." })
                  setSelectedOfferSchedule(null)
                }}
              >
                Copy & Dispatch Offer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
