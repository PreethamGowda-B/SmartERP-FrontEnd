"use client"

import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, UserX, FileText, CheckCircle2 } from "lucide-react"

export default function HRExitPage() {
  return (
    <HRLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <LogOut className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Employee Exit & Offboarding Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage resignation requests, asset clearance, exit interviews, and final settlement (FnF).
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-2">
            <UserX className="h-3.5 w-3.5" />
            Initiate Exit Clearance
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Active Offboardings</span>
                <UserX className="h-4 w-4 text-rose-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">2</div>
              <p className="text-xs text-muted-foreground mt-1">Pending notice period clearance</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Asset Handover</span>
                <FileText className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">100%</div>
              <p className="text-xs text-muted-foreground mt-1">IT hardware & key return rate</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>FnF Settlements</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">18</div>
              <p className="text-xs text-muted-foreground mt-1">Completed full & final payouts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
