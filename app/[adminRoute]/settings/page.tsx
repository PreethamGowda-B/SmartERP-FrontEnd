"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import { 
  Settings as SettingsIcon, 
  Shield, 
  User, 
  Monitor, 
  Bell, 
  Key, 
  Save,
  Palette,
  Eye,
  Github,
  Terminal,
  Database
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function AdminSettings() {
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success("System configurations updated successfully")
    }, 1000)
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Platform-wide preferences & security controls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {/* Navigation Sidebar */}
           <div className="md:col-span-1 space-y-2">
              {[
                { name: 'Profile', icon: User, active: true },
                { name: 'Appearance', icon: Palette, active: false },
                { name: 'Security', icon: Shield, active: false },
                { name: 'Maintenance', icon: Terminal, active: false },
              ].map((item) => (
                <button 
                  key={item.name}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${item.active ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="md:col-span-3 space-y-8">
              {/* Profile Card */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-slate-900/20">
                       A
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">Superadmin Instance</h3>
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Platform Administrator Root</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform Alias</label>
                       <input 
                         type="text" 
                         defaultValue="SmartERP Production"
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Environment</label>
                       <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-black text-slate-600 cursor-not-allowed">
                         PROD_ENV_STABLE
                       </div>
                    </div>
                 </div>
              </div>

              {/* Preferences Card */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                 <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Monitor className="h-5 w-5" /> Interface Preferences
                 </h4>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between group">
                       <div>
                          <p className="text-sm font-black text-slate-900">Developer Debug Overlays</p>
                          <p className="text-xs text-slate-400 font-medium">Show real-time API response times in dashboard</p>
                       </div>
                       <Switch />
                    </div>
                    <div className="flex items-center justify-between group">
                       <div>
                          <p className="text-sm font-black text-slate-900">High Contrast Active Nodes</p>
                          <p className="text-xs text-slate-400 font-medium">Enhanced visibility for active sidebar elements</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between group">
                       <div>
                          <p className="text-sm font-black text-slate-900">System Health Notifications</p>
                          <p className="text-xs text-slate-400 font-medium">Alert when latency exceeds 200ms</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                 </div>
              </div>

              {/* Security Card */}
              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Shield className="h-48 w-48" />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                       <Key className="h-5 w-5" /> Security Hardening
                    </h4>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="flex items-center gap-4">
                             <Database className="h-5 w-5 text-blue-400" />
                             <div>
                                <p className="text-sm font-black">Database Snapshots</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Every 24 Hours</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 px-3 py-1 bg-emerald-400/10 rounded-full">Automated</span>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="flex items-center gap-4">
                             <Shield className="h-5 w-5 text-amber-400" />
                             <div>
                                <p className="text-sm font-black">Strict CORS Policy</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Production Hardened</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 px-3 py-1 bg-amber-400/10 rounded-full">Enabled</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 flex justify-end">
                 <Button 
                   onClick={handleSave}
                   disabled={loading}
                   className="bg-slate-900 hover:bg-black text-white rounded-2xl px-12 py-7 h-auto font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.02] shadow-xl shadow-slate-900/20 gap-3"
                 >
                    {loading ? "Syncing..." : "Commit Changes"}
                    <Save className="h-4 w-4" />
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  )
}
