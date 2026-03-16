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
  Users,
  BellRing
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
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Global Broadcast Center</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Dispatch system-wide notifications to all tenants</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
             <BellRing className="h-4 w-4 text-amber-600" />
             <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Active System Channel</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                  <Megaphone className="h-48 w-48 text-slate-900" />
               </div>

               <form onSubmit={handleBroadcast} className="space-y-8 relative z-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Announcement Heading</label>
                    <input 
                      type="text"
                      placeholder="e.g. Critical Update: Scheduled Maintenance..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-black placeholder:text-slate-300 placeholder:font-bold"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Message Detail</label>
                    <textarea 
                      placeholder="Enter the full content of your announcement here..."
                      rows={8}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all font-bold placeholder:text-slate-300 placeholder:font-medium resize-none"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                       <button 
                         type="button"
                         onClick={() => setPriority('low')}
                         className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priority === 'low' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         Info
                       </button>
                       <button 
                         type="button"
                         onClick={() => setPriority('medium')}
                         className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priority === 'medium' ? 'bg-white text-amber-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         Standard
                       </button>
                       <button 
                         type="button"
                         onClick={() => setPriority('high')}
                         className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${priority === 'high' ? 'bg-white text-red-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         Urgent
                       </button>
                    </div>

                    <Button 
                      type="submit"
                      disabled={sending}
                      className="bg-slate-900 hover:bg-black text-white rounded-2xl px-10 py-7 h-auto flex items-center gap-4 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/20"
                    >
                      {sending ? "Processing..." : "Dispatch Now"}
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
               </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
             <div className="p-8 rounded-[2rem] bg-slate-900 text-white space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 p-6 opacity-10">
                   <ShieldAlert className="h-24 w-24" />
                </div>
                <div className="relative z-10">
                   <h4 className="font-black text-lg uppercase tracking-tight mb-3">Broadcast Guidelines</h4>
                   <p className="text-sm text-slate-400 leading-relaxed font-bold">
                      Platform-wide announcements are delivered to <span className="text-white">every company owner</span> instance-wide.
                   </p>
                   <ul className="mt-6 space-y-4">
                      <li className="flex items-start gap-3">
                         <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                         </div>
                         <span className="text-xs text-slate-400 font-medium">Use 'Urgent' for maintenance notifications.</span>
                      </li>
                      <li className="flex items-start gap-3">
                         <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                         </div>
                         <span className="text-xs text-slate-400 font-medium">Clear subjects improve open rates by 40%.</span>
                      </li>
                   </ul>
                </div>
             </div>

             <div className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-slate-900" />
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Reach Metrics</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Target Audience</p>
                   </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-slate-50">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Target</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Tenants</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Channels</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Dashboard + Mail</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
