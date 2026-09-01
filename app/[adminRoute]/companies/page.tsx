"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Mail,
  User,
  Calendar,
  CreditCard,
  ChevronDown,
  RefreshCw,
  MoreVertical,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  Activity
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { AdminLayout } from "@/components/admin-layout"
import { CompanyDetailDrawer } from "@/components/admin/CompanyDetailDrawer"
import { formatDistanceToNow } from "date-fns"

interface Company {
  id: number
  company_id: string
  company_name: string
  owner_id: number
  owner_name: string
  owner_email: string
  plan_name: string
  status: string // 'active', 'suspended'
  created_at: string
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

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPlan, setFilterPlan] = useState("all")
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const fetchCompanies = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const data = await apiClient<Company[]>("/api/admin/companies")
      setCompanies(data || [])
    } catch (err: any) {
      logger.error("Failed to fetch companies:", err)
      toast.error("Failed to load platform organizations")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const toggleStatus = async (id: number, currentStatus: string, companyName: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    setActionLoadingId(id)
    try {
      if (newStatus === 'active') {
        await apiClient(`/api/admin/companies/${id}/restore`, { method: 'POST' })
      } else {
        await apiClient(`/api/admin/companies/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        })
      }
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      toast.success(`${companyName} marked as ${newStatus === 'active' ? 'ACTIVE' : 'SUSPENDED'}`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update company status")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteCompany = async (id: number, companyName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${companyName}"? This action cannot be undone.`)) {
      return
    }
    setActionLoadingId(id)
    try {
      await apiClient(`/api/admin/companies/${id}`, { method: 'DELETE' })
      setCompanies(prev => prev.filter(c => c.id !== id))
      toast.success(`Company "${companyName}" deleted successfully`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete company")
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredCompanies = (Array.isArray(companies) ? companies : []).filter(c => {
    const matchesSearch = 
      (c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       c.company_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       c.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       c.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = filterStatus === "all" || (c.status || 'active') === filterStatus
    const matchesPlan = filterPlan === "all" || (c.plan_name?.toLowerCase() === filterPlan.toLowerCase())
    return matchesSearch && matchesStatus && matchesPlan
  })

  const activeCount = companies.filter(c => (c.status || 'active') === 'active').length
  const suspendedCount = companies.filter(c => c.status === 'suspended').length

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Company Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Multi-tenant organization directory, resource quotas, and access control
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <span>Total: <strong className="text-slate-900">{companies.length}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700">{activeCount} Active</span>
              {suspendedCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-rose-700">{suspendedCount} Suspended</span>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCompanies(true)}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by company name, organization ID code, or owner email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-medium focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by Status"
              className="h-10 px-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              aria-label="Filter by Plan"
              className="h-10 px-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        {/* ── Companies Data Table ───────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6">Company & ID</th>
                  <th className="py-3.5">Account Owner</th>
                  <th className="py-3.5">Plan Tier</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Created</th>
                  <th className="py-3.5 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-6"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="py-4 pr-6 text-right"><div className="h-4 w-16 bg-slate-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No organizations matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => {
                    const isSuspended = c.status === 'suspended'
                    const isLoadingThis = actionLoadingId === c.id

                    return (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedCompanyId(c.id)}
                      >
                        {/* Company Name & Code */}
                        <td className="py-3.5 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center font-bold shrink-0 transition-colors">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 truncate block group-hover:text-indigo-600 transition-colors">
                                {c.company_name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {c.company_id || `#${c.id}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Owner */}
                        <td className="py-3.5">
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate">
                              {c.owner_name || "N/A"}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {c.owner_email || "No email"}
                            </span>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5">
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                            {c.plan_name || "Free"}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="py-3.5">
                          <Badge className={
                            isSuspended
                              ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                          }>
                            {isSuspended ? "Suspended" : "Active"}
                          </Badge>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                          {safeDistance(c.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCompanyId(c.id)}
                              className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLoadingThis}
                              onClick={() => toggleStatus(c.id, c.status || 'active', c.company_name)}
                              className={`h-8 px-2 rounded-lg text-xs font-semibold ${
                                isSuspended
                                  ? "text-emerald-700 hover:bg-emerald-50"
                                  : "text-amber-700 hover:bg-amber-50"
                              }`}
                            >
                              {isSuspended ? <Unlock className="h-3.5 w-3.5 mr-1" /> : <Lock className="h-3.5 w-3.5 mr-1" />}
                              {isSuspended ? "Reactivate" : "Suspend"}
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoadingThis}
                              onClick={() => handleDeleteCompany(c.id, c.company_name)}
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete Organization"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Slide-Over Company Deep-Dive Drawer ─────────────────────────────── */}
        <CompanyDetailDrawer
          companyId={selectedCompanyId}
          isOpen={Boolean(selectedCompanyId)}
          onClose={() => setSelectedCompanyId(null)}
        />
      </div>
    </AdminLayout>
  )
}
