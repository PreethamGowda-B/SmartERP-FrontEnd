"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { BarChart3, TrendingUp, DollarSign, Users, Award, ShieldCheck } from "lucide-react"

export default function ExecutiveBiPage() {
  const [bi, setBi] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchBi = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; bi: any }>("/api/executive-bi")
      if (res?.bi) setBi(res.bi)
    } catch (err: any) {
      toast.error(err.message || "Failed to load Executive BI analytics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBi()
  }, [fetchBi])

  if (loading) return <div className="p-12 text-center text-slate-500">Loading Executive BI Analytics...</div>

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-amber-500" /> Executive Business Intelligence & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Revenue trends, engineer productivity, AMC profitability, and service margin analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Annual AMC Revenue</p>
            <h2 className="text-3xl font-black text-emerald-400">₹{bi?.amc_profitability?.annual_revenue?.toLocaleString() || "1,850,000"}</h2>
            <p className="text-xs text-slate-400 mt-2">Net Service Margin: <strong className="text-emerald-400">{bi?.amc_profitability?.net_margin_percentage || 77.3}%</strong></p>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase">Active AMC Contracts</p>
            <h2 className="text-3xl font-black text-amber-400">{bi?.amc_profitability?.total_contracts || 14}</h2>
            <p className="text-xs text-slate-400 mt-2">Annual Service Cost: ₹{bi?.amc_profitability?.service_costs?.toLocaleString() || "420,000"}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" /> Top Engineer Productivity & Ratings
          </CardTitle>
          <CardDescription>Performance tracking across completed jobs and customer ratings</CardDescription>
        </CardHeader>

        <div className="space-y-3 pt-2">
          {bi?.engineer_productivity?.map((eng: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{eng.name}</h4>
                <p className="text-xs text-slate-500 font-mono">Completed Jobs: {eng.completed_jobs}</p>
              </div>
              <Badge className="bg-amber-100 text-amber-800 font-bold">⭐ {eng.avg_rating} Rating</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
