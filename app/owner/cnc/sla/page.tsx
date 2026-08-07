"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react"

export default function SlaMonitoringPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSla = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; metrics: any; jobs: any[] }>("/api/sla")
      if (res?.metrics) setMetrics(res.metrics)
      if (res?.jobs) setJobs(res.jobs)
    } catch (err: any) {
      toast.error(err.message || "Failed to load SLA compliance metrics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSla()
  }, [fetchSla])

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-purple-500" /> Enterprise SLA Monitoring Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of response time, travel duration, repair speed, and SLA breach countdowns
          </p>
        </div>
        <Button onClick={fetchSla} variant="outline" size="sm" className="font-bold text-xs gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh Timers
        </Button>
      </div>

      {/* Compliance Meter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-slate-900 text-white rounded-3xl md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">SLA Compliance Rate</p>
              <h2 className="text-4xl font-black text-emerald-400 mt-1">{metrics?.sla_compliance_percentage || 100}%</h2>
              <p className="text-xs text-slate-400 mt-2">Monitored Jobs: {metrics?.total_jobs_monitored || 0}</p>
            </div>
            <ShieldCheck className="h-12 w-12 text-emerald-400/80" />
          </div>
        </Card>

        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <p className="text-xs font-semibold text-slate-400 uppercase">Avg Response Time</p>
          <h2 className="text-3xl font-black text-purple-400 mt-1">{metrics?.average_response_minutes || 0} mins</h2>
        </Card>

        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <p className="text-xs font-semibold text-slate-400 uppercase">Avg Resolution Time</p>
          <h2 className="text-3xl font-black text-indigo-400 mt-1">{metrics?.average_resolution_minutes || 0} mins</h2>
        </Card>
      </div>

      {/* Monitored Jobs List */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold">Monitored Service Jobs</CardTitle>
          <CardDescription>Target vs actual response & repair durations per job</CardDescription>
        </CardHeader>

        <div className="space-y-3 pt-2">
          {jobs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No jobs currently under SLA monitoring.</p>
          ) : (
            jobs.map((j) => (
              <div key={j.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{j.title}</h4>
                    <Badge variant="outline" className="text-[10px] capitalize">{j.priority}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Target: <strong>{j.sla_target_hours || 4} hrs</strong> • Resp: {j.sla_response_minutes || 0}m • Travel: {j.sla_travel_minutes || 0}m • Repair: {j.sla_repair_minutes || 0}m
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={
                    j.sla_status === "breached" ? "bg-rose-500 text-white font-bold" :
                    j.sla_status === "warning" ? "bg-amber-500 text-white font-bold" :
                    "bg-emerald-500 text-white font-bold"
                  }>
                    {j.sla_status === "breached" ? "🚨 SLA Breached" :
                     j.sla_status === "warning" ? "⚠️ SLA Warning (<1h)" :
                     "🟢 On Track"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
