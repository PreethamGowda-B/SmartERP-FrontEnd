"use client"

import Head from "next/head"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { mockJobs, mockEmployees, mockAttendance, mockMaterialRequests } from "@/lib/data"
import { Building2, Users, Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Calendar } from "lucide-react"

export default function OwnerDashboard() {
  // --- SEO-friendly summary for Google ---
  const activeJobs = mockJobs.filter((job) => job.status === "active").length
  const totalEmployees = mockEmployees.filter((emp) => emp.status === "active").length
  const todayAttendance = mockAttendance.length
  const pendingRequests = mockMaterialRequests.filter((req) => req.status === "pending").length

  const totalBudget = mockJobs.reduce((sum, job) => sum + job.budget, 0)
  const totalSpent = mockJobs.reduce((sum, job) => sum + job.spent, 0)
  const budgetUtilization = (totalSpent / totalBudget) * 100

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create-job":
        window.location.href = "/owner/jobs"
        break
      case "add-employee":
        window.location.href = "/owner/employees"
        break
      case "process-payroll":
        window.location.href = "/owner/payroll"
        break
      case "view-reports":
        window.location.href = "/owner/reports"
        break
    }
  }

  return (
    <OwnerLayout>
      {/* --- SEO Metadata --- */}
      <Head>
        <title>Owner Dashboard - Smart ERP</title>
        <meta
          name="description"
          content={`Owner dashboard of Smart ERP. Active Jobs: ${activeJobs}, Employees: ${totalEmployees}, Today's Attendance: ${todayAttendance}, Pending Requests: ${pendingRequests}.`}
        />
        <link rel="canonical" href="https://smart-erp-front-end.vercel.app/owner" />
      </Head>

      {/* --- SEO Summary (hidden from users) --- */}
      <div style={{ display: "none" }}>
        <p>Active Jobs: {activeJobs}</p>
        <p>Active Employees: {totalEmployees}</p>
        <p>Today's Attendance: {todayAttendance}</p>
        <p>Pending Material Requests: {pendingRequests}</p>
      </div>

      {/* --- Full Interactive Dashboard --- */}
      <div className="space-y-8 animate-in fade-in duration-1000">
        {/* Header */}
        <div className="animate-in slide-in-from-top duration-700">
          <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground animate-in fade-in duration-500 delay-200">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-in slide-in-from-left duration-500 delay-100 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary animate-in zoom-in duration-300 delay-300">
                {activeJobs}
              </div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-left duration-500 delay-200 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent animate-in zoom-in duration-300 delay-400">
                {totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">All employees active</p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-right duration-500 delay-300 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-green-500 group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 animate-in zoom-in duration-300 delay-500">
                {todayAttendance}/{totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((todayAttendance / totalEmployees) * 100)}% attendance rate
              </p>
            </CardContent>
          </Card>

          <Card className="animate-in slide-in-from-right duration-500 delay-400 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 group-hover:scale-110 transition-all duration-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 animate-in zoom-in duration-300 delay-600">
                {budgetUtilization.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                ${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Rest of your 270+ lines full dashboard remain unchanged --- */}
        {/* Active Jobs Overview, Recent Activity, Quick Actions ... */}
        {/* Copy everything from your existing code here as-is */}
      </div>
    </OwnerLayout>
  )
}
