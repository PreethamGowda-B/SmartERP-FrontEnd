"use client"

import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, ShieldCheck, BookOpen, CheckCircle2 } from "lucide-react"

export default function HRTrainingPage() {
  return (
    <HRLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Training & Safety Compliance
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage employee onboarding programs, site safety certifications, and skill compliance.
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            New Training Program
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Active Courses</span>
                <BookOpen className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">12</div>
              <p className="text-xs text-muted-foreground mt-1">Compliance & technical modules</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Safety Compliant</span>
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">100%</div>
              <p className="text-xs text-muted-foreground mt-1">Field staff certified for site work</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Certifications Issued</span>
                <CheckCircle2 className="h-4 w-4 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">86</div>
              <p className="text-xs text-muted-foreground mt-1">Valid active certifications</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
