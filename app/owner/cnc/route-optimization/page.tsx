"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "lucide-react"

export default function RouteOptimizationPage() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-5">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-slate-900 dark:text-white">
          <Navigation className="h-8 w-8 text-indigo-500" /> Technician Dispatch Route Optimization
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Route calculation is not available yet.
        </p>
      </div>

      <Card role="status" className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Optimization unavailable</CardTitle>
          <CardDescription>
            This page does not calculate, save, or estimate travel routes. Distance, travel time, arrival times, and fuel savings are not available until a verified routing implementation is added.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
