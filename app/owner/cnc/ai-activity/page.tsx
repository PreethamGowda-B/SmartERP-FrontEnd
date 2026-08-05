"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { Bot, Clock, ShieldCheck, CheckCircle2, History } from "lucide-react"

export default function AiActivityCenterPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; activities: any[] }>("/api/ai/copilot/activity")
      if (res?.activities) setActivities(res.activities)
    } catch (err: any) {
      toast.error(err.message || "Failed to load AI activity log")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Bot className="h-8 w-8 text-amber-500" /> Enterprise AI Activity Center & Audit Trail
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit log of all AI prompts, multi-step workflow executions, approvals, and system calls
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">No AI copilot activities logged yet.</Card>
        ) : (
          activities.map((act) => (
            <Card key={act.id} className="p-5 border space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-amber-600 border-amber-300">
                      Level {act.execution_level || 1} Action
                    </Badge>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">User: {act.user_name || "User"}</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Prompt: <strong>"{act.prompt}"</strong></p>
                </div>
                <Badge className="bg-emerald-500 text-white font-bold">{act.approval_status}</Badge>
              </div>
              <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border">
                Result: {act.result_summary}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
