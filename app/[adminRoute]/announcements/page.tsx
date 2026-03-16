"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import { 
  Megaphone, 
  Send, 
  AlertTriangle, 
  ShieldAlert,
  Info,
  CheckCircle2,
  Users
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState("medium")
  const [sending, setSending] = useState(false)

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message) return toast.error("Broadcast message cannot be empty")

    setSending(true)
    try {
      const res = await apiClient("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ title, message, priority })
      })
      toast.success(res.message || "Broadcast sent successfully!")
      setTitle("")
      setMessage("")
    } catch (err) {
      toast.error("Failed to broadcast announcement")
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Global Broadcast Center</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium opacity-60">Send high-priority system notifications to all company owners</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-8 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Megaphone className="h-32 w-32 text-accent" />
               </div>

               <form onSubmit={handleBroadcast} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Announcement Subject</label>
                    <input 
                      type="text"
                      placeholder="e.g. System Maintenance, New Feature Alert..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-accent/40 transition-all font-medium"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Message Content</label>
                    <textarea 
                      placeholder="Describe the update or requirement clearly..."
                      rows={6}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-accent/40 transition-all font-medium resize-none"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <button 
                         type="button"
                         onClick={() => setPriority('low')}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${priority === 'low' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-white/5 border-transparent text-muted-foreground'}`}
                       >
                         Info
                       </button>
                       <button 
                         type="button"
                         onClick={() => setPriority('medium')}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${priority === 'medium' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-white/5 border-transparent text-muted-foreground'}`}
                       >
                         Standard
                       </button>
                       <button 
                         type="button"
                         onClick={() => setPriority('high')}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${priority === 'high' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-transparent text-muted-foreground'}`}
                       >
                         Urgent
                       </button>
                    </div>

                    <Button 
                      type="submit"
                      disabled={sending}
                      className="bg-accent hover:bg-accent/80 text-white rounded-2xl px-8 py-6 h-auto flex items-center gap-3 font-bold group"
                    >
                      {sending ? "Broadcasting..." : "Dispatch Broadcast"}
                      <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </div>
               </form>
            </div>
          </div>

          {/* Sidebar Tips */}
          <div className="space-y-4">
             <div className="p-6 rounded-2xl border border-white/5 bg-accent/5 backdrop-blur-sm space-y-4">
                <div className="flex items-center gap-3 text-accent">
                   <ShieldAlert className="h-5 w-5" />
                   <h4 className="font-bold text-sm uppercase tracking-wide">Developer Policy</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                   Global broadcasts reach <span className="text-white font-bold">all company owners</span>. Use 'Urgent' priority only for critical system updates or downtime alerts.
                </p>
             </div>

             <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm space-y-4">
                <div className="flex items-center gap-3 text-white">
                   <Users className="h-5 w-5" />
                   <h4 className="font-bold text-sm uppercase tracking-wide">Audience Segment</h4>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Target Role:</span>
                      <span className="text-accent italic">Company Owners</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Delivery:</span>
                      <span className="text-white">In-App + Push</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
