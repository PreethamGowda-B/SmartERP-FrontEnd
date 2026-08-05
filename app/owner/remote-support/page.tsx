"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { PhoneCall, Monitor, Plus, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare } from "lucide-react"

export default function RemoteSupportPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Log session modal state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: "",
    machine_id: "",
    support_channel: "phone",
    duration_minutes: "20",
    resolution_summary: "",
    is_resolved: true,
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const sRes = await apiClient<{ success: boolean; sessions: any[] }>("/api/remote-support")
      if (sRes?.sessions) setSessions(sRes.sessions)

      const cRes = await apiClient<{ customers?: any[] }>("/api/customers")
      if (Array.isArray(cRes)) setCustomers(cRes)
      else if (cRes?.customers) setCustomers(cRes.customers)
    } catch (err: any) {
      toast.error(err.message || "Failed to load remote support sessions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await apiClient<{ success: boolean; session: any; job?: any }>("/api/remote-support", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes) || 15,
        }),
      })

      if (!formData.is_resolved && res?.job) {
        toast.warning("Remote session unresolved — Breakdown Job auto-created & dispatched!")
      } else {
        toast.success("Remote Support session logged successfully!")
      }
      setIsAddOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to log remote session")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Monitor className="h-8 w-8 text-indigo-500" /> Remote Support Session Log (#29)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log Phone, WhatsApp, AnyDesk, TeamViewer, Fanuc FOCAS & Siemens Remote sessions. Unresolved issues auto-dispatch Breakdown Jobs.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Log Remote Support Session
        </Button>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading remote support sessions...</div>
      ) : sessions.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <PhoneCall className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Remote Sessions Logged</h3>
          <p className="text-xs text-slate-500">Track remote technical troubleshooting before dispatching on-site field engineers.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Card key={s.id} className="p-5 border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="uppercase font-mono text-indigo-600 border-indigo-300">
                      {s.support_channel}
                    </Badge>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Customer: {s.customer_name || "Client"}
                    </h3>
                    <Badge
                      className={
                        s.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-rose-100 text-rose-800 font-bold"
                      }
                    >
                      {s.status === "resolved" ? "🟢 Resolved Remotely" : "🚨 Dispatched to Breakdown Job"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Summary: <strong>{s.resolution_summary || "Technical guidance provided."}</strong>
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>Duration: <strong>{s.duration_minutes} mins</strong></p>
                  <p>Engineer: <strong>{s.engineer_name || "Technician"}</strong></p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Log Remote Session Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-500" /> Log Remote Support Session
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLogSession} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, customer_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Support Channel</Label>
                <Select
                  value={formData.support_channel}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, support_channel: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">📞 Phone Support</SelectItem>
                    <SelectItem value="whatsapp">💬 WhatsApp Video/Call</SelectItem>
                    <SelectItem value="anydesk">💻 AnyDesk Remote</SelectItem>
                    <SelectItem value="teamviewer">🖥️ TeamViewer</SelectItem>
                    <SelectItem value="fanuc_focas">⚙️ Fanuc FOCAS Access</SelectItem>
                    <SelectItem value="siemens_remote">🔌 Siemens Remote Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resolution Notes / Diagnosis</Label>
              <Textarea
                placeholder="Explain the troubleshooting steps taken or reason field trip is required..."
                value={formData.resolution_summary}
                onChange={(e) => setFormData((prev) => ({ ...prev, resolution_summary: e.target.value }))}
                rows={3}
                required
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
              <div>
                <p className="text-sm font-bold">Issue Resolved Remotely?</p>
                <p className="text-xs text-slate-500">If toggled OFF, a Breakdown Job will automatically be created for field dispatch.</p>
              </div>
              <Switch
                checked={formData.is_resolved}
                onCheckedChange={(val) => setFormData((prev) => ({ ...prev, is_resolved: val }))}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                {submitting ? "Logging..." : "Log Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
