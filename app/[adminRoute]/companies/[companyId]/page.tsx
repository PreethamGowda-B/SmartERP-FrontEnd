"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, ArrowLeft, Users, CreditCard, Calendar,
  Mail, Phone, MapPin, CheckCircle2, AlertCircle, ShieldCheck,
  Edit2, Save, X, ChevronDown, Clock, Star, AlertTriangle,
  RefreshCw, Globe, User, Crown, Zap, Lock
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"

interface CompanyUser { id: string; name: string; email: string; role: string; created_at: string }
interface Plan { id: number; name: string }
interface CompanyDetail {
  id: number; company_id: string; company_name: string
  owner_name: string; owner_email: string; owner_phone: string
  plan_id: number; plan_name: string
  status: string; address: string; contact_email: string
  created_at: string; updated_at: string
  subscription_expires_at: string; is_on_trial: boolean
}

const PLAN_META: Record<number, { color: string; icon: any; label: string }> = {
  1: { color: "text-slate-500 bg-slate-50 border-slate-200", icon: Globe, label: "Free" },
  2: { color: "text-blue-600 bg-blue-50 border-blue-200", icon: Zap, label: "Basic" },
  3: { color: "text-purple-600 bg-purple-50 border-purple-200", icon: Crown, label: "Pro" },
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string

  const [data, setData] = useState<{ company: CompanyDetail; users: CompanyUser[]; plans: Plan[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(1)
  const [expiresAt, setExpiresAt] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCompanyDetail()
  }, [companyId])

  const fetchCompanyDetail = async () => {
    setLoading(true)
    try {
      const res = await apiClient(`/api/admin/companies/${companyId}`)
      setData(res)
      setSelectedPlan(res.company.plan_id)
      if (res.company.subscription_expires_at) {
        setExpiresAt(format(new Date(res.company.subscription_expires_at), "yyyy-MM-dd"))
      }
    } catch (err) {
      toast.error("Failed to load company details")
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSave = async () => {
    setSaving(true)
    try {
      await apiClient(`/api/admin/companies/${companyId}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan_id: selectedPlan, expires_at: expiresAt || null })
      })
      toast.success("Plan updated successfully")
      setEditingPlan(false)
      fetchCompanyDetail()
    } catch {
      toast.error("Failed to update plan")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!data) return
    const newStatus = data.company.status === "suspended" ? "active" : "suspended"
    const confirmed = confirm(`${newStatus === "suspended" ? "Suspend" : "Re-activate"} ${data.company.company_name}?`)
    if (!confirmed) return
    try {
      await apiClient(`/api/admin/companies/${companyId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      })
      toast.success(`Company ${newStatus === "suspended" ? "suspended" : "re-activated"}`)
      fetchCompanyDetail()
    } catch {
      toast.error("Failed to update company status")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-purple-100 text-purple-700 border-purple-200"
      case "hr": return "bg-blue-100 text-blue-700 border-blue-200"
      case "employee": return "bg-slate-100 text-slate-600 border-slate-200"
      default: return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-slate-100 rounded-xl" />
          <div className="h-48 bg-slate-100 rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-24">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Company not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const { company, users, plans } = data
  const planMeta = PLAN_META[company.plan_id] || PLAN_META[1]
  const PlanIcon = planMeta.icon
  const isSuspended = company.status === "suspended"

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Back */}
        <button
          onClick={() => router.push(`${window.location.pathname.split("/companies")[0]}/companies`)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Companies
        </button>

        {/* Header Card */}
        <div className={cn(
          "relative overflow-hidden rounded-3xl border p-8",
          isSuspended
            ? "bg-red-50 border-red-200"
            : "bg-white border-slate-200"
        )}>
          <div className="absolute top-0 right-0 p-12 opacity-[0.04]">
            <Building2 className="h-64 w-64 text-slate-900" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shrink-0">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{company.company_name}</h1>
                  <span className="text-xs font-black px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg uppercase tracking-tight">
                    {company.company_id}
                  </span>
                  {isSuspended && (
                    <span className="text-xs font-black px-2 py-1 bg-red-100 text-red-600 border border-red-200 rounded-lg uppercase">
                      Suspended
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-bold">{company.owner_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{company.owner_email}</span>
                  </div>
                  {company.owner_phone && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{company.owner_phone}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Registered {formatDistanceToNow(new Date(company.created_at))} ago
                  {company.address && ` • ${company.address}`}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              <Button
                onClick={handleToggleStatus}
                className={cn(
                  "rounded-xl font-black text-xs uppercase tracking-widest px-6",
                  isSuspended
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white"
                )}
                variant={isSuspended ? "default" : "outline"}
              >
                {isSuspended ? "Re-activate Account" : "Suspend Account"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-black text-xs uppercase tracking-widest"
                onClick={fetchCompanyDetail}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: users.length, icon: Users, color: "text-blue-600" },
            { label: "Plan", value: company.plan_name || "Free", icon: PlanIcon, color: "text-purple-600" },
            { label: "On Trial", value: company.is_on_trial ? "Yes" : "No", icon: Clock, color: "text-amber-600" },
            {
              label: "Expires",
              value: company.subscription_expires_at
                ? format(new Date(company.subscription_expires_at), "dd MMM yyyy")
                : "Never",
              icon: Calendar,
              color: "text-slate-500"
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Plan Override */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Subscription Override</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manually set plan & expiry</p>
              </div>
              {!editingPlan ? (
                <Button variant="outline" className="rounded-xl text-xs font-black uppercase tracking-wide" onClick={() => setEditingPlan(true)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
              ) : (
                <button onClick={() => setEditingPlan(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Current Plan Badge */}
            <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", planMeta.color)}>
              <PlanIcon className="h-6 w-6" />
              <div>
                <p className="font-black text-sm uppercase tracking-wide">{company.plan_name || "Free"} Plan</p>
                <p className="text-xs opacity-70">Currently Active</p>
              </div>
            </div>

            <AnimatePresence>
              {editingPlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">New Plan</label>
                    <div className="relative">
                      <select
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 appearance-none"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Expiry Date (optional)</label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Leave blank for permanent/no expiry</p>
                  </div>

                  <Button
                    onClick={handlePlanSave}
                    disabled={saving}
                    className="w-full bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? "Saving..." : "Apply Plan Override"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Users List */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Company Users</h2>
                <p className="text-xs text-slate-400 mt-0.5">{users.length} total users in this workspace</p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {users.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">No users yet</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tight", getRoleColor(user.role))}>
                        {user.role}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(user.created_at))} ago
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
