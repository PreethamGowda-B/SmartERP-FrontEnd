"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  RefreshCcw,
  Zap,
  RotateCcw,
  Receipt,
  Calendar,
  X
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AdminLayout } from "@/components/admin-layout"
import { formatDistanceToNow } from "date-fns"

interface CompanySubscription {
  id: number
  company_name: string
  plan_name: string
  plan_id: number
  subscription_expires_at: string
  is_on_trial: boolean
  is_first_login: boolean
}

interface PaymentTransaction {
  id: number
  company_id: number
  company_name: string
  plan_id: number
  plan_name: string
  start_date: string
  end_date: string
  status: string
  created_at: string
}

const PLANS = [
  { id: 1, name: 'Free', price: '₹0' },
  { id: 2, name: 'Basic', price: '₹4,999' },
  { id: 3, name: 'Pro', price: '₹14,999' }
]

function safeDistance(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

export default function AdminSubscriptions() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments'>('subscriptions')
  
  // Subscriptions state
  const [companies, setCompanies] = useState<CompanySubscription[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<{[key: number]: number}>({})
  const [searchCompanyQuery, setSearchCompanyQuery] = useState("")

  // Payments ledger state
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsTotal, setPaymentsTotal] = useState(0)

  // Refund modal state
  const [refundTarget, setRefundTarget] = useState<PaymentTransaction | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [refundLoading, setRefundLoading] = useState(false)

  const fetchSubscriptions = useCallback(async () => {
    setLoadingCompanies(true)
    try {
      const data = await apiClient<CompanySubscription[]>("/api/admin/companies")
      setCompanies(data || [])
    } catch {
      toast.error("Failed to load platform subscription data")
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  const fetchPayments = useCallback(async (page = 1) => {
    setLoadingPayments(true)
    try {
      const res = await apiClient<{ payments: PaymentTransaction[]; pagination: { total: number } }>(`/api/admin/payments?page=${page}&limit=20`)
      setPayments(res?.payments || [])
      setPaymentsTotal(res?.pagination?.total || 0)
      setPaymentsPage(page)
    } catch {
      toast.error("Failed to load payment transactions")
    } finally {
      setLoadingPayments(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments(1)
    }
  }, [activeTab, fetchPayments])

  const updatePlan = async (companyId: number) => {
    const planId = selectedPlan[companyId]
    if (!planId) return

    try {
      await apiClient(`/api/admin/subscriptions/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          plan_id: planId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
      setCompanies(prev => prev.map(c => c.id === companyId ? {
        ...c,
        plan_id: planId,
        plan_name: PLANS.find(p => p.id === planId)?.name || c.plan_name,
        is_on_trial: false
      } : c))
      toast.success("Subscription plan updated manually for 30 days")
    } catch {
      toast.error("Failed to update plan")
    }
  }

  const handleExecuteRefund = async () => {
    if (!refundTarget) return
    setRefundLoading(true)
    try {
      await apiClient(`/api/admin/payments/${refundTarget.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason })
      })
      setPayments(prev => prev.map(p => p.id === refundTarget.id ? { ...p, status: 'refunded' } : p))
      toast.success(`Transaction #${refundTarget.id} marked as refunded`)
      setRefundTarget(null)
      setRefundReason("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to process refund")
    } finally {
      setRefundLoading(false)
    }
  }

  const filteredCompanies = (Array.isArray(companies) ? companies : []).filter(c => 
    c.company_name?.toLowerCase().includes(searchCompanyQuery.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Subscription & Billing Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Tenant subscription tiers, manual override controls, and payment gateway transactions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'subscriptions'
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Tenant Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'payments'
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Payment Ledger
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab 1: Tenant Subscriptions ─────────────────────────────────────── */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {/* Search toolbar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search organization by name..."
                  value={searchCompanyQuery}
                  onChange={(e) => setSearchCompanyQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-medium focus:bg-white"
                />
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 pl-6">Company Name</th>
                      <th className="py-3.5">Current Tier</th>
                      <th className="py-3.5">Trial Status</th>
                      <th className="py-3.5">Expires At</th>
                      <th className="py-3.5">Override Tier</th>
                      <th className="py-3.5 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingCompanies ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 pl-6"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-8 w-28 bg-slate-100 rounded" /></td>
                          <td className="py-4 pr-6 text-right"><div className="h-8 w-20 bg-slate-100 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No organizations found.
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pl-6 font-bold text-slate-900">
                            {c.company_name}
                          </td>
                          <td className="py-3.5">
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                              {c.plan_name || "Free"}
                            </Badge>
                          </td>
                          <td className="py-3.5">
                            <Badge className={
                              c.is_on_trial 
                                ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold"
                                : "bg-slate-100 text-slate-600 border-slate-200 text-[10px]"
                            }>
                              {c.is_on_trial ? "Free Trial" : "Standard"}
                            </Badge>
                          </td>
                          <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                            {c.subscription_expires_at ? new Date(c.subscription_expires_at).toLocaleDateString() : "Lifetime"}
                          </td>
                          <td className="py-3.5">
                            <select
                              value={selectedPlan[c.id] || c.plan_id || 1}
                              onChange={(e) => setSelectedPlan({ ...selectedPlan, [c.id]: Number(e.target.value) })}
                              className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white"
                            >
                              {PLANS.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.price})</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 pr-6 text-right">
                            <Button
                              size="sm"
                              onClick={() => updatePlan(c.id)}
                              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Apply
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Payment Gateway Ledger ──────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Payment Gateway Transactions</h3>
                  <p className="text-xs text-slate-500">Total recorded transactions: {paymentsTotal}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPayments(paymentsPage)}
                  disabled={loadingPayments}
                  className="h-8 px-2.5 text-xs font-semibold rounded-xl"
                >
                  <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${loadingPayments ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 pl-6">TX ID</th>
                      <th className="py-3.5">Organization</th>
                      <th className="py-3.5">Purchased Tier</th>
                      <th className="py-3.5">Coverage Period</th>
                      <th className="py-3.5">Status</th>
                      <th className="py-3.5">Date</th>
                      <th className="py-3.5 text-right pr-6">Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingPayments ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4 pl-6"><div className="h-4 w-12 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                          <td className="py-4 pr-6 text-right"><div className="h-4 w-16 bg-slate-100 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No payment transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => {
                        const isRefunded = p.status === 'refunded'
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 pl-6 font-mono font-bold text-slate-700">
                              #{p.id}
                            </td>
                            <td className="py-3.5 font-bold text-slate-900">
                              {p.company_name || `Company #${p.company_id}`}
                            </td>
                            <td className="py-3.5">
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                                {p.plan_name || "Tier Plan"}
                              </Badge>
                            </td>
                            <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                              {p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"} → {p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-3.5">
                              <Badge className={
                                isRefunded
                                  ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                              }>
                                {p.status || "active"}
                              </Badge>
                            </td>
                            <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                              {safeDistance(p.created_at)}
                            </td>
                            <td className="py-3.5 pr-6 text-right">
                              {!isRefunded ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRefundTarget(p)}
                                  className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                  Refund
                                </Button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono italic">Refunded</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Refund Modal ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {refundTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setRefundTarget(null)}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Issue Payment Refund
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Transaction #{refundTarget.id} • {refundTarget.company_name}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setRefundTarget(null)} className="h-7 w-7 rounded-lg text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Reason for Refund</label>
                  <Input
                    type="text"
                    placeholder="e.g. Administrative refund requested by tenant..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setRefundTarget(null)} className="h-9 px-4 rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={refundLoading}
                    onClick={handleExecuteRefund}
                    className="h-9 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {refundLoading ? "Processing..." : "Confirm Refund"}
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
