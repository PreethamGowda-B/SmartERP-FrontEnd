"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Megaphone, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User
} from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function HRHubPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "medium",
    target_role: "all"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [annRes, leaveRes] = await Promise.all([
        apiClient("/api/hr/announcements"),
        apiClient("/api/hr/leaves")
      ])
      setAnnouncements(annRes || [])
      setLeaves(leaveRes || [])
    } catch (error) {
      logger.error("Failed to fetch HR data:", error)
      toast.error("Failed to load HR data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      const res = await apiClient("/api/hr/announcements", {
        method: "POST",
        body: JSON.stringify(newAnnouncement)
      })
      setAnnouncements([res, ...announcements])
      setIsAnnouncementModalOpen(false)
      setNewAnnouncement({ title: "", content: "", priority: "medium", target_role: "all" })
      toast.success("Announcement broadcasted successfully!")
    } catch (error) {
      toast.error("Failed to create announcement")
    }
  }

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await apiClient(`/api/hr/announcements/${id}`, { method: "DELETE" })
      setAnnouncements(announcements.filter(a => a.id !== id))
      toast.success("Announcement deleted")
    } catch (error) {
      toast.error("Failed to delete announcement")
    }
  }

  const handleUpdateLeaveStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      const res = await apiClient(`/api/hr/leaves/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })
      setLeaves(leaves.map(l => l.id === id ? res : l))
      toast.success(`Leave request ${status}`)
    } catch (error) {
      toast.error("Failed to update leave status")
    }
  }

  return (
    <HRLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">HR Hub</h1>
            <p className="text-muted-foreground mt-1">
              Team communications and leave management center.
            </p>
          </div>
          <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Plus className="h-4 w-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>Broadcast an update to your team.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="Enter title" 
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea 
                    placeholder="Enter details..." 
                    className="min-h-[120px]"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={newAnnouncement.priority} 
                      onValueChange={(v) => setNewAnnouncement({...newAnnouncement, priority: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Audience</label>
                    <Select 
                      value={newAnnouncement.target_role} 
                      onValueChange={(v) => setNewAnnouncement({...newAnnouncement, target_role: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="employee">Employees Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAnnouncementModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAnnouncement} className="gap-2">
                  <Megaphone className="h-4 w-4" />
                  Broadcast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="leaves" className="gap-2">
              <Calendar className="h-4 w-4" />
              Leaves
              {leaves.filter(l => l.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-[10px]">
                  {leaves.filter(l => l.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
                No announcements broadcasted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {announcements.map((ann) => (
                    <motion.div
                      key={ann.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="group relative">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between">
                            <Badge variant={ann.priority === 'high' ? 'destructive' : 'default'}>
                              {ann.priority}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <CardTitle className="text-xl mt-2">{ann.title}</CardTitle>
                          <CardDescription>
                            {format(new Date(ann.created_at), "MMM d, yyyy")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {ann.content}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaves" className="space-y-6">
            <div className="grid gap-4">
              {loading ? (
                <Skeleton className="h-32 w-full rounded-xl" />
              ) : leaves.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
                   No leave requests to show.
                </div>
              ) : (
                leaves.map((leave) => (
                  <Card key={leave.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{leave.employee_name}</h4>
                          <p className="text-xs text-muted-foreground">{leave.leave_type} leave</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 max-w-sm border-l pl-4 hidden md:block">
                        <p className="text-xs text-muted-foreground italic">
                          "{leave.reason}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {leave.status === 'pending' ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}>
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Badge variant={leave.status === 'approved' ? 'default' : 'destructive'} className="uppercase">
                            {leave.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  )
}
