"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"

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
            Monitor response time, dispatch time, travel time, work duration, and SLA breach warnings
          </p>
        </div>
      </div>

      {/* Compliance Meter */}
      <Card className="p-6 bg-slate-900 text-white rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">SLA Compliance Rate</p>
            <h2 className="text-4xl font-black text-emerald-400 mt-1">{metrics?.sla_compliance_percentage || 100}%</h2>
          </div>
          <ShieldCheck className="h-12 w-12 text-emerald-400/80" />
        </div>
      </Card>

      {/* Jobs Monitored List */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold">Monitored Service Jobs</CardTitle>
          <CardDescription>SLA target vs actual response & resolution performance</CardDescription>
        </CardHeader>

        <div className="space-y-3 pt-2">
          {jobs.map((j) => (
            <div key={j.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{j.title}</h4>
                <p className="text-xs text-slate-500">Target: {j.sla_target_hours || 4} hrs</p>
              </div>
              <Badge className={j.sla_status === "breached" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}>
                {j.sla_status === "breached" ? "🚨 SLA Breached" : "🟢 On Track"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
