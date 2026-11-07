"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import {
  Navigation,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Plus,
  Trash2,
  ExternalLink,
  Fuel,
  CheckCircle2,
  Car,
  RefreshCw,
  Send,
} from "lucide-react"

type ActiveDispatch = {
  job_id: string | number
  job_title: string
  engineer_name: string
  customer_name: string
  location: string
  priority: string
  status: string
}

type CalculatedRoute = {
  stops: string[]
  total_stops: number
  total_distance_km: number
  estimated_duration_minutes: number
  estimated_fuel_allowance_inr: number
  google_maps_url: string
  legs: Array<{
    leg_number: number
    from_location: string
    to_location: string
    distance_km: number
    duration_minutes: number
  }>
  calculated_at: string
}

export default function RouteOptimizationPage() {
  const [activeDispatches, setActiveDispatches] = useState<ActiveDispatch[]>([])
  const [loadingDispatches, setLoadingDispatches] = useState(true)
  const [engineerName, setEngineerName] = useState("")
  const [stops, setStops] = useState<string[]>([
    "Main CNC Workshop & Service Center",
    "Peenya Industrial Area, Phase 2",
    "Bommasandra Industrial Area",
  ])
  const [, setCalculating] = useState(false)
  const [routeResult, setRouteResult] = useState<CalculatedRoute | null>(null)

  const fetchDispatches = useCallback(async () => {
    try {
      setLoadingDispatches(true)
      const res = await apiClient<{ success: boolean; active_dispatches: ActiveDispatch[] }>("/api/route-optimization")
      if (res?.active_dispatches) {
        setActiveDispatches(res.active_dispatches)
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoadingDispatches(false)
    }
  }, [])

  useEffect(() => {
    fetchDispatches()
  }, [fetchDispatches])

  const handleAddStop = () => {
    if (stops.length >= 8) {
      toast.warning("Maximum 8 stops per dispatch trip.")
      return
    }
    setStops([...stops, ""])
  }

  const handleRemoveStop = (index: number) => {
    if (stops.length <= 2) {
      toast.warning("At least 2 stop locations are required to plan a route.")
      return
    }
    setStops(stops.filter((_, i) => i !== index))
  }

  const handleUpdateStop = (index: number, val: string) => {
    const updated = [...stops]
    updated[index] = val
    setStops(updated)
  }

  const handleQuickAddFromDispatch = (dispatch: ActiveDispatch) => {
    const locationName = `${dispatch.customer_name} (${dispatch.location || "Site"})`
    if (!stops.includes(locationName)) {
      setStops([...stops, locationName])
      if (!engineerName && dispatch.engineer_name) {
        setEngineerName(dispatch.engineer_name)
      }
      toast.success(`Added ${dispatch.customer_name} to trip stops.`)
    }
  }

  const handleCalculateRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    const validStops = stops.map((s) => s.trim()).filter(Boolean)
    if (validStops.length < 2) {
      toast.error("Please provide at least 2 non-empty stop locations.")
      return
    }

    setCalculating(true)
    try {
      const res = await apiClient<{ success: boolean; route: CalculatedRoute }>("/api/route-optimization", {
        method: "POST",
        body: JSON.stringify({
          stops: validStops,
          engineer_name: engineerName.trim() || "Field Service Engineer",
        }),
      })

      if (res?.route) {
        setRouteResult(res.route)
        toast.success("Optimized dispatch route calculated successfully!")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate optimized route.")
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Navigation className="h-8 w-8 text-emerald-600" /> Technician Dispatch Route Optimization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Active dispatches are available below. Route distances, travel times, and fuel estimates require a routing provider, which is not configured yet.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDispatches} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loadingDispatches ? "animate-spin" : ""}`} /> Refresh Active Jobs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Route Builder */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Compass className="h-5 w-5 text-emerald-600" /> Multi-Stop Dispatch Builder
              </CardTitle>
              <CardDescription>
                Define the service stops in order. SmartERP calculates leg-by-leg distance, travel duration, and creates a ready-to-navigate Google Maps route.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculateRoute} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="engineer-name">Assigned Field Engineer / Vehicle</Label>
                  <Input
                    id="engineer-name"
                    placeholder="e.g. Ramesh Kumar (KA-04-ME-1284)"
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">
                      Waypoints / Service Stops ({stops.length})
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddStop}
                      className="h-8 text-xs gap-1 border-dashed"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Waypoint
                    </Button>
                  </div>

                  {stops.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {idx === 0 ? "🏁" : idx === stops.length - 1 ? "🎯" : idx + 1}
                      </div>
                      <Input
                        required
                        placeholder={
                          idx === 0
                            ? "Origin (e.g. Service Workshop)"
                            : idx === stops.length - 1
                            ? "Final Stop or Return Workshop"
                            : `Customer Site #${idx}`
                        }
                        value={stop}
                        onChange={(e) => handleUpdateStop(idx, e.target.value)}
                        className="text-sm"
                      />
                      {stops.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStop(idx)}
                          className="h-9 w-9 text-slate-400 hover:text-rose-600 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button
                    type="submit"
                    disabled
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                  >
                    <Navigation className="h-4 w-4" /> Routing Provider Not Configured
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick-Pick from Active Dispatches */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Active Service Dispatches Ready for Routing</span>
                <Badge variant="outline" className="text-xs font-mono">{activeDispatches.length} active</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Click any active job below to quickly append its customer site as a waypoint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDispatches ? (
                <p className="text-xs text-slate-400 py-2">Loading active dispatches...</p>
              ) : activeDispatches.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No open field service jobs currently waiting for routing.</p>
              ) : (
                <div className="space-y-2">
                  {activeDispatches.map((job) => (
                    <div
                      key={job.job_id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{job.job_title}</p>
                        <p className="text-slate-500 truncate mt-0.5">
                          {job.customer_name} • Tech: {job.engineer_name}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleQuickAddFromDispatch(job)}
                        className="h-7 text-xs shrink-0 gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Stop
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Output: Route Metrics & Turn-by-Turn Legs */}
        <div className="lg:col-span-5 space-y-6">
          {routeResult ? (
            <Card className="border shadow-md bg-linear-to-b from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-slate-500 text-white font-semibold">Provider Result</Badge>
                  <span className="text-xs text-slate-400">
                    {new Date(routeResult.calculated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold mt-2">Trip Dispatch Summary</CardTitle>
                <CardDescription className="text-xs">
                  Assigned: {engineerName || "Field Technician"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {/* Metric Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border shadow-2xs">
                    <Car className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                    <p className="text-lg font-black text-slate-900 dark:text-white">{routeResult.total_distance_km} km</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Dist</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border shadow-2xs">
                    <Clock className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                    <p className="text-lg font-black text-slate-900 dark:text-white">{routeResult.estimated_duration_minutes}m</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Est. Time</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border shadow-2xs">
                    <Fuel className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                    <p className="text-lg font-black text-slate-900 dark:text-white">₹{routeResult.estimated_fuel_allowance_inr}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Allowance</p>
                  </div>
                </div>

                {/* Open in Google Maps */}
                <div className="pt-2">
                  <Button
                    asChild
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 gap-2 shadow-sm"
                  >
                    <a href={routeResult.google_maps_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Open Live Navigation in Google Maps
                    </a>
                  </Button>
                </div>

                {/* Waypoint Legs */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Turn-by-Turn Leg Schedule</p>
                  <div className="space-y-2">
                    {routeResult.legs.map((leg) => (
                      <div
                        key={leg.leg_number}
                        className="p-3 rounded-lg border bg-white dark:bg-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                          <span>Leg {leg.leg_number}</span>
                          <span className="text-emerald-600 font-mono">{leg.distance_km} km • ~{leg.duration_minutes} mins</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1">
                          <span className="truncate max-w-[45%] font-medium text-slate-800 dark:text-slate-300">{leg.from_location}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[45%] font-medium text-slate-800 dark:text-slate-300">{leg.to_location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed p-10 text-center text-slate-400 space-y-3">
              <Navigation className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Route Calculation Unavailable</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Configure a routing provider before calculating distances, travel times, directions, or fuel allowances.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
