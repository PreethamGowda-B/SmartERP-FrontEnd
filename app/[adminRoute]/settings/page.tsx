"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Radio,
  RefreshCw,
  Server,
  Zap,
  Globe,
  Sliders,
  X,
  AlertCircle,
  Clock,
  UserCheck
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"

interface MaintenanceSetting {
  mode: 'disabled' | 'enabled' | 'read_only' | 'emergency'
  message: string
  updated_at: string
  updated_by?: string
}

function safeDistance(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

export default function AdminSettings() {
  const [currentSetting, setCurrentSetting] = useState<MaintenanceSetting>({
    mode: 'disabled',
    message: 'Platform is operating normally.',
    updated_at: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Staged change state
  const [targetMode, setTargetMode] = useState<'disabled' | 'enabled' | 'read_only' | 'emergency'>('disabled')
  const [customMessage, setCustomMessage] = useState("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchStatus = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const data = await apiClient<MaintenanceSetting>("/api/admin/system/status")
      if (data && data.mode) {
        setCurrentSetting(data)
        setTargetMode(data.mode)
        setCustomMessage(data.message || "")
      }
    } catch {
      toast.error("Failed to load platform system state")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleApplyMaintenance = async () => {
    setSaving(true)
    try {
      const res = await apiClient<{ ok: boolean; maintenance: MaintenanceSetting }>("/api/admin/system/maintenance", {
        method: "POST",
        body: JSON.stringify({
          mode: targetMode,
          message: customMessage.trim() || undefined
        })
      })

      if (res?.maintenance) {
        setCurrentSetting(res.maintenance)
      }
      toast.success(`Platform state updated to: ${targetMode.toUpperCase()}`)
      setShowConfirmModal(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update maintenance mode")
    } finally {
      setSaving(false)
    }
  }

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'emergency':
        return <Badge className="bg-rose-600 text-white font-bold animate-pulse text-xs px-3 py-1">EMERGENCY LOCKOUT</Badge>
      case 'enabled':
        return <Badge className="bg-amber-500 text-white font-bold text-xs px-3 py-1">STANDARD MAINTENANCE</Badge>
      case 'read_only':
        return <Badge className="bg-blue-600 text-white font-bold text-xs px-3 py-1">READ-ONLY MODE</Badge>
      default:
        return <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">LIVE PRODUCTION</Badge>
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12 max-w-5xl">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              System Control & Maintenance Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Global operational posture, multi-tenant maintenance gating, and platform disaster recovery
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={isRefreshing}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh State</span>
          </Button>
        </div>

        {/* ── Current Operational State Banner ────────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Current Cluster State</span>
                <div className="mt-1 flex items-center gap-2">
                  {getModeBadge(currentSetting.mode)}
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 font-mono">
              <span>Last Modified: <strong className="text-slate-700">{safeDistance(currentSetting.updated_at)}</strong></span>
              {currentSetting.updated_by && (
                <span className="block text-[11px] text-slate-400">By: {currentSetting.updated_by}</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <strong>Public Banner Message:</strong> {currentSetting.message || "Platform is operating normally."}
          </div>
        </div>

        {/* ── 4-Mode Selector Matrix ─────────────────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              Configure Platform State
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Select the target mode and define user advisory notices</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode 1: Live Production */}
            <div
              onClick={() => setTargetMode('disabled')}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                targetMode === 'disabled'
                  ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                  MODE 1
                </Badge>
                <span className="text-xs font-bold text-emerald-800">Live Production</span>
              </div>
              <p className="text-xs text-slate-600">
                Normal operations. Full read/write API access across all tenants with AI Copilot enabled.
              </p>
            </div>

            {/* Mode 2: Read-Only Mode */}
            <div
              onClick={() => setTargetMode('read_only')}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                targetMode === 'read_only'
                  ? "bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">
                  MODE 2
                </Badge>
                <span className="text-xs font-bold text-blue-800">Read-Only Mode</span>
              </div>
              <p className="text-xs text-slate-600">
                Permits report downloads and dashboard viewing. Mutation operations (POST, PUT, DELETE) are paused.
              </p>
            </div>

            {/* Mode 3: Standard Maintenance */}
            <div
              onClick={() => setTargetMode('enabled')}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                targetMode === 'enabled'
                  ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                  MODE 3
                </Badge>
                <span className="text-xs font-bold text-amber-800">Standard Maintenance</span>
              </div>
              <p className="text-xs text-slate-600">
                Non-admin users see a scheduled maintenance banner. Database migrations can run safely.
              </p>
            </div>

            {/* Mode 4: Emergency Lockout */}
            <div
              onClick={() => setTargetMode('emergency')}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                targetMode === 'emergency'
                  ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">
                  MODE 4
                </Badge>
                <span className="text-xs font-bold text-rose-800">Emergency Lockout</span>
              </div>
              <p className="text-xs text-slate-600">
                Immediate platform quarantine. Sever active JWT sessions and blocks all non-Super Admin traffic.
              </p>
            </div>
          </div>

          {/* Custom Message Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Public Advisory Message (shown to users)</label>
            <Input
              type="text"
              placeholder="e.g. Scheduled database maintenance in progress. Expected recovery in 20 minutes."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="h-10 text-xs rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => setShowConfirmModal(true)}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Apply State Change</span>
            </Button>
          </div>
        </div>

        {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(false)}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Confirm System State Transition</h3>
                      <p className="text-xs text-slate-500">Super Admin cluster governance</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowConfirmModal(false)} className="h-7 w-7 rounded-lg text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">New Mode:</span>
                    <strong className="text-slate-900 uppercase font-bold">{targetMode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Public Message:</span>
                    <span className="text-slate-800 text-right max-w-[200px] truncate">{customMessage || "Default"}</span>
                  </div>
                </div>

                <p className="text-xs text-rose-700 font-semibold">
                  Warning: Transitioning cluster state immediately affects live API routing for all organizations.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)} className="h-9 px-4 rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={handleApplyMaintenance}
                    className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {saving ? "Updating..." : "Authorize Change"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
