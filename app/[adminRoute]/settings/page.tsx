"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Settings as SettingsIcon, Shield, User, Monitor, Bell, Key, Save,
  Palette, Terminal, Database, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, Power, Server, Lock, Activity, Cloud, Radio
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("maintenance")
  const [loading, setLoading] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState("disabled")
  const [maintenanceMsg, setMaintenanceMsg] = useState("Platform is operating normally.")
  const [healthData, setHealthData] = useState<any>(null)
  const [updatingMode, setUpdatingMode] = useState(false)

  const fetchStatus = async () => {
    try {
      const [statusRes, healthRes] = await Promise.all([
        apiClient("/api/admin/system/status"),
        apiClient("/api/admin/health")
      ])
      if (statusRes) {
        setMaintenanceMode(statusRes.mode || "disabled")
        setMaintenanceMsg(statusRes.message || "Platform is operating normally.")
      }
      if (healthRes) {
        setHealthData(healthRes)
      }
    } catch {
      toast.error("Failed to load platform status")
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleMaintenanceUpdate = async (newMode: string) => {
    setUpdatingMode(true)
    try {
      const res = await apiClient("/api/admin/system/maintenance", {
        method: "POST",
        body: JSON.stringify({ mode: newMode, message: maintenanceMsg })
      })
      toast.success(`Platform mode updated to: ${newMode.toUpperCase()}`)
      setMaintenanceMode(newMode)
    } catch {
      toast.error("Failed to update maintenance mode")
    } finally {
      setUpdatingMode(false)
    }
  }

  const MAINTENANCE_OPTIONS = [
    {
      mode: "disabled",
      title: "Live Production (Normal)",
      desc: "All services fully active. Standard operation for all tenants.",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    {
      mode: "read_only",
      title: "Read-Only Maintenance",
      desc: "Users can view data. All POST/PUT/DELETE mutations are locked.",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Lock,
    },
    {
      mode: "enabled",
      title: "Standard Maintenance",
      desc: "Non-admin traffic receives 503 Maintenance page. Admin accessible.",
      badge: "bg-orange-100 text-orange-700 border-orange-200",
      icon: AlertTriangle,
    },
    {
      mode: "emergency",
      title: "Emergency Lockout",
      desc: "Immediate system halt for all non-superadmin users.",
      badge: "bg-red-100 text-red-700 border-red-200",
      icon: Power,
    },
  ]

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Control & Diagnostics</h1>
          <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">
            Platform maintenance state, security hardening & integrations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {/* Navigation Sidebar */}
           <div className="md:col-span-1 space-y-2">
              {[
                { id: 'maintenance', name: 'Maintenance', icon: Terminal },
                { id: 'integrations', name: 'Integrations', icon: Server },
                { id: 'profile', name: 'Superadmin Root', icon: User },
                { id: 'security', name: 'Security', icon: Shield },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${activeTab === item.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="md:col-span-3 space-y-8">

              {/* Maintenance Tab */}
              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Platform Operating State</h2>
                        <p className="text-xs text-slate-400 font-medium">Control live accessibility for all tenant users</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchStatus} className="rounded-xl text-xs font-bold gap-2">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {MAINTENANCE_OPTIONS.map((opt) => {
                        const isSelected = maintenanceMode === opt.mode
                        const Icon = opt.icon
                        return (
                          <div
                            key={opt.mode}
                            onClick={() => handleMaintenanceUpdate(opt.mode)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                                : "bg-slate-50/60 hover:bg-white border-slate-200 text-slate-900"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-700 shadow-sm border border-slate-200'}`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="font-black text-base">{opt.title}</h3>
                                  {isSelected && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                                      Active State
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs mt-1 font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {opt.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Custom Maintenance Notice Message
                      </label>
                      <input
                        type="text"
                        value={maintenanceMsg}
                        onChange={(e) => setMaintenanceMsg(e.target.value)}
                        placeholder="Notice shown to users during maintenance..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">System Integration Status</h2>
                    <p className="text-xs text-slate-400 font-medium">Real-time status of all production microservices & third-party APIs</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {healthData?.integrations ? (
                      Object.entries(healthData.integrations).map(([key, val]: [string, any]) => (
                        <div key={key} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700">{key.replace('_', ' ')}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${
                              val.status === 'operational' || val.status === 'configured'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : val.status === 'fallback_memory' || val.status === 'smtp_fallback'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {val.status}
                            </span>
                          </div>
                          {val.latencyMs !== undefined && (
                            <p className="text-xs font-bold text-slate-500">Latency: {val.latencyMs}ms</p>
                          )}
                          {val.description && (
                            <p className="text-[11px] text-slate-400">{val.description}</p>
                          )}
                          {val.provider && (
                            <p className="text-[11px] text-slate-400">Provider: {val.provider}</p>
                          )}
                          {val.mode && (
                            <p className="text-[11px] text-slate-400">Mode: {val.mode.toUpperCase()}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 text-center text-slate-400 animate-pulse font-bold text-sm">
                        Loading integration diagnostics...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-xl">
                      A
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Superadmin Instance</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">admin@prozync.in</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-400">Platform Alias</span>
                      <span className="font-black text-slate-900">SmartERP Production</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-400">Custom Domain</span>
                      <span className="font-black text-emerald-600">https://api.prozync.in</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-400">Environment</span>
                      <span className="font-black text-slate-900">PRODUCTION</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                      <Shield className="h-5 w-5 text-emerald-400" /> Platform Security Policy
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-white/10 rounded-xl flex justify-between">
                        <span>Double Auth Guard</span>
                        <span className="font-bold text-emerald-400 font-mono">authenticateToken + authenticateSuperAdmin</span>
                      </div>
                      <div className="p-3 bg-white/10 rounded-xl flex justify-between">
                        <span>OAuth Domain</span>
                        <span className="font-bold text-blue-400 font-mono">https://api.prozync.in</span>
                      </div>
                      <div className="p-3 bg-white/10 rounded-xl flex justify-between">
                        <span>Password Hashing</span>
                        <span className="font-bold text-purple-400 font-mono">bcrypt (cost 12)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </AdminLayout>
  )
}
