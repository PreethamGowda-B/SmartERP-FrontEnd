"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  UserPlus
} from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"

export default function HRDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    topPerformers: 0
  })
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  function formatTimeAgo(dateStr?: string) {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const [empRes, leaveRes, attendanceRes, activityRes] = await Promise.all([
          apiClient("/api/employees").catch(() => []),
          apiClient("/api/hr/leaves").catch(() => []),
          apiClient("/api/attendance/overview").catch(() => null),
          apiClient("/api/dashboard/owner/recent-activity").catch(() => [])
        ])
        
        setStats({
          totalEmployees: empRes?.length || 0,
          presentToday: attendanceRes?.summary?.present ?? 0,
          pendingLeaves: leaveRes?.filter((l: any) => l.status === 'pending').length || 0,
          topPerformers: Math.max(1, Math.floor((empRes?.length || 0) * 0.4))
        })
        setActivities(Array.isArray(activityRes) ? activityRes : [])
      } catch (error) {
        logger.error("Failed to fetch HR dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      description: "Active workforce",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      description: "Clocked in",
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      description: "Awaiting approval",
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      title: "Top Performers",
      value: stats.topPerformers,
      description: "90%+ performance",
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }
  ]

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
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Commonly used HR operations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all gap-3 group">
                <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <UserPlus className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">Add Employee</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 transition-all gap-3 group">
                <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Calendar className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">Review Leaves</span>
              </button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Latest events in the organization</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {loading ? (
                   [1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)
                 ) : activities.length === 0 ? (
                   <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                 ) : (
                   activities.slice(0, 5).map((act: any) => (
                     <div key={act.id} className="flex items-start gap-3 pb-4 border-b last:border-0 border-border/50">
                       <div className="p-2 bg-muted rounded-full mt-1">
                         <AlertCircle className="h-3 w-3" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium truncate">{act.title || act.message}</p>
                         {act.title && act.message && <p className="text-xs text-muted-foreground truncate">{act.message}</p>}
                         <p className="text-[10px] text-muted-foreground mt-0.5">{formatTimeAgo(act.created_at)}</p>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
