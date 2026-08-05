"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { Navigation, MapPin, Zap, CheckCircle2, Clock } from "lucide-react"

export default function RouteOptimizationPage() {
  const [route, setRoute] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const res = await apiClient<any>("/api/route-optimization", {
        method: "POST",
        body: JSON.stringify({
          engineer_name: "Senior Field Engineer",
          stops: ["Plant A - Peenya Industrial", "Plant B - Bommasandra", "Plant C - Electronic City"],
        }),
      })
      if (res?.summary) setRoute(res.summary)
      toast.success("Dispatch route optimized!")
    } catch (err: any) {
      toast.error(err.message || "Failed to optimize route")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Navigation className="h-8 w-8 text-indigo-500" /> Technician Dispatch Route Optimization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculate shortest travel paths, fuel savings, and arrival times for multi-stop engineer dispatches
          </p>
        </div>
        <Button onClick={handleOptimize} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
          <Zap className="h-4 w-4" /> {loading ? "Optimizing..." : "Calculate Optimized Route"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Stops</p>
          <h2 className="text-3xl font-black text-indigo-400 mt-1">{route?.total_stops || 3} Plant Locations</h2>
        </Card>

        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <p className="text-xs font-semibold text-slate-400 uppercase">Estimated Travel Distance</p>
          <h2 className="text-3xl font-black text-emerald-400 mt-1">{route?.estimated_distance_km || 25.2} km</h2>
        </Card>

        <Card className="p-6 bg-slate-900 text-white rounded-3xl">
          <p className="text-xs font-semibold text-slate-400 uppercase">Estimated Travel Duration</p>
          <h2 className="text-3xl font-black text-amber-400 mt-1">{route?.estimated_travel_time_minutes || 66} mins</h2>
        </Card>
      </div>
    </div>
  )
}
