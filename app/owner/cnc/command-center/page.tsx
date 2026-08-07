"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Activity, Cpu, Wrench, ShieldAlert, Monitor, Clock, Users, DollarSign, AlertTriangle, ArrowUpRight, Radio, RefreshCw, PackageCheck, History
} from "lucide-react"

export default function CommandCenterPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchCommandCenter = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; command_center: any }>("/api/command-center")
      if (res?.command_center) setData(res.command_center)
    } catch (err: any) {
      toast.error(err.message || "Failed to load Command Center payload")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommandCenter()
    const interval = setInterval(fetchCommandCenter, 30000) // 30s auto-refresh
    return () => clearInterval(interval)
  }, [fetchCommandCenter])

  if (loading && !data) return <div className="p-12 text-center text-slate-500">Connecting to Executive Command Center...</div>

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-rose-500 animate-pulse" /> Executive CNC Operations Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live operations telemetry, technician radar, SLA warnings, active dispatches, and inventory movements
          </p>
        </div>
        <Button onClick={() => fetchCommandCenter()} variant="outline" className="font-bold text-xs gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh Telemetry
        </Button>
      </div>

      {/* Metrics Ticker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          onClick={() => router.push("/owner/jobs")}
          className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-300 dark:border-amber-900 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Active Field Jobs</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{data?.active_jobs_total || 0}</h2>
            </div>
            <Wrench className="h-8 w-8 text-amber-500" />
          </div>
        </Card>

        <Card
          onClick={() => router.push("/owner/machines")}
          className="p-5 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-300 dark:border-rose-900 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-400">Machines Down</p>
              <h2 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{data?.machines_breakdown || 0}</h2>
            </div>
            <AlertTriangle className="h-8 w-8 text-rose-500" />
          </div>
        </Card>

        <Card
          onClick={() => router.push("/owner/cnc/sla")}
          className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-300 dark:border-purple-900 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-800 dark:text-purple-400">SLA Breaches</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{data?.sla_breaches_total || 0}</h2>
            </div>
            <ShieldAlert className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card
          onClick={() => router.push("/owner/attendance")}
          className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-300 dark:border-emerald-900 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Technicians Online</p>
              <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{data?.technicians_online || 0}</h2>
            </div>
            <Users className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
      </div>

      {/* Top Alarm Codes & Live Dispatches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-amber-500" /> Breakdown Alarm Diagnostics
            </CardTitle>
            <CardDescription>Frequency breakdown of active CNC alarm codes</CardDescription>
          </CardHeader>
          <div className="space-y-3 pt-2">
            {!data?.top_alarm_codes || data.top_alarm_codes.length === 0 ? (
              <p className="text-xs text-slate-400">No active breakdown alarms reported.</p>
            ) : (
              data.top_alarm_codes.map((alm: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex items-center justify-between">
                  <div>
                    <Badge className="bg-rose-600 text-white font-mono font-bold">{alm.alarm_code}</Badge>
                    <p className="text-xs text-slate-500 mt-1">High Priority Diagnostic Code</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{alm.frequency} Jobs</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-indigo-500" /> Recent Inventory Movements
            </CardTitle>
            <CardDescription>Material requests and spare part allocations</CardDescription>
          </CardHeader>
          <div className="space-y-3 pt-2">
            {!data?.recent_inventory_movements || data.recent_inventory_movements.length === 0 ? (
              <p className="text-xs text-slate-400">No recent inventory movements logged.</p>
            ) : (
              data.recent_inventory_movements.map((inv: any) => (
                <div key={inv.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{inv.item_name}</h4>
                    <p className="text-[11px] text-slate-500">Qty: {inv.quantity} • Req by: {inv.requested_by || 'Technician'}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">{inv.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Live Recent Service Tickets */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Recent Service Requests & Dispatches</CardTitle>
            <CardDescription>Live job status pipeline from customer creation to technician signoff</CardDescription>
          </div>
          <Button onClick={() => router.push("/owner/jobs")} variant="ghost" size="sm" className="text-xs font-bold text-amber-600">
            View All Jobs →
          </Button>
        </CardHeader>
        <div className="space-y-3 pt-2">
          {!data?.recent_jobs || data.recent_jobs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No recent service requests created.</p>
          ) : (
            data.recent_jobs.map((job: any) => (
              <div key={job.id} onClick={() => router.push(`/owner/jobs`)} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between hover:bg-slate-100 cursor-pointer transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{job.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{job.service_type || 'service'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Customer: {job.customer_name || 'Customer'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={job.priority === 'urgent' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}>
                    {job.priority}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">{job.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Live System Audit Trail */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-rose-500" /> Live System Audit Trail
            </CardTitle>
            <CardDescription>Immutable record of cross-module system actions and approvals</CardDescription>
          </div>
          <Button onClick={() => router.push("/owner/cnc/ai-activity")} variant="ghost" size="sm" className="text-xs font-bold text-amber-600">
            Audit Center →
          </Button>
        </CardHeader>
        <div className="space-y-2 pt-2">
          {!data?.recent_activities || data.recent_activities.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No system audit activities recorded yet.</p>
          ) : (
            data.recent_activities.map((act: any) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">{act.action}</span>
                <span className="text-slate-400 font-mono">{new Date(act.created_at || act.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
