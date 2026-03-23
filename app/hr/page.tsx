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
    upcomingAnniversaries: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        // In a real scenario, we'd have a specific HR stats endpoint.
        // For now, we'll fetch from existing endpoints or simulate.
        const [empRes, leaveRes] = await Promise.all([
          apiClient("/api/employees"),
          apiClient("/api/hr/leaves")
        ])
        
        setStats({
          totalEmployees: empRes?.length || 0,
          presentToday: Math.floor((empRes?.length || 0) * 0.8), // Simulation for now
          pendingLeaves: leaveRes?.filter((l: any) => l.status === 'pending').length || 0,
          upcomingAnniversaries: 2 // Simulation
        })
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
      title: "Anniversaries",
      value: stats.upcomingAnniversaries,
      description: "Next 7 days",
      icon: Calendar,
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
                 {[1, 2, 3].map((_, i) => (
                   <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0 border-border/50">
                     <div className="p-2 bg-muted rounded-full mt-1">
                       <AlertCircle className="h-3 w-3" />
                     </div>
                     <div>
                       <p className="text-sm font-medium">New leave request submitted</p>
                       <p className="text-xs text-muted-foreground">2 hours ago</p>
                     </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
