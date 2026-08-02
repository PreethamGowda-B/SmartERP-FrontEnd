"use client"

import React, { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Clock, AlertCircle, Calendar, User, Phone, Mail, Send, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"

export default function OwnerAccountsReceivablePage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [buckets, setBuckets] = useState<any>({ current: 0, "1_30": 0, "31_60": 0, "60_plus": 0 })
  const [schedules, setSchedules] = useState<any[]>([])

  useEffect(() => {
    fetchARAging()
  }, [])

  const fetchARAging = async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; buckets: any; schedules: any[] }>("/api/finance/ar-aging")
      if (res && res.success) {
        setBuckets(res.buckets || { current: 0, "1_30": 0, "31_60": 0, "60_plus": 0 })
        setSchedules(res.schedules || [])
      }
    } catch (err: any) {
      toast({ title: "Error loading AR aging", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async (scheduleId: string) => {
    try {
      await apiClient(`/api/finance/ar-aging/${scheduleId}/reminder`, { method: "POST" })
      toast({ title: "Reminder Dispatched", description: "Payment collection reminder sent to customer." })
    } catch (err: any) {
      toast({ title: "Reminder Failed", description: err.message, variant: "destructive" })
    }
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" /> Accounts Receivable Aging & Reminders
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track invoice aging buckets (0–30, 31–60, 60+ days) and dispatch automated collection reminders.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={fetchARAging} disabled={loading} className="h-9 text-xs font-bold rounded-xl">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh AR Aging
          </Button>
        </div>

        {/* Aging Buckets Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">Current (0–30 Days)</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              ₹{Number(buckets.current || 0).toLocaleString("en-IN")}
            </div>
          </Card>

          <Card className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-300">31–60 Days Overdue</div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
              ₹{Number(buckets["1_30"] || 0).toLocaleString("en-IN")}
            </div>
          </Card>

          <Card className="rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-orange-800 dark:text-orange-300">61–90 Days Overdue</div>
            <div className="text-2xl font-black text-orange-700 dark:text-orange-400 mt-1">
              ₹{Number(buckets["31_60"] || 0).toLocaleString("en-IN")}
            </div>
          </Card>

          <Card className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-rose-800 dark:text-rose-300">90+ Days Critical</div>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
              ₹{Number(buckets["60_plus"] || 0).toLocaleString("en-IN")}
            </div>
          </Card>
        </div>

        {/* Collection Schedule Table */}
        <Card className="rounded-2xl border border-border/70 overflow-hidden">
          <CardHeader className="p-4 border-b border-border/40">
            <CardTitle className="text-base font-extrabold">Active Collection Schedules & Reminders</CardTitle>
            <CardDescription className="text-xs">Outstandings requiring follow-up</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs font-bold">No overdue collection schedules recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b uppercase font-extrabold">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5 text-right">Due Amount</th>
                      <th className="p-3.5 text-center">Days Overdue</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-foreground">{sch.invoice_number}</td>
                        <td className="p-3.5 font-semibold text-foreground">{sch.customer_name || "Client"}</td>
                        <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                          ₹{Number(sch.amount_due || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge variant="outline" className="text-[10px] font-bold text-rose-600 border-rose-300">
                            {sch.days_overdue || 0} days
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold rounded-lg" onClick={() => handleSendReminder(sch.id)}>
                            <Send className="h-3 w-3 mr-1 text-amber-600" /> Send Reminder
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
