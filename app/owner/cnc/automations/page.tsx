"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { Zap, Plus, CheckCircle2, Sliders } from "lucide-react"

export default function AutomationCenterPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    rule_name: "",
    trigger_event: "machine_health_low",
    action_type: "auto_pm",
  })

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; rules: any[] }>("/api/automation-center")
      if (res?.rules) setRules(res.rules)
    } catch (err: any) {
      toast.error(err.message || "Failed to load automation rules")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiClient("/api/automation-center", {
        method: "POST",
        body: JSON.stringify(formData),
      })
      toast.success("Zero-Code Automation Rule activated!")
      setIsAddOpen(false)
      fetchRules()
    } catch (err: any) {
      toast.error(err.message || "Failed to create rule")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-500" /> Enterprise Zero-Code Automation Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure automated triggers for PM recommendations, SLA breach escalations, AMC expiry alerts, and stock reservations
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Create Automation Rule
        </Button>
      </div>

      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">No automation rules configured yet.</Card>
        ) : (
          rules.map((r) => (
            <Card key={r.id} className="p-5 border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{r.rule_name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Trigger: <strong>{r.trigger_event}</strong> ➔ Action: <strong>{r.action_type}</strong>
                </p>
              </div>
              <Badge className="bg-emerald-500 text-white font-bold">🟢 Active</Badge>
            </Card>
          ))
        )}
      </div>

      {/* Create Rule Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Create Automation Rule
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRule} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="e.g. Auto PM Trigger when Machine Health < 40%"
                value={formData.rule_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, rule_name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Select
                  value={formData.trigger_event}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, trigger_event: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="machine_health_low">Machine Health &lt; 40%</SelectItem>
                    <SelectItem value="sla_warning">SLA Threshold Reached</SelectItem>
                    <SelectItem value="amc_expiry">AMC Expiry &lt; 15 Days</SelectItem>
                    <SelectItem value="stock_low">Spare Stock Below Minimum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Action to Execute</Label>
                <Select
                  value={formData.action_type}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, action_type: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_pm">Schedule PM Recommendation</SelectItem>
                    <SelectItem value="notify_owner">Escalate SLA to Owner</SelectItem>
                    <SelectItem value="reserve_part">Reserve Stock Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {submitting ? "Saving..." : "Activate Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
