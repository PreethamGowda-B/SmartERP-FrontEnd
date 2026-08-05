"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import {
  Cpu, Wrench, ShieldCheck, Activity, Calendar, Clock, FileText, CheckCircle2, AlertTriangle, ArrowLeft, Plus, Download, HardDrive
} from "lucide-react"

export default function MachineDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const machineId = params.id as string

  const [machineData, setMachineData] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMachineProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; machine: any }>(`/api/machines/${machineId}`)
      if (res?.machine) {
        setMachineData(res.machine)
      }
      const tRes = await apiClient<{ success: boolean; timeline: any[] }>(`/api/machines/${machineId}/timeline`)
      if (tRes?.timeline) {
        setTimeline(tRes.timeline)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load machine profile")
    } finally {
      setLoading(false)
    }
  }, [machineId])

  useEffect(() => {
    if (machineId) fetchMachineProfile()
  }, [machineId, fetchMachineProfile])

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading CNC Machine Profile...</div>
  }

  if (!machineData) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Machine Not Found</h2>
        <Button onClick={() => router.back()}>← Back to Machine Registry</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Navigation Back */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-slate-600 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to Machines
      </Button>

      {/* Machine Header */}
      <Card className="p-6 bg-slate-900 text-white rounded-3xl border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Cpu className="h-9 w-9 text-amber-400" />
              <div>
                <h1 className="text-2xl md:text-3xl font-black">{machineData.machine_name}</h1>
                <p className="text-xs text-slate-400 font-mono">S/N: {machineData.serial_number} • Customer: {machineData.customer_name || "N/A"}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                Controller: {machineData.controller_type}
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">
                Make: {machineData.make} {machineData.model}
              </Badge>
              <Badge
                className={
                  machineData.status === "breakdown"
                    ? "bg-rose-500 text-white font-bold"
                    : "bg-emerald-500 text-white font-bold"
                }
              >
                {machineData.status === "breakdown" ? "🚨 Breakdown" : "🟢 Operational"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
            <div className="text-center px-2">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Health Score</p>
              <h2 className="text-3xl font-black text-emerald-400">{machineData.health_score || 100}%</h2>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Spindle Hours</p>
              <h2 className="text-2xl font-black text-white">{machineData.spindle_hours || 0} hrs</h2>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid grid-cols-3 md:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <TabsTrigger value="timeline" className="rounded-xl font-bold text-xs">
            📜 17-Step Lifecycle Timeline
          </TabsTrigger>
          <TabsTrigger value="subcomponents" className="rounded-xl font-bold text-xs">
            🧩 Sub-Components ({machineData.subcomponents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-xl font-bold text-xs">
            📁 Machine Documents ({machineData.documents?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* 17-Step Timeline Tab */}
        <TabsContent value="timeline" className="mt-6 space-y-4">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Machine Event Lifecycle Timeline
              </CardTitle>
              <CardDescription>Full audit log of installations, AMC start, breakdown jobs, replaced spares, and invoices</CardDescription>
            </CardHeader>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 py-2">
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-400 pl-6">No timeline events recorded yet.</p>
              ) : (
                timeline.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
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
        </TabsContent>

        {/* Sub-Components Tab */}
        <TabsContent value="subcomponents" className="mt-6 space-y-4">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-blue-500" /> Sub-Component Equipment Inventory
                </CardTitle>
                <CardDescription>Track Servo Drives, Spindle Motors, Tool Magazines, and Hydraulics</CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {machineData.subcomponents?.length === 0 ? (
                <p className="text-xs text-slate-400">No sub-components registered.</p>
              ) : (
                machineData.subcomponents?.map((sub: any) => (
                  <Card key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sub.name}</h4>
                        <p className="text-xs text-slate-500 font-mono">Type: {sub.component_type}</p>
                      </div>
                      <Badge variant="outline">{sub.make_model || "Generic"}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6 space-y-4">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" /> Machine Documents & Drawings
              </CardTitle>
              <CardDescription>User Manuals, Electrical Schematics, PLC Ladder Backups, and Parameter files</CardDescription>
            </CardHeader>

            <div className="space-y-3 pt-2">
              {machineData.documents?.length === 0 ? (
                <p className="text-xs text-slate-400">No machine documents uploaded yet.</p>
              ) : (
                machineData.documents?.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-mono">{doc.document_type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" /> Download
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
