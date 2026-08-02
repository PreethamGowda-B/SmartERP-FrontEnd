"use client"

import React, { useState, useEffect, useCallback } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"
import {
  ShieldCheck, FileSpreadsheet, RefreshCw, FileText, CheckCircle2, AlertTriangle,
  Search, Filter, Download, ArrowUpRight, DollarSign, Clock, ShieldAlert, Layers
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function UnifiedGSTPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("summary")
  const [loading, setLoading] = useState(true)

  // GST Summary & GSTR-1 Ledger data
  const [totals, setTotals] = useState<any>({ subtotal: "0", cgst: "0", sgst: "0", igst: "0", total_tax: "0" })
  const [invoices, setInvoices] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Reconciliation Runs Data
  const [reconRuns, setReconRuns] = useState<any[]>([])

  const fetchGSTData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, reconRes] = await Promise.all([
        apiClient<{ success: boolean; totals: any; invoices: any[] }>("/api/finance/gst-summary").catch(() => null),
        apiClient<any>("/api/gst-reconciliation/runs").catch(() => null),
      ])

      if (summaryRes && summaryRes.success) {
        setTotals(summaryRes.totals || { subtotal: "0", cgst: "0", sgst: "0", igst: "0", total_tax: "0" })
        setInvoices(summaryRes.invoices || [])
      }

      if (reconRes && reconRes.runs) {
        setReconRuns(reconRes.runs)
      }
    } catch (err: any) {
      toast({ title: "Error fetching GST data", description: err?.message || "Could not synchronize GST records.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchGSTData()
  }, [fetchGSTData])

  const filteredInvoices = invoices.filter((inv) =>
    (inv.invoice_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              GST & Tax Compliance Command Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              GSTR-1 filing summary, CGST/SGST/IGST liability ledgers, 2A/2B mismatch reconciliation, and tax analytics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchGSTData} disabled={loading} className="h-9 text-xs font-bold rounded-xl">
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
              Sync GST Portal
            </Button>
          </div>
        </div>

        {/* GST KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-purple-800 dark:text-purple-300">Total Tax Liability</div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1">₹{Number(totals.total_tax || 0).toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-1">GSTR-1 Outward Liabilities</p>
          </Card>

          <Card className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-indigo-800 dark:text-indigo-300">CGST (Central Tax)</div>
            <div className="text-2xl font-black text-foreground mt-1">₹{Number(totals.cgst || 0).toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Intrastate Central Component</p>
          </Card>

          <Card className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-blue-800 dark:text-blue-300">SGST (State Tax)</div>
            <div className="text-2xl font-black text-foreground mt-1">₹{Number(totals.sgst || 0).toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Intrastate State Component</p>
          </Card>

          <Card className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
            <div className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">IGST (Interstate Tax)</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">₹{Number(totals.igst || 0).toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Interstate Supply Component</p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border/70 p-1 rounded-2xl h-11">
            <TabsTrigger value="summary" className="rounded-xl text-xs font-bold px-4">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> GSTR-1 Sales Ledger
            </TabsTrigger>
            <TabsTrigger value="reconcile" className="rounded-xl text-xs font-bold px-4">
              <Layers className="h-3.5 w-3.5 mr-1.5" /> GSTR-2B Reconciliation
            </TabsTrigger>
            <TabsTrigger value="status" className="rounded-xl text-xs font-bold px-4">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Filing Status & Timelines
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GSTR-1 Sales Ledger */}
          <TabsContent value="summary" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search invoice number or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl"
                />
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold px-3 py-1">
                {filteredInvoices.length} Tax Invoices Recorded
              </Badge>
            </div>

            <Card className="rounded-2xl border border-border/70 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b uppercase font-extrabold">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5 text-right">Taxable Value</th>
                      <th className="p-3.5 text-right">CGST</th>
                      <th className="p-3.5 text-right">SGST</th>
                      <th className="p-3.5 text-right">IGST</th>
                      <th className="p-3.5 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading tax ledgers...</td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">No tax invoices matching filter criteria.</td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-foreground">{inv.invoice_number}</td>
                          <td className="p-3.5 font-semibold text-foreground">{inv.customer_name || "Client"}</td>
                          <td className="p-3.5 text-right font-semibold">₹{Number(inv.subtotal || 0).toLocaleString("en-IN")}</td>
                          <td className="p-3.5 text-right text-muted-foreground">₹{Number(inv.cgst || 0).toLocaleString("en-IN")}</td>
                          <td className="p-3.5 text-right text-muted-foreground">₹{Number(inv.sgst || 0).toLocaleString("en-IN")}</td>
                          <td className="p-3.5 text-right text-muted-foreground">₹{Number(inv.igst || 0).toLocaleString("en-IN")}</td>
                          <td className="p-3.5 text-right font-black text-purple-600 dark:text-purple-400">
                            ₹{Number(inv.total_tax || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: Reconciliation Runs */}
          <TabsContent value="reconcile" className="space-y-4">
            <Card className="rounded-2xl border border-border/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">GSTR-2B Input Tax Credit (ITC) Reconciliation</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Automated mismatch detection between purchase bills and GST portal downloads</p>
                </div>
                <Button size="sm" className="h-8 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
                  + New Reconciliation Run
                </Button>
              </div>

              {reconRuns.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl space-y-2">
                  <ShieldAlert className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-bold text-foreground">No Reconciliation Runs Yet</p>
                  <p className="text-[11px] text-muted-foreground">Run GSTR-2B reconciliation to claim maximum ITC and catch supplier mismatches.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reconRuns.map((run) => (
                    <div key={run.id} className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-foreground">Period: {run.period} ({run.gstr_type})</span>
                        <p className="text-[10px] text-muted-foreground">Ran on {new Date(run.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge className="text-[10px] font-extrabold uppercase px-2.5 py-0.5">
                        {run.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB 3: Filing Status & Deadlines */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl border border-border/70 p-5">
                <h4 className="font-extrabold text-sm text-foreground mb-1">GSTR-1 Outward Filing</h4>
                <p className="text-xs text-muted-foreground mb-3">Due by 11th of every month</p>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] uppercase font-bold">Up to Date</Badge>
              </Card>

              <Card className="rounded-2xl border border-border/70 p-5">
                <h4 className="font-extrabold text-sm text-foreground mb-1">GSTR-3B Summary Return</h4>
                <p className="text-xs text-muted-foreground mb-3">Due by 20th of every month</p>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] uppercase font-bold">Next Due: 20th</Badge>
              </Card>

              <Card className="rounded-2xl border border-border/70 p-5">
                <h4 className="font-extrabold text-sm text-foreground mb-1">GSTR-2B Auto-Drafted ITC</h4>
                <p className="text-xs text-muted-foreground mb-3">Generated on 14th of every month</p>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] uppercase font-bold">Auto Synchronized</Badge>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OwnerLayout>
  )
}
