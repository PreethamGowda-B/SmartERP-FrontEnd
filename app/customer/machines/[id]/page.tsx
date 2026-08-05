"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { Cpu, Clock, ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react"

export default function CustomerMachineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const machineId = params.id as string

  const [machine, setMachine] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; machine: any }>(`/api/machines/${machineId}`)
      if (res?.machine) setMachine(res.machine)
      const tRes = await apiClient<{ success: boolean; timeline: any[] }>(`/api/machines/${machineId}/timeline`)
      if (tRes?.timeline) setTimeline(tRes.timeline)
    } catch (err: any) {
      toast.error(err.message || "Failed to load machine timeline")
    } finally {
      setLoading(false)
    }
  }, [machineId])

  useEffect(() => {
    if (machineId) fetchData()
  }, [machineId, fetchData])

  if (loading) return <div className="p-12 text-center text-slate-500">Loading machine timeline...</div>

  if (!machine) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Machine Not Found</h2>
        <Button onClick={() => router.back()}>← Back</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Back to My CNC Machinery
      </Button>

      <Card className="p-6 bg-slate-900 text-white rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="h-8 w-8 text-amber-400" />
            <div>
              <h1 className="text-2xl font-black">{machine.machine_name}</h1>
              <p className="text-xs text-slate-400 font-mono">S/N: {machine.serial_number} • Controller: {machine.controller_type}</p>
            </div>
          </div>
          <Badge className="bg-emerald-500 text-white font-bold">{machine.status || "Operational"}</Badge>
        </div>
      </Card>

      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Customer Machine Service Timeline
          </CardTitle>
          <CardDescription>Simplified service, PM, breakdown, and warranty progress history</CardDescription>
        </CardHeader>

        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 py-2">
          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400 pl-6">No service timeline entries recorded yet.</p>
          ) : (
            timeline.map((evt, idx) => (
              <div key={evt.id || idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{evt.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(evt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{evt.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
