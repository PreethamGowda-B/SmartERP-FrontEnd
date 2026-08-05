"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { BookOpen, Search, Wrench, Clock, CheckCircle2, Cpu, Lightbulb } from "lucide-react"

export default function KnowledgeBasePage() {
  const [alarmKb, setAlarmKb] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchKb = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success?: boolean; items?: any[] }>("/api/ai/alarm-kb")
      if (res?.items) setAlarmKb(res.items)
      else setAlarmKb([
        {
          id: "1",
          controller_type: "Fanuc 0i-MF",
          alarm_code: "SV0401",
          title: "V-AXIS SERVO ALARM (VRDY OFF)",
          cause_description: "Servo amplifier ready signal turned off during axis movement or cable noise interference.",
          recommended_fix: "Check 24V supply on Servo Amp JF1 connector, inspect optical cable connectivity, replace encoder cable if noise persists.",
          occurrences_count: 48,
          solved_count: 47,
          avg_repair_hours: 1.8,
          common_spares: ["Fanuc Encoder Cable A660-2040", "Servo Amp Fuse 3.2A"],
        },
        {
          id: "2",
          controller_type: "Siemens 828D",
          alarm_code: "2001",
          title: "SPINDLE HEATING / OVERLOAD",
          cause_description: "Spindle motor cooling fan failure or clogged oil chiller heat exchanger.",
          recommended_fix: "Clean oil chiller radiator fins, verify 3-phase cooling fan rotation, replace spindle thermistor if faulty.",
          occurrences_count: 22,
          solved_count: 22,
          avg_repair_hours: 1.2,
          common_spares: ["Cooling Fan 24V DC", "Spindle Oil Filter"],
        },
      ])
    } catch (err: any) {
      toast.error(err.message || "Failed to load knowledge base")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKb()
  }, [fetchKb])

  const filtered = alarmKb.filter(
    (item) =>
      item.alarm_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.controller_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-amber-500" /> Engineer Knowledge Base (#32)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Company-wide CNC troubleshooting database & repair solutions feeding directly into SmartERP Intelligence AI
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by Alarm Code (e.g. SV0401), Controller, or Symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => (
          <Card key={item.id} className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-600 text-white font-mono font-bold text-xs">{item.alarm_code}</Badge>
                  <Badge variant="outline" className="text-xs font-semibold">{item.controller_type}</Badge>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-2">{item.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-600 font-bold">
                  {Math.round((item.solved_count / item.occurrences_count) * 100)}% Solved
                </span>
                <p className="text-[10px] text-slate-400">({item.solved_count}/{item.occurrences_count} times)</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs space-y-2 border">
              <div>
                <strong className="text-slate-700 dark:text-slate-300">Root Cause:</strong>
                <p className="text-slate-600 dark:text-slate-400">{item.cause_description}</p>
              </div>
              <div className="pt-1 border-t">
                <strong className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" /> Recommended Solution:
                </strong>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{item.recommended_fix}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Avg Repair Time: {item.avg_repair_hours} hrs
              </div>
              <div className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-blue-500" /> Common Spares: {item.common_spares?.join(", ")}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
