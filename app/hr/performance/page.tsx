"use client"

import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Award, Target, Star, Users, CheckCircle2 } from "lucide-react"

export default function HRPerformancePage() {
  return (
    <HRLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Performance Management System (PMS)
              </h1>
              <p className="text-sm text-muted-foreground">
                Employee goal tracking, quarterly reviews, KPIs, and performance ratings.
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-2">
            <Target className="h-3.5 w-3.5" />
            New Goal Cycle
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Top Performers</span>
                <Star className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">94.8%</div>
              <p className="text-xs text-muted-foreground mt-1">Met or exceeded quarterly KPIs</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Active Reviews</span>
                <Users className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">18</div>
              <p className="text-xs text-muted-foreground mt-1">Q3 Appraisal cycles in progress</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Completed Appraisals</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">42</div>
              <p className="text-xs text-muted-foreground mt-1">Finalized & signed off</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
