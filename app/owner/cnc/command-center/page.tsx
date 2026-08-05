"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Activity, Cpu, Wrench, ShieldAlert, Monitor, Clock, Users, DollarSign, AlertTriangle, ArrowUpRight, Radio
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
  }, [fetchCommandCenter])

  if (loading) return <div className="p-12 text-center text-slate-500">Connecting to Executive Command Center...</div>

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-rose-500 animate-pulse" /> Executive CNC Operations Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time operations ticker, engineer radar, SLA compliance warnings, and machine breakdown dispatches
          </p>
        </div>
        <Button onClick={() => fetchCommandCenter()} variant="outline" className="font-bold text-xs gap-1.5">
          🔄 Refresh Operations Telemetry
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
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Active Jobs</p>
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
          onClick={() => router.push("/owner/remote-support")}
          className="p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-300 dark:border-indigo-900 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400">Active Remote Sessions</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{data?.remote_sessions_active || 0}</h2>
            </div>
            <Monitor className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Top Alarm Codes Feed */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Cpu className="h-5 w-5 text-amber-500" /> Top Active Machine Alarm Codes
          </CardTitle>
          <CardDescription>Frequency breakdown of alarm codes requiring technical dispatch</CardDescription>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {data?.top_alarm_codes?.length === 0 ? (
            <p className="text-xs text-slate-400">No active breakdown alarms reported.</p>
          ) : (
            data?.top_alarm_codes?.map((alm: any, idx: number) => (
              <Card key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
                <div>
                  <Badge className="bg-rose-600 text-white font-mono font-bold">{alm.alarm_code}</Badge>
                  <p className="text-xs text-slate-500 mt-1">High Priority Diagnostic</p>
                </div>
                <span className="text-lg font-black text-slate-900 dark:text-white">{alm.frequency} Jobs</span>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
