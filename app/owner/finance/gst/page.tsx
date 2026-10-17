"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiClient } from "@/lib/apiClient"
import { gstReconciliationApi, type GstReconciliationItem, type GstReconciliationRun } from "@/lib/gstReconciliationApi"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileUp, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type GstInvoice = {
  id: string
  invoice_number: string
  customer_name: string | null
  subtotal: string | number
  cgst: string | number
  sgst: string | number
  igst: string | number
  total_tax: string | number
  total_amount: string | number
  is_inter_state: boolean
  created_at: string
  status: string
}

type GstSummary = {
  success: boolean
  period: string | null
  totals: { subtotal: string; cgst: string; sgst: string; igst: string; total_tax: string }
  invoices: GstInvoice[]
}

type PurchaseBillsResponse = { count: number; invoices: Array<{ invoiceNumber: string }> }
type RunDetails = { run: GstReconciliationRun; items: GstReconciliationItem[] }

const currentPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function money(value: string | number | null | undefined) {
  const numeric = Number(value || 0)
  return `₹${(Number.isFinite(numeric) ? numeric : 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function periodLabel(period: string) {
  const [year, month] = period.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

function statusVariant(status: string) {
  if (status === "completed" || status === "exact_match") return "default"
  if (status === "failed" || status === "missing_in_gstr" || status === "missing_in_books" || status === "tax_mismatch") return "destructive"
  return "secondary"
}

export default function UnifiedGSTPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("summary")
  const [period, setPeriod] = useState(currentPeriod)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totals, setTotals] = useState<GstSummary["totals"]>({ subtotal: "0.00", cgst: "0.00", sgst: "0.00", igst: "0.00", total_tax: "0.00" })
  const [invoices, setInvoices] = useState<GstInvoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [reconRuns, setReconRuns] = useState<GstReconciliationRun[]>([])
  const [purchaseCount, setPurchaseCount] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<RunDetails | null>(null)
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({})
  const [savingOverride, setSavingOverride] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchGSTData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setLoadError(null)
    try {
      const encodedPeriod = encodeURIComponent(period)
      const [summaryRes, runsRes, purchaseRes] = await Promise.all([
        apiClient<GstSummary>(`/api/finance/gst-summary?period=${encodedPeriod}`),
        gstReconciliationApi.getRuns(period, true) as Promise<{ runs: GstReconciliationRun[] }>,
        gstReconciliationApi.getVerifiedPurchaseInvoices(period) as Promise<PurchaseBillsResponse>,
      ])
      setTotals(summaryRes.totals)
      setInvoices(summaryRes.invoices || [])
      setReconRuns(runsRes.runs || [])
      setPurchaseCount(purchaseRes.count ?? purchaseRes.invoices?.length ?? 0)
    } catch (error: any) {
      setLoadError(error?.message || "Could not load GST records for this period. Retry to check the saved data.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => { void fetchGSTData() }, [fetchGSTData])

  useEffect(() => {
    if (typeof window === "undefined") return
    const queryTab = new URLSearchParams(window.location.search).get("tab")
    if (queryTab === "reconcile") setActiveTab("reconcile")

    const onNotification = (event: Event) => {
      const notification = (event as CustomEvent<any>).detail
      const type = String(notification?.type || "")
      if (type.startsWith("gst_") || type.startsWith("invoice_")) void fetchGSTData(true)
    }
    const onFocus = () => { if (document.visibilityState === "visible") void fetchGSTData(true) }
    window.addEventListener("smarterp:notification", onNotification)
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      window.removeEventListener("smarterp:notification", onNotification)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [fetchGSTData])

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const needle = searchTerm.trim().toLowerCase()
    return !needle || String(invoice.invoice_number || "").toLowerCase().includes(needle) || String(invoice.customer_name || "").toLowerCase().includes(needle)
  }), [invoices, searchTerm])

  const openRun = async (runId: string) => {
    try {
      const detail = await gstReconciliationApi.getRunDetails(runId) as RunDetails
      setSelectedRun(detail)
    } catch (error: any) {
      toast({ title: "Could not open reconciliation", description: error?.message || "Run details could not be loaded.", variant: "destructive" })
    }
  }

  const startReconciliation = async () => {
    if (!selectedFile) {
      setRunError("Select the official GSTR-2B JSON file for the selected period.")
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setRunError("The selected JSON file is larger than 10 MB.")
      return
    }
    setRunning(true)
    setRunError(null)
    try {
      const portalData = JSON.parse(await selectedFile.text())
      const result = await gstReconciliationApi.triggerRun({ financialPeriod: period, gstrType: "GSTR_2B", portalData }) as { summary?: { totalMatched?: number; totalMismatched?: number } }
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      toast({ title: "Reconciliation completed", description: `${result.summary?.totalMatched || 0} matched · ${result.summary?.totalMismatched || 0} review items.` })
      await fetchGSTData(true)
    } catch (error: any) {
      setRunError(error instanceof SyntaxError ? "The selected file is not valid JSON." : error?.message || "The reconciliation could not be completed. Retry after reviewing the file and purchase bills.")
    } finally {
      setRunning(false)
    }
  }

  const saveOverride = async (item: GstReconciliationItem) => {
    const notes = overrideNotes[item.id]?.trim()
    if (!notes || notes.length < 4) {
      toast({ title: "Review note required", description: "Add at least four characters explaining the manual decision.", variant: "destructive" })
      return
    }
    setSavingOverride(item.id)
    try {
      await gstReconciliationApi.overrideItemStatus(item.id, "manual_overridden", notes)
      setSelectedRun((current) => current ? { ...current, items: current.items.map((row) => row.id === item.id ? { ...row, match_status: "manual_overridden", ai_match_reasoning: notes } : row) } : current)
      toast({ title: "Review saved", description: "The reconciliation note was recorded." })
    } catch (error: any) {
      toast({ title: "Could not save review", description: error?.message || "Please retry.", variant: "destructive" })
    } finally {
      setSavingOverride(null)
    }
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
              <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" /> GST &amp; Tax
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Company invoice tax ledger and purchase-bill reconciliation. This workspace does not file returns with GSTN.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="gst-period">Return period</label>
            <Input id="gst-period" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 w-40" />
            <Button variant="outline" size="sm" onClick={() => void fetchGSTData(true)} disabled={loading || refreshing} className="h-9 rounded-xl text-xs font-bold">
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", (loading || refreshing) && "animate-spin")} /> Refresh data
            </Button>
          </div>
        </div>

        {loadError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div className="flex-1">{loadError}</div><Button variant="outline" size="sm" onClick={() => void fetchGSTData(true)}>Retry</Button></div>}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ["Taxable sales", totals.subtotal, "text-foreground"],
            ["CGST", totals.cgst, "text-indigo-700 dark:text-indigo-300"],
            ["SGST", totals.sgst, "text-blue-700 dark:text-blue-300"],
            ["IGST", totals.igst, "text-emerald-700 dark:text-emerald-300"],
            ["Output tax", totals.total_tax, "text-purple-700 dark:text-purple-300"],
          ].map(([label, value, color]) => <Card key={label} className="rounded-2xl border-border/70"><CardContent className="p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className={cn("mt-1 text-xl font-black", color)}>{loading && invoices.length === 0 ? "…" : money(value)}</p><p className="mt-1 text-[10px] text-muted-foreground">{periodLabel(period)} · issued invoices</p></CardContent></Card>)}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="h-auto flex-wrap rounded-2xl border border-border/70 bg-card p-1">
            <TabsTrigger value="summary" className="rounded-xl px-4 text-xs font-bold"><FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Sales tax ledger</TabsTrigger>
            <TabsTrigger value="reconcile" className="rounded-xl px-4 text-xs font-bold"><FileUp className="mr-1.5 h-3.5 w-3.5" /> Purchase reconciliation</TabsTrigger>
            <TabsTrigger value="status" className="rounded-xl px-4 text-xs font-bold"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Filing readiness</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card className="rounded-2xl border-border/70">
              <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><CardTitle className="text-base">Issued invoice tax ledger</CardTitle><CardDescription>Created, issued, paid, partially paid, viewed, and disputed invoices for this company and period. Draft and cancelled invoices are excluded.</CardDescription></div>
                <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" /><Input aria-label="Search invoices" placeholder="Search invoice or customer" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-9 pl-8 text-xs" /></div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[850px] text-left text-xs">
                    <thead className="border-b bg-muted/50 text-[10px] uppercase text-muted-foreground"><tr><th className="p-3">Date</th><th className="p-3">Invoice #</th><th className="p-3">Customer</th><th className="p-3 text-right">Taxable value</th><th className="p-3 text-right">CGST</th><th className="p-3 text-right">SGST</th><th className="p-3 text-right">IGST</th><th className="p-3 text-right">Total tax</th><th className="p-3">Status</th></tr></thead>
                    <tbody className="divide-y">
                      {loading && invoices.length === 0 ? <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Loading saved invoice data…</td></tr>
                        : !loadError && filteredInvoices.length === 0 ? <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">{invoices.length ? "No invoices match this search." : "No issued invoices in this period."}</td></tr>
                          : filteredInvoices.map((invoice) => <tr key={invoice.id} className="hover:bg-muted/30"><td className="whitespace-nowrap p-3">{new Date(invoice.created_at).toLocaleDateString("en-IN")}</td><td className="p-3 font-mono font-bold">{invoice.invoice_number}</td><td className="p-3">{invoice.customer_name || "Customer"}</td><td className="p-3 text-right">{money(invoice.subtotal)}</td><td className="p-3 text-right">{money(invoice.cgst)}</td><td className="p-3 text-right">{money(invoice.sgst)}</td><td className="p-3 text-right">{money(invoice.igst)}</td><td className="p-3 text-right font-bold">{money(invoice.total_tax)}</td><td className="p-3"><Badge variant={statusVariant(invoice.status) as any}>{invoice.status}</Badge></td></tr>)}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconcile" className="space-y-4">
            <Card className="rounded-2xl border-border/70">
              <CardHeader><CardTitle className="text-base">GSTR-2B purchase reconciliation</CardTitle><CardDescription>Compares the uploaded statement’s B2B invoices with verified, received purchase bills saved for this company and period. No GST portal login or filing occurs here.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm font-semibold">SmartERP books for {periodLabel(period)}</p><p className="text-xs text-muted-foreground">{purchaseCount == null ? "Loading verified purchase bills…" : `${purchaseCount} verified and received purchase bill${purchaseCount === 1 ? "" : "s"} found`}. Only records with a supplier invoice date in this month are included.</p></div>
                  <input ref={fileInputRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Select GSTR-2B JSON statement" onChange={(event) => { setSelectedFile(event.target.files?.[0] || null); setRunError(null) }} />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp className="mr-2 h-4 w-4" /> Choose GSTR-2B JSON</Button>
                </div>
                {selectedFile && <p className="text-xs text-muted-foreground">Selected: <span className="font-semibold text-foreground">{selectedFile.name}</span> · {(selectedFile.size / 1024).toFixed(0)} KB</p>}
                <p className="text-xs text-muted-foreground">This import currently supports GSTR-2B B2B invoice rows. Credit/debit notes and other statement sections are not imported. Verified purchase bills store total GST only, so component-level purchase GST cannot be reconciled until those components are persisted.</p>
                {runError && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{runError}</div>}
                <div className="flex justify-end"><Button onClick={() => void startReconciliation()} disabled={running || !selectedFile || loading}>{running && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}{running ? "Reconciling…" : "Run reconciliation"}</Button></div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70">
              <CardHeader><CardTitle className="text-base">Saved reconciliation runs</CardTitle><CardDescription>Latest saved run for each GSTR type and period. Open a run to review every match and mismatch.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {reconRuns.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{loadError ? "Reconciliation history could not be loaded." : "No reconciliation runs for this period."}</div> : reconRuns.map((run) => <div key={run.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{run.financial_period} · {run.gstr_type}</span><Badge variant={statusVariant(run.status) as any}>{run.status}</Badge>{run.version && <span className="text-xs text-muted-foreground">Version {run.version}</span>}</div><p className="mt-1 text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString("en-IN")} · {run.total_matched || 0} matched · {run.total_mismatched || 0} review items</p></div><Button size="sm" variant="outline" onClick={() => void openRun(run.id)}>Review run</Button></div>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card className="rounded-2xl border-border/70"><CardHeader><CardTitle className="text-base">Tax-period data readiness</CardTitle><CardDescription>These indicators describe records available in SmartERP. They do not represent government filing status.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-4"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Outward invoice ledger</div><p className="mt-2 text-sm text-muted-foreground">{invoices.length} issued invoice{invoices.length === 1 ? "" : "s"} recorded for {periodLabel(period)}.</p></div>
                <div className="rounded-xl border p-4"><div className="flex items-center gap-2 font-semibold"><FileSpreadsheet className="h-4 w-4 text-blue-600" /> Purchase-bill records</div><p className="mt-2 text-sm text-muted-foreground">{purchaseCount == null ? "Not available" : `${purchaseCount} verified and received bill${purchaseCount === 1 ? "" : "s"} found.`}</p></div>
                <div className="rounded-xl border border-amber-300/70 bg-amber-50/50 p-4 dark:bg-amber-950/20"><div className="flex items-center gap-2 font-semibold"><XCircle className="h-4 w-4 text-amber-600" /> GSTN filing connection</div><p className="mt-2 text-sm text-muted-foreground">Not configured. SmartERP has not filed a return or synchronized filing status with GSTN.</p></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedRun} onOpenChange={(open) => { if (!open) setSelectedRun(null) }}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          {selectedRun && <>
            <DialogHeader>
              <DialogTitle>Reconciliation review · {selectedRun.run.financial_period}</DialogTitle>
              <DialogDescription>{selectedRun.run.gstr_type} · {selectedRun.run.status} · Run {selectedRun.run.version || "—"}</DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[1100px] text-left text-xs">
                <thead className="bg-muted/50 text-[10px] uppercase"><tr><th className="p-2">Supplier</th><th className="p-2">Books invoice</th><th className="p-2">Statement invoice</th><th className="p-2 text-right">Books taxable</th><th className="p-2 text-right">Statement taxable</th><th className="p-2 text-right">Variance</th><th className="p-2">Status</th><th className="p-2">Review note / action</th></tr></thead>
                <tbody className="divide-y">
                  {selectedRun.items.map((item) => <tr key={item.id}>
                    <td className="p-2">{item.supplier_name}<div className="font-mono text-[10px] text-muted-foreground">{item.supplier_gstin}</div></td><td className="p-2">{item.invoice_number_books || "—"}</td><td className="p-2">{item.invoice_number_portal || "—"}</td><td className="p-2 text-right">{money(item.taxable_value_books)}</td><td className="p-2 text-right">{money(item.taxable_value_portal)}</td><td className="p-2 text-right">{money(item.variance_amount)}</td>
                    <td className="p-2"><Badge variant={statusVariant(item.match_status) as any}>{item.match_status}</Badge><p className="mt-1 max-w-64 text-[10px] text-muted-foreground">{item.ai_match_reasoning}</p></td>
                    <td className="p-2"><div className="flex min-w-56 gap-2"><Input aria-label={`Review note for ${item.invoice_number_books || item.invoice_number_portal}`} value={overrideNotes[item.id] ?? ""} onChange={(event) => setOverrideNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Explain manual review" /><Button size="sm" variant="outline" disabled={savingOverride === item.id || item.match_status === "manual_overridden"} onClick={() => void saveOverride(item)}>{savingOverride === item.id ? "Saving…" : "Mark reviewed"}</Button></div></td>
                  </tr>)}
                  {selectedRun.items.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No invoice rows were saved in this run.</td></tr>}
                </tbody>
              </table>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  )
}
