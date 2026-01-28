"use client"

import { useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { ClockInOut } from "@/components/clock-in-out"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MaterialRequestForm } from "@/components/material-request-form"
import { mockJobs, mockMaterialRequests, type MaterialRequest } from "@/lib/data"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { DateTimeWeather } from "@/components/date-time-weather"
import {
  Briefcase,
  DollarSign,
  Package,
  MessageSquare,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [isMaterialRequestOpen, setIsMaterialRequestOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Get employee's assigned jobs
  const assignedJobs = mockJobs.filter((job) => job.assignedEmployees.includes(user?.id || ""))
  const activeJobs = assignedJobs.filter((job) => job.status === "active")

  // Mock data for employee-specific metrics
  const hoursThisWeek = 32.5
  const hoursToday = 6.5
  const pendingRequests = mockMaterialRequests.filter((req) => req.requestedBy === user?.name).length

  // Handlers for quick action buttons
  const handleMaterialRequest = () => {
    setIsMaterialRequestOpen(true)
  }

  const handleSendMessage = () => {
    // In a real app, this would open a messaging interface
    alert("Messaging feature coming soon! For now, please contact your supervisor directly.")
  }

  const handleViewTimesheet = () => {
    router.push("/employee/timesheet")
  }

  const handleCheckPayroll = () => {
    router.push("/employee/payroll")
  }

  const handleSubmitMaterialRequest = async (requestData: Partial<MaterialRequest>) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log("[v0] Material request submitted:", requestData)
      setIsMaterialRequestOpen(false)
      // Show success message
      alert("Material request submitted successfully!")
    } catch (error) {
      console.error("[v0] Failed to submit material request:", error)
      alert("Failed to submit request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelMaterialRequest = () => {
    setIsMaterialRequestOpen(false)
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="animate-fade-in-down stagger-1 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground animate-fade-in-up stagger-2">Here's your work overview for today.</p>
          </div>
          <DateTimeWeather />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-fade-in-left stagger-1 hover-lift hover-scale group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors duration-300 animate-float" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent animate-scale-in stagger-3">{activeJobs.length}</div>
              <p className="text-xs text-muted-foreground">Currently assigned</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-left stagger-2 hover-lift hover-scale group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-300 animate-float" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 animate-scale-in stagger-4">{hoursThisWeek}h</div>
              <p className="text-xs text-muted-foreground">7.5h remaining to 40h</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-right stagger-3 hover-lift hover-scale group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors duration-300 animate-float" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 animate-scale-in stagger-5">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Material requests</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-right stagger-4 hover-lift hover-scale group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent animate-pulse-soft" />
                My Active Jobs
              </CardTitle>
              <CardDescription>Projects you're currently working on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeJobs.length > 0 ? (
                activeJobs.map((job, index) => (
                  <div
                    key={job.id}
                    className={`space-y-2 p-3 rounded-lg border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300 animate-slide-up hover-lift`}
                    style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium hover:text-accent transition-colors duration-200">{job.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 animate-pulse-soft" />
                          {job.location}
                        </div>
                      </div>
                      <Badge
                        variant={job.priority === "high" ? "destructive" : "secondary"}
                        className="animate-scale-in hover-scale transition-transform duration-200"
                      >
                        {job.priority}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round((job.spent / job.budget) * 100)}%</span>
                      </div>
                      <Progress
                        value={(job.spent / job.budget) * 100}
                        className="h-2 transition-all duration-500 hover:h-3"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground animate-fade-in-up">No active jobs assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Clock In/Out and Current Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-in-left stagger-5">
            <ClockInOut currentStatus="clocked-out" hoursToday={hoursToday} />
          </div>

          <Card className="animate-fade-in-right stagger-6 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent animate-pulse-soft" />
                My Active Jobs
              </CardTitle>
              <CardDescription>Projects you're currently working on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeJobs.length > 0 ? (
                activeJobs.map((job, index) => (
                  <div
                    key={job.id}
                    className={`space-y-2 p-3 rounded-lg border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300 animate-slide-up hover-lift`}
                    style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium hover:text-accent transition-colors duration-200">{job.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 animate-pulse-soft" />
                          {job.location}
                        </div>
                      </div>
                      <Badge
                        variant={job.priority === "high" ? "destructive" : "secondary"}
                        className="animate-scale-in hover-scale transition-transform duration-200"
                      >
                        {job.priority}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round((job.spent / job.budget) * 100)}%</span>
                      </div>
                      <Progress
                        value={(job.spent / job.budget) * 100}
                        className="h-2 transition-all duration-500 hover:h-3"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground animate-fade-in-up">No active jobs assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-fade-in-up stagger-1 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary animate-pulse-soft" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest work updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-all duration-300 animate-fade-in-left stagger-2 hover-lift">
                <div className="p-2 bg-green-500 rounded-full animate-pulse-soft">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium hover:text-green-600 transition-colors duration-200">Clocked out</p>
                  <p className="text-xs text-muted-foreground">Downtown Office Complex - 8 hours worked</p>
                  <p className="text-xs text-muted-foreground">Yesterday at 5:30 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-all duration-300 animate-fade-in-left stagger-3 hover-lift">
                <div className="p-2 bg-accent rounded-full animate-pulse-soft">
                  <Package className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium hover:text-accent transition-colors duration-200">
                    Material Request Submitted
                  </p>
                  <p className="text-xs text-muted-foreground">Requested steel beams and concrete mix</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all duration-300 animate-fade-in-left stagger-4 hover-lift">
                <div className="p-2 bg-primary rounded-full animate-pulse-soft">
                  <Calendar className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium hover:text-primary transition-colors duration-200">
                    Job Assignment
                  </p>
                  <p className="text-xs text-muted-foreground">Assigned to Residential Housing Project</p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up stagger-2 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent animate-float" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-accent/10 hover-lift hover-scale transition-all duration-300 group animate-scale-in stagger-3 animate-press"
                  onClick={handleMaterialRequest}
                >
                  <Package className="h-6 w-6 text-accent group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-accent transition-colors duration-200">
                    Request Materials
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-primary/10 hover-lift hover-scale transition-all duration-300 group animate-scale-in stagger-4 animate-press"
                  onClick={handleSendMessage}
                >
                  <MessageSquare className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-primary transition-colors duration-200">Send Message</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-green-50 hover-lift hover-scale transition-all duration-300 group animate-scale-in stagger-5 animate-press"
                  onClick={handleViewTimesheet}
                >
                  <Clock className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-green-600 transition-colors duration-200">
                    View Timesheet
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent hover:bg-blue-50 hover-lift hover-scale transition-all duration-300 group animate-scale-in stagger-6 animate-press"
                  onClick={handleCheckPayroll}
                >
                  <DollarSign className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm group-hover:text-blue-600 transition-colors duration-200">
                    Check Payroll
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card className="animate-fade-in-up stagger-3 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 animate-pulse-soft" />
              Important Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg hover:bg-accent/20 transition-all duration-300 animate-fade-in-right stagger-4 hover-lift">
              <AlertCircle className="h-4 w-4 text-accent mt-0.5 animate-pulse-soft" />
              <div>
                <p className="text-sm font-medium hover:text-accent transition-colors duration-200">
                  Safety Meeting Tomorrow
                </p>
                <p className="text-xs text-muted-foreground">Mandatory safety briefing at 8:00 AM in the main office</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-all duration-300 animate-fade-in-right stagger-5 hover-lift">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 animate-pulse-soft" />
              <div>
                <p className="text-sm font-medium hover:text-primary transition-colors duration-200">
                  Material Request Approved
                </p>
                <p className="text-xs text-muted-foreground">Your steel beams request has been approved and ordered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isMaterialRequestOpen} onOpenChange={setIsMaterialRequestOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent animate-pulse-soft" />
                New Material Request
              </DialogTitle>
            </DialogHeader>
            <MaterialRequestForm
              onSubmit={handleSubmitMaterialRequest}
              onCancel={handleCancelMaterialRequest}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  )
}
