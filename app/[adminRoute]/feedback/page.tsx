"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Bug, 
  Lightbulb, 
  ExternalLink,
  Reply,
  Send,
  Loader2,
  Users
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FeedbackData {
  id: number
  user_id: string
  user_name: string | null
  user_email: string | null
  type: string
  subject: string
  message: string
  page_url: string
  status: 'new' | 'replied'
  admin_reply: string | null
  replied_at: string | null
  created_at: string
}

export default function AdminFeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const [feedback, setFeedback] = useState<FeedbackData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Reply Dialog State
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [replying, setReplying] = useState(false)

  // Secret Route Verification
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_ROUTE || "platform-control-secret"
  const currentRoute = params.adminRoute

  useEffect(() => {
    if (currentRoute !== adminSecret) {
      router.push("/404")
      return
    }
    fetchFeedback()
  }, [currentRoute, adminSecret, router])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const data = await apiClient("/api/v1/feedback")
      setFeedback(data)
    } catch (err) {
      logger.error("Failed to fetch feedback:", err)
      toast.error("Failed to load feedback")
    } finally {
      setLoading(false)
    }
  }

  const handleReplySubmit = async () => {
    if (!selectedFeedback || !replyMessage.trim()) return

    setReplying(true)
    try {
      await apiClient(`/api/v1/feedback/${selectedFeedback.id}/reply`, {
        method: 'PATCH',
        body: JSON.stringify({ replyMessage })
      })
      
      toast.success("Reply sent successfully! They will receive an email and notification.")
      setReplyDialogOpen(false)
      setReplyMessage("")
      
      // Update local state to reflect the reply
      setFeedback(current => current.map(f => 
        f.id === selectedFeedback.id 
          ? { ...f, status: 'replied', admin_reply: replyMessage, replied_at: new Date().toISOString() } 
          : f
      ))
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply")
    } finally {
      setReplying(false)
    }
  }

  const openReplyDialog = (item: FeedbackData) => {
    setSelectedFeedback(item)
    setReplyMessage(item.admin_reply || "")
    setReplyDialogOpen(true)
  }

  if (currentRoute !== adminSecret) return null

  // Filtering
  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = 
      (item.subject?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.message?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === "all" || item.type === filterType
    const matchesStatus = filterStatus === "all" || item.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4 text-red-500" />
      case 'feature_request': return <Lightbulb className="h-4 w-4 text-amber-500" />
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'bug': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Bug Report</Badge>
      case 'feature_request': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Feature Request</Badge>
      default: return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">General</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Feedback</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">
              Manage bug reports and feature requests
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100">
                <Search className="h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search feedback..." 
                  className="h-8 border-0 shadow-none focus-visible:ring-0 px-0 min-w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2 px-2">
                <Button 
                  variant={filterStatus === 'new' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 text-xs font-bold"
                  onClick={() => setFilterStatus(filterStatus === 'new' ? 'all' : 'new')}
                >
                  <Clock className="h-3 w-3 mr-1" /> Unread
                </Button>
                <Button 
                   variant={filterType === 'bug' ? 'secondary' : 'ghost'} 
                   size="sm" 
                   className="h-8 text-xs font-bold"
                   onClick={() => setFilterType(filterType === 'bug' ? 'all' : 'bug')}
                >
                  <Bug className="h-3 w-3 mr-1" /> Bugs
                </Button>
             </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No Feedback Found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFeedback.map((item) => (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={item.id} 
                  className={`p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-6 relative group ${item.status === 'new' ? 'bg-slate-50/50' : ''}`}
                >
                  {/* Status Indicator Bar */}
                  {item.status === 'new' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}

                  {/* Icon & Type */}
                  <div className="shrink-0 flex flex-col items-center sm:items-start gap-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${
                      item.type === 'bug' ? 'bg-red-50 border-red-100' : 
                      item.type === 'feature_request' ? 'bg-amber-50 border-amber-100' : 
                      'bg-blue-50 border-blue-100'
                    }`}>
                      {getTypeIcon(item.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeBadge(item.type)}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                          {item.subject || 'No Subject Provided'}
                        </h3>
                      </div>
                      
                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-2">
                         {item.status === 'replied' ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Replied
                            </Badge>
                         ) : (
                            <Button 
                              size="sm" 
                              onClick={() => openReplyDialog(item)}
                              className="bg-slate-900 hover:bg-slate-800 text-white shadow-md focus:ring-2 focus:ring-slate-900/20"
                            >
                              <Reply className="h-4 w-4 mr-2" /> Reply
                            </Button>
                         )}
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm whitespace-pre-wrap flex-1 mb-4 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Footer Info */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-auto pt-4 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-2 font-medium">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-900">{item.user_name || 'Unknown User'}</span>
                        <span className="text-slate-400">({item.user_email || 'No email'})</span>
                      </div>
                      {item.page_url && (
                        <a 
                          href={item.page_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Source Page
                        </a>
                      )}
                    </div>
                    
                    {/* Admin Reply Preview */}
                    {item.admin_reply && (
                      <div className="mt-4 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Your Reply</span>
                           <span className="text-[10px] font-bold text-slate-400">
                             {item.replied_at ? formatDistanceToNow(new Date(item.replied_at), { addSuffix: true }) : ''}
                           </span>
                         </div>
                         <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.admin_reply}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-black">
                <Reply className="h-5 w-5 text-indigo-600" />
                Reply to Feedback
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-slate-600">
                This will send an email and an in-app notification directly to <strong className="text-slate-900">{selectedFeedback?.user_name}</strong>.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
             {/* Original Message Preview */}
             <div className="bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm relative overflow-visible">
                <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Original Message</div>
                <p className="text-slate-700 font-medium mb-1">{selectedFeedback?.subject}</p>
                <p className="text-slate-500 italic line-clamp-3">"{selectedFeedback?.message}"</p>
             </div>

             <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-900 ml-1">Your Response</label>
                <Textarea
                  placeholder="Type your reply here. Thank them for the feedback, or provide an update on the bug fix..."
                  className="min-h-[150px] resize-none focus-visible:ring-indigo-500"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={selectedFeedback?.status === 'replied'}
                />
             </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 sm:justify-between items-center">
            <Button variant="ghost" onClick={() => setReplyDialogOpen(false)} className="text-slate-500">
              Cancel
            </Button>
            {selectedFeedback?.status !== 'replied' ? (
              <Button onClick={handleReplySubmit} disabled={replying || !replyMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all min-w-[120px]">
                {replying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Send Reply</>
                )}
              </Button>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1.5 text-xs font-bold shadow-sm">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Already Replied
              </Badge>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
