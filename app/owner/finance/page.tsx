"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import {
  DollarSign, FileText, CreditCard, Clock, TrendingUp, AlertCircle, CheckCircle2,
  ShieldCheck, ArrowRight, Loader2, RefreshCw
} from "lucide-react"

export default function FinanceDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>({
    total_invoiced: 0,
    total_paid: 0,
    total_outstanding: 0,
    total_tax_collected: 0,
    pending_count: 0,
    paid_count: 0,
    disputed_count: 0,
    overdue_count: 0,
    overdue_amount: 0,
  })

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; summary: any }>("/api/finance/summary")
      if (res && res.success) {
        setSummary(res.summary)
      }
    } catch (err: any) {
      console.error("Error fetching finance summary:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Executive Finance Command Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Consolidated enterprise financial architecture: Invoices, Billing, Accounts Receivable, and GST Compliance.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSummary} className="h-9 text-xs font-bold rounded-xl">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Financials
          </Button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-l-4 border-l-indigo-600 border-border/70 p-4 bg-card shadow-xs">
            <div className="flex justify-between items-center text-muted-foreground text-[10px] font-extrabold uppercase">
              <span>Total Invoiced</span>
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              ₹{Number(summary.total_invoiced || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Across all finalized customer job invoices</div>
          </Card>

          <Card className="rounded-2xl border-l-4 border-l-emerald-600 border-border/70 p-4 bg-card shadow-xs">
            <div className="flex justify-between items-center text-muted-foreground text-[10px] font-extrabold uppercase">
              <span>Collected Revenue</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              ₹{Number(summary.total_paid || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">{summary.paid_count || 0} invoices paid in full</div>
          </Card>

          <Card className="rounded-2xl border-l-4 border-l-amber-500 border-border/70 p-4 bg-card shadow-xs">
            <div className="flex justify-between items-center text-muted-foreground text-[10px] font-extrabold uppercase">
              <span>Outstanding AR</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-foreground mt-2">
              ₹{Number(summary.total_outstanding || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{summary.pending_count || 0} pending invoices</div>
          </Card>

          <Card className="rounded-2xl border-l-4 border-l-purple-600 border-border/70 p-4 bg-card shadow-xs">
            <div className="flex justify-between items-center text-muted-foreground text-[10px] font-extrabold uppercase">
              <span>GST Liabilities</span>
              <ShieldCheck className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
              ₹{Number(summary.total_tax_collected || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">CGST / SGST / IGST Statutory Tax</div>
          </Card>
        </div>

        {/* Unified 4-Module Navigation Grid */}
        <div className="space-y-3 pt-2">
          <h2 className="text-base font-black text-foreground">Core Financial Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card
              className="rounded-2xl border border-border/70 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-card"
              onClick={() => router.push("/owner/finance/invoices")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" /> Invoices & Billing
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-xs">Dispatch, track, and process customer invoices and billing disputes.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between"><span>Pending / Issued:</span> <strong className="text-foreground">{summary.pending_count || 0}</strong></div>
                  <div className="flex justify-between"><span>Disputed Issues:</span> <strong className="text-amber-600">{summary.disputed_count || 0}</strong></div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl border border-border/70 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer bg-card"
              onClick={() => router.push("/owner/finance/payments")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-600" /> Payments & Accounts Receivable
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-xs">Collection ledger, payment receipts, and AR aging schedules.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between"><span>Overdue Invoices:</span> <strong className="text-rose-600">{summary.overdue_count || 0}</strong></div>
                  <div className="flex justify-between"><span>Overdue Amount:</span> <strong className="text-rose-600">₹{Number(summary.overdue_amount || 0).toLocaleString("en-IN")}</strong></div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl border border-border/70 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer bg-card"
              onClick={() => router.push("/owner/finance/gst")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-600" /> GST & Tax Compliance
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-xs">Single source of truth for GSTR-1, GSTR-2B reconciliation, and statutory filing.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between"><span>GST Filing Status:</span> <strong className="text-emerald-600">Active</strong></div>
                  <div className="flex justify-between"><span>Total Tax Liability:</span> <strong className="text-purple-600">₹{Number(summary.total_tax_collected || 0).toLocaleString("en-IN")}</strong></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
