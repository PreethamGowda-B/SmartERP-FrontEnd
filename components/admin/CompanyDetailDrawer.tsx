"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  X,
  Mail,
  User,
  Phone,
  Calendar,
  CreditCard,
  Layers,
  Activity,
  Package,
  Briefcase,
  MessageSquare,
  Shield,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface CompanyDetailDrawerProps {
  companyId: number | null
  isOpen: boolean
  onClose: () => void
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

export function CompanyDetailDrawer({
  companyId,
  isOpen,
  onClose
}: CompanyDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'usage'>('profile')
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)

  useEffect(() => {
    if (!isOpen || !companyId) {
      setDetails(null)
      setUsage(null)
      return
    }

    let isMounted = true
    const fetchCompanyData = async () => {
      setLoading(true)
      try {
        const [detailRes, usageRes] = await Promise.all([
          apiClient<{ company: any; users: any[]; plans: any[] }>(`/api/admin/companies/${companyId}`),
          apiClient<{ employees: number; jobs: number; inventory: number; activities7d: number; messages: number }>(`/api/admin/companies/${companyId}/usage`).catch(() => null)
        ])
        if (isMounted) {
          setDetails(detailRes)
          setUsage(usageRes)
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load company details")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchCompanyData()
    return () => {
      isMounted = false
    }
  }, [isOpen, companyId])

  if (!isOpen) return null

  const company = details?.company

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="relative z-50 w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate">
                  {company?.company_name || `Organization #${companyId}`}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono text-slate-500 font-semibold">
                    ID: {company?.company_id || company?.id}
                  </span>
                  <Badge className={
                    company?.status === 'active'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0"
                      : "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold px-2 py-0"
                  }>
                    {company?.status === 'active' ? "Active Tenant" : "Suspended"}
                  </Badge>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold px-2 py-0">
                    {company?.plan_name || "Free"} Plan
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-white text-xs font-semibold">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-1 border-b-2 transition-all ${
                activeTab === 'profile'
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Organization Overview
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`py-3 px-1 border-b-2 transition-all ${
                activeTab === 'usage'
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Resource & Quota Usage
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-1 border-b-2 transition-all ${
                activeTab === 'users'
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Registered Staff ({details?.users?.length || 0})
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="h-16 bg-slate-50 animate-pulse rounded-xl" />
                <div className="h-32 bg-slate-50 animate-pulse rounded-xl" />
                <div className="h-24 bg-slate-50 animate-pulse rounded-xl" />
              </div>
            ) : activeTab === 'profile' ? (
              <div className="space-y-6">
                {/* Owner Information */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Owner</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {company?.owner_name?.charAt(0) || "O"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{company?.owner_name || "N/A"}</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {company?.owner_email || "No email on record"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <span className="text-slate-400 font-medium block mb-1">Registered Since</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {company?.created_at ? new Date(company.created_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <span className="text-slate-400 font-medium block mb-1">Subscription Status</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      {company?.is_on_trial ? "Active Free Trial" : company?.plan_name || "Free Tier"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <span className="text-slate-400 font-medium block mb-1">Expires At</span>
                    <span className="font-semibold text-slate-800">
                      {company?.subscription_expires_at ? new Date(company.subscription_expires_at).toLocaleDateString() : "Lifetime / Active"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <span className="text-slate-400 font-medium block mb-1">Associated Staff</span>
                    <span className="font-semibold text-slate-800">
                      {details?.users?.length || 0} Accounts
                    </span>
                  </div>
                </div>
              </div>
            ) : activeTab === 'usage' ? (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">7-Day Real-Time Consumption</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" /> Total Jobs Created
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{usage?.jobs ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-emerald-500" /> Inventory Items
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{usage?.inventory ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-amber-500" /> 7d Activity Events
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{usage?.activities7d ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-500" /> Messages Sent
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{usage?.messages ?? 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organization Member Accounts</h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {(details?.users || []).map((u: any) => (
                    <div key={u.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{u.name}</p>
                        <p className="text-slate-400 truncate text-[11px]">{u.email}</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                  {(!details?.users || details.users.length === 0) && (
                    <p className="p-6 text-center text-xs text-slate-400">No registered members found.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Close */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
            <Button onClick={onClose} variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-semibold">
              Close Profile
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
