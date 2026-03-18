"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Megaphone, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Info,
  AlertCircle,
  User,
  Filter
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

export default function OwnerHRHub() {
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
    <OwnerLayout>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              HR Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Broadcast announcements and manage team leave requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg hover:shadow-primary/20 transition-all duration-300 gap-2">
                  <Plus className="h-4 w-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-background/80">
                <DialogHeader>
                  <DialogTitle>Broadcast Announcement</DialogTitle>
                  <DialogDescription>
                    Post an update that will be visible to your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      placeholder="e.g., Office Picnic this Saturday!" 
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea 
                      placeholder="Share the details here..." 
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
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Target Audience</label>
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
                    Broadcast Now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="announcements" className="rounded-lg gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg gap-2">
              <Calendar className="h-4 w-4" />
              Leave Management
              {leaves.filter(l => l.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-[10px] scale-90">
                  {leaves.filter(l => l.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : announcements.length === 0 ? (
              <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-muted/20">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No announcements yet</h3>
                <p className="text-muted-foreground">Keep your team informed by creating your first post.</p>
              </Card>
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
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <Badge variant={
                              ann.priority === 'high' ? 'destructive' : 
                              ann.priority === 'medium' ? 'default' : 'secondary'
                            } className="capitalize mb-2">
                              {ann.priority}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <CardTitle className="text-xl leading-tight">{ann.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <User className="h-3 w-3" />
                            By {ann.creator_name} • {format(new Date(ann.created_at), "MMM d, yyyy")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                            {ann.content}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0 pb-4">
                           <Badge variant="outline" className="text-[10px] opacity-60">
                             Audience: {ann.target_role === 'all' ? 'Everyone' : 'Employees Only'}
                           </Badge>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaves" className="space-y-6">
            <div className="grid gap-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : leaves.length === 0 ? (
                <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-muted/20">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No leave requests</h3>
                  <p className="text-muted-foreground">Requests from your team will appear here.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Separate Pending and Others */}
                  {['pending', 'approved', 'rejected'].map(statusType => {
                     const filtered = leaves.filter(l => l.status === statusType)
                     if (filtered.length === 0) return null
                     
                     return (
                       <div key={statusType} className="space-y-4">
                         <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                           {statusType === 'pending' ? <Clock className="h-4 w-4 text-orange-500" /> : 
                            statusType === 'approved' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                            <XCircle className="h-4 w-4 text-red-500" />}
                           {statusType} Requests
                         </h3>
                         <div className="grid gap-4">
                           {filtered.map((leave) => (
                             <Card key={leave.id} className="overflow-hidden border-border/40 hover:shadow-md transition-shadow">
                               <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                                 <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                     <User className="h-6 w-6" />
                                   </div>
                                   <div>
                                     <h4 className="font-semibold text-lg">{leave.employee_name}</h4>
                                     <p className="text-sm text-muted-foreground">{leave.employee_position}</p>
                                     <div className="flex items-center gap-2 mt-1">
                                       <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                         {leave.leave_type}
                                       </Badge>
                                       <span className="text-xs text-muted-foreground border-l pl-2 border-border/50">
                                         {format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                                       </span>
                                     </div>
                                   </div>
                                 </div>

                                 <div className="flex-1 max-w-md px-4 border-l border-border/40 hidden md:block">
                                    <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                      "{leave.reason}"
                                    </p>
                                 </div>

                                 <div className="flex items-center gap-2 shrink-0">
                                   {leave.status === 'pending' ? (
                                     <>
                                       <Button 
                                         variant="outline" 
                                         className="hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                         onClick={() => handleUpdateLeaveStatus(leave.id, 'approved')}
                                       >
                                         Approve
                                       </Button>
                                       <Button 
                                         variant="destructive" 
                                         className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"
                                         onClick={() => handleUpdateLeaveStatus(leave.id, 'rejected')}
                                       >
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
                           ))}
                         </div>
                       </div>
                     )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OwnerLayout>
  )
}
