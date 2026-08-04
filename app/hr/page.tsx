"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  UserPlus,
  Inbox,
  Laptop,
  Award,
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function HRDashboard() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<any>({
    totalHeadcount: 0,
    presentToday: 0,
    lateToday: 0,
    pendingRequests: 0,
    activeRecruitment: 0,
    assignedAssets: 0
  })
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHrData = async () => {
    try {
      setLoading(true)
      const [analyticsRes, requestsRes] = await Promise.all([
        apiClient("/api/hr/analytics").catch(() => ({ analytics: {} })),
        apiClient("/api/hr/requests?status=pending").catch(() => ({ requests: [] }))
      ])

      if (analyticsRes?.analytics) setAnalytics(analyticsRes.analytics)
      if (Array.isArray(requestsRes?.requests)) setRequests(requestsRes.requests)
    } catch (error) {
      logger.error("Failed to fetch HR dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHrData()
  }, [])

  const handleReviewRequest = async (id: number, status: "approved" | "rejected") => {
    try {
      await apiClient(`/api/hr/requests/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, hr_comments: `Processed by HR Manager` })
      })
      toast({
        title: `Request ${status.toUpperCase()}`,
        description: `Employee request #${id} updated successfully.`
      })
      fetchHrData()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to process request", variant: "destructive" })
    }
  }

  return (
    <HRLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-indigo-600 to-accent bg-clip-text text-transparent">
              HR People Operations Console
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Master workforce administration, employee lifecycle, attendance, & ESS requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-bold rounded-xl"
              onClick={() => window.location.href = "/hr/recruitment"}
            >
              <UserPlus className="h-4 w-4 mr-1.5" /> Add Candidate
            </Button>
            <Button
              size="sm"
              className="h-9 px-3 text-xs font-bold rounded-xl bg-primary text-primary-foreground"
              onClick={() => window.location.href = "/hr/requests"}
            >
              <Inbox className="h-4 w-4 mr-1.5" /> Request Inbox ({analytics.pendingRequests})
            </Button>
          </div>
        </div>

        {/* 6 Key Analytics Stat Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="premium-card border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-600" />
                <Badge variant="outline" className="bg-blue-100 text-blue-800 text-[10px]">Headcount</Badge>
              </div>
              <p className="text-2xl font-black mt-2 text-foreground">{analytics.totalHeadcount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active Employees</p>
            </CardContent>
          </Card>

          <Card className="premium-card border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 text-[10px]">Present</Badge>
              </div>
              <p className="text-2xl font-black mt-2 text-emerald-600">{analytics.presentToday}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Clocked in today</p>
            </CardContent>
          </Card>

          <Card className="premium-card border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-amber-600" />
                <Badge variant="outline" className="bg-amber-100 text-amber-800 text-[10px]">Late</Badge>
              </div>
              <p className="text-2xl font-black mt-2 text-amber-600">{analytics.lateToday}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Late marks today</p>
            </CardContent>
          </Card>

          <Card className="premium-card border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Inbox className="h-5 w-5 text-purple-600" />
                <Badge variant="outline" className="bg-purple-100 text-purple-800 text-[10px]">Pending</Badge>
              </div>
              <p className="text-2xl font-black mt-2 text-purple-600">{analytics.pendingRequests}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">ESS Requests</p>
            </CardContent>
          </Card>

          <Card className="premium-card border-indigo-500/20 bg-indigo-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 text-[10px]">Recruitment</Badge>
              </div>
              <p className="text-2xl font-black mt-2 text-indigo-600">{analytics.activeRecruitment}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active candidates</p>
            </CardContent>
          </Card>

          <Card className="premium-card border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Laptop className="h-5 w-5 text-rose-600" />
                <Badge variant="outline" className="bg-rose-100 text-rose-800 text-[10px]">Assets</Badge>
              </div>
              <p className="text-2xl font-black mt-2 text-rose-600">{analytics.assignedAssets}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Assigned items</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Queue Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Pending Employee Requests Inbox</h2>
              <p className="text-xs text-muted-foreground">Review leave applications, attendance corrections, & advance requests</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-primary"
              onClick={() => window.location.href = "/hr/requests"}
            >
              View All Requests <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {requests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                <p className="text-sm font-bold text-foreground">No pending requests</p>
                <p className="text-xs mt-0.5">All employee ESS applications have been processed cleanly.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.slice(0, 4).map((req) => (
                <Card key={req.id} className="premium-card border hover:border-primary/40 transition-all">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{req.employee_name}</span>
                        <Badge variant="outline" className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary border-primary/20">
                          {req.request_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {typeof req.details === "object" ? JSON.stringify(req.details) : req.details}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-xl border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        onClick={() => handleReviewRequest(req.id, "approved")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-xl border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
                        onClick={() => handleReviewRequest(req.id, "rejected")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  )
}

  return (
    <HRLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your team today, {format(new Date(), "EEEE, MMMM do")}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-default">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "..." : card.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
}
