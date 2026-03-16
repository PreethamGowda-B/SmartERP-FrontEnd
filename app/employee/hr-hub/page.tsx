"use client"

import { useState, useEffect } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { apiClient } from "@/lib/apiClient"
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
  Clock, 
  User,
  CheckCircle2,
  XCircle,
  Briefcase,
  Plane,
  HeartPulse,
  MoreHorizontal
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

export default function EmployeeWorkplace() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [newLeave, setNewLeave] = useState({
    leave_type: "Casual",
    start_date: "",
    end_date: "",
    reason: ""
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
      console.error("Failed to fetch Workplace data:", error)
      toast.error("Failed to load workplace data")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestLeave = async () => {
    if (!newLeave.start_date || !newLeave.end_date || !newLeave.reason) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const res = await apiClient("/api/hr/leaves", {
        method: "POST",
        body: JSON.stringify(newLeave)
      })
      setLeaves([res, ...leaves])
      setIsLeaveModalOpen(false)
      setNewLeave({ leave_type: "Casual", start_date: "", end_date: "", reason: "" })
      toast.success("Leave request submitted successfully!")
    } catch (error) {
      toast.error("Failed to submit request")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent">
              Workplace
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated and manage your absences.
            </p>
          </div>
          <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg hover:shadow-accent/20 transition-all duration-300 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-background/80">
              <DialogHeader>
                <DialogTitle>Leave Application</DialogTitle>
                <DialogDescription>
                  Submit a new leave request for approval.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Leave Type</label>
                  <Select 
                    value={newLeave.leave_type} 
                    onValueChange={(v) => setNewLeave({...newLeave, leave_type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual Leave</SelectItem>
                      <SelectItem value="Medical">Medical Leave</SelectItem>
                      <SelectItem value="Annual">Annual Leave</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      type="date" 
                      value={newLeave.start_date}
                      onChange={(e) => setNewLeave({...newLeave, start_date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input 
                      type="date" 
                      value={newLeave.end_date}
                      onChange={(e) => setNewLeave({...newLeave, end_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Textarea 
                    placeholder="Why are you taking leave?" 
                    className="min-h-[100px]"
                    value={newLeave.reason}
                    onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
                <Button onClick={handleRequestLeave} className="bg-accent text-accent-foreground">Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="announcements" className="rounded-lg gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg gap-2">
              <Calendar className="h-4 w-4" />
              My Leaves
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : announcements.length === 0 ? (
              <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-muted/20">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">Quiet for now</h3>
                <p className="text-muted-foreground">Announcements from management will show up here.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {announcements.map((ann) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-border/50 overflow-hidden relative group">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        ann.priority === 'high' ? 'bg-red-500' : 
                        ann.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className={`capitalize ${getPriorityColor(ann.priority)}`}>
                               {ann.priority}
                             </Badge>
                             <span className="text-xs text-muted-foreground">
                               {format(new Date(ann.created_at), "MMM d, yyyy")}
                             </span>
                           </div>
                        </div>
                        <CardTitle className="text-xl mt-2">{ann.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {ann.content}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 border-t border-border/10 mt-2 bg-muted/5 py-3">
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center">
                             <User className="h-3 w-3 text-accent" />
                           </div>
                           Posted by {ann.creator_name}
                         </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : leaves.length === 0 ? (
              <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-muted/20">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No leave history</h3>
                <p className="text-muted-foreground">Your submitted leave requests will appear here.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {leaves.map((leave) => (
                  <Card key={leave.id} className="border-border/50 hover:shadow-md transition-all group">
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          leave.leave_type === 'Medical' ? 'bg-red-500/10 text-red-500' :
                          leave.leave_type === 'Casual' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-accent/10 text-accent'
                        }`}>
                          {leave.leave_type === 'Medical' ? <HeartPulse className="h-5 w-5" /> : 
                           leave.leave_type === 'Casual' ? <Briefcase className="h-5 w-5" /> : 
                           <Plane className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base">{leave.leave_type} Leave</h4>
                            <Badge variant={
                              leave.status === 'approved' ? 'default' : 
                              leave.status === 'rejected' ? 'destructive' : 'secondary'
                            } className="text-[10px] uppercase h-5">
                              {leave.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {leave.admin_notes && (
                        <div className="flex-1 max-w-sm bg-muted/30 p-2 rounded-lg text-xs italic text-muted-foreground">
                          Note: {leave.admin_notes}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                         <div className="flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           Requested: {format(new Date(leave.created_at), "MMM d")}
                         </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  )
}
