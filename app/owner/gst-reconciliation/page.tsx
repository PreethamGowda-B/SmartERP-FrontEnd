"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { gstReconciliationApi, GstReconciliationRun, GstReconciliationItem } from "@/lib/gstReconciliationApi"
import { 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  Send, 
  Settings2, 
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Info
} from "lucide-react"

export default function GstReconciliationPage() {
  const { toast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-07")
  const [gstrType, setGstrType] = useState<"GSTR_2A" | "GSTR_2B">("GSTR_2B")
  const [runs, setRuns] = useState<GstReconciliationRun[]>([])
  const [activeRun, setActiveRun] = useState<GstReconciliationRun | null>(null)
  const [items, setItems] = useState<GstReconciliationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Modals
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false)
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState<boolean>(false)
  const [selectedOverrideItem, setSelectedOverrideItem] = useState<GstReconciliationItem | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<string>("exact_match")
  const [overrideReasoning, setOverrideReasoning] = useState<string>("")

  // Settings State
  const [autoPaymentBlock, setAutoPaymentBlock] = useState<boolean>(false)
  const [toleranceAmount, setToleranceAmount] = useState<number>(5.00)

  // OTP Form State
  const [gstin, setGstin] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const [otpSent, setOtpSent] = useState<boolean>(false)

  useEffect(() => {
    fetchRuns()
  }, [selectedPeriod])

  const fetchRuns = async () => {
    try {
      setLoading(true)
      const data = await gstReconciliationApi.getRuns(selectedPeriod, true)
      if (data.success && data.runs.length > 0) {
        setRuns(data.runs)
        setActiveRun(data.runs[0])
        fetchRunDetails(data.runs[0].id)
      } else {
        setRuns([])
        setActiveRun(null)
        setItems([])
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load reconciliation runs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRunDetails = async (runId: string) => {
    try {
      const data = await gstReconciliationApi.getRunDetails(runId)
      if (data.success) {
        setItems(data.items || [])
      }
    } catch (err: any) {
      console.error("Error loading run items:", err)
    }
  }

  const handleRequestOtp = async () => {
    if (!gstin) {
      toast({ title: "Validation Error", description: "Please enter a valid GSTIN.", variant: "destructive" })
      return
    }
    try {
      await gstReconciliationApi.requestGspOtp(gstin, "PROZYNC_USER")
      setOtpSent(true)
      toast({ title: "OTP Sent", description: "6-digit OTP sent to registered mobile/email." })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to request GSP OTP.", variant: "destructive" })
    }
  }

  const handleVerifyOtpAndRun = async () => {
    try {
      await gstReconciliationApi.verifyGspOtp(gstin, otp)
      toast({ title: "GSTN Session Authenticated", description: "Running automated reconciliation..." })
      setIsOtpModalOpen(false)

      // Sample mock data simulation for demonstration
      const sampleBooks = [
        { supplierGstin: gstin || "27AAAAA0000A1Z5", supplierName: "Acme Industrial Supplies", invoiceNumber: "INV/2026/001", invoiceDate: "2026-07-10", taxableValue: 50000, cgst: 4500, sgst: 4500, igst: 0 },
        { supplierGstin: gstin || "27AAAAA0000A1Z5", supplierName: "Acme Industrial Supplies", invoiceNumber: "INV/2026/002", invoiceDate: "2026-07-15", taxableValue: 120000, cgst: 10800, sgst: 10800, igst: 0 },
        { supplierGstin: "29BBBBB1111B2Z6", supplierName: "TechServe Global", invoiceNumber: "TS-8849", invoiceDate: "2026-07-18", taxableValue: 35000, cgst: 0, sgst: 0, igst: 6300 },
      ]

      const samplePortal = [
        { supplierGstin: gstin || "27AAAAA0000A1Z5", supplierName: "Acme Industrial Supplies", invoiceNumber: "INV2026001", invoiceDate: "2026-07-10", taxableValue: 50000, cgst: 4500, sgst: 4500, igst: 0 },
        { supplierGstin: gstin || "27AAAAA0000A1Z5", supplierName: "Acme Industrial Supplies", invoiceNumber: "INV/2026/002", invoiceDate: "2026-07-15", taxableValue: 118000, cgst: 10620, sgst: 10620, igst: 0 },
      ]

      await gstReconciliationApi.triggerRun({
        financialPeriod: selectedPeriod,
        gstrType: gstrType,
        booksInvoices: sampleBooks,
        portalInvoices: samplePortal,
      })

      fetchRuns()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to complete run.", variant: "destructive" })
    }
  }

  const handleOverrideSubmit = async () => {
    if (!selectedOverrideItem) return
    try {
      await gstReconciliationApi.overrideItemStatus(selectedOverrideItem.id, overrideStatus, overrideReasoning)
      toast({ title: "Item Overridden", description: "Match status updated with audit log." })
      setSelectedOverrideItem(null)
      if (activeRun) fetchRunDetails(activeRun.id)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update item.", variant: "destructive" })
    }
  }

  const handleNotifyVendors = async () => {
    if (!activeRun) return
    try {
      const data = await gstReconciliationApi.notifyVendors(activeRun.id)
      toast({ title: "WhatsApp Reminders Triggered", description: data.message })
      setIsNotifyModalOpen(false)
      fetchRunDetails(activeRun.id)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send reminders.", variant: "destructive" })
    }
  }

  const handleSaveSettings = async () => {
    try {
      await gstReconciliationApi.updateSettings({
        isAutoPaymentBlockEnabled: autoPaymentBlock,
        canonicalToleranceAmount: toleranceAmount,
      })
      toast({ title: "Settings Saved", description: "Company GST policies updated." })
      setIsSettingsModalOpen(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save settings.", variant: "destructive" })
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesFilter = filterStatus === "all" || item.match_status === filterStatus
    const matchesSearch =
      item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoice_number_books && item.invoice_number_books.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <OwnerLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileCheck2 className="h-7 w-7 text-primary" />
              GST Reconciliation Agent (GSTR-2A/2B)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated Input Tax Credit (ITC) matching engine, Rule 36(4) compliance, and vendor discrepancy alerts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSettingsModalOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button size="sm" onClick={() => setIsOtpModalOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run GSTR-2B Match
            </Button>
          </div>
        </div>

        {/* CGST Rule 36(4) Amber Warning Banner for GSTR-2A */}
        {gstrType === "GSTR_2A" && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">CGST Rule 36(4) Compliance Warning</h4>
              <p className="text-xs mt-1">
                GSTR-2A is a dynamic, real-time draft stream and is <strong>informational only</strong>. Under Section 16(2)(aa) of the CGST Act and Rule 36(4), Input Tax Credit can <strong>ONLY</strong> be legally claimed against finalized <strong>GSTR-2B</strong> statements. Claim ITC actions are disabled in 2A mode.
              </p>
            </div>
          </div>
        )}

        {/* Period & Statement Type Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Financial Period</Label>
              <Input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-9 w-40 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Statement Type</Label>
              <div className="flex items-center gap-1 mt-1 bg-muted p-1 rounded-md">
                <Button
                  variant={gstrType === "GSTR_2B" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setGstrType("GSTR_2B")}
                >
                  GSTR-2B (Authoritative)
                </Button>
                <Button
                  variant={gstrType === "GSTR_2A" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setGstrType("GSTR_2A")}
                >
                  GSTR-2A (Dynamic)
                </Button>
              </div>
            </div>
          </div>
          {activeRun && (
            <div className="text-right">
              <Badge variant="outline" className="text-xs">
                Version {activeRun.version} ({activeRun.is_latest ? "Latest Run" : "Superseded"})
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Processed on: {new Date(activeRun.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* KPI Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eligible Claimable ITC</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{activeRun ? Number(activeRun.total_itc_claimed).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeRun ? activeRun.total_matched : 0} Invoices Matched
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocked / At Risk ITC</CardTitle>
              <XCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                ₹{activeRun ? Number(activeRun.total_itc_blocked).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeRun ? activeRun.total_mismatched : 0} Invoices Discrepant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Match Accuracy</CardTitle>
              <FileCheck2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {activeRun && activeRun.total_books_invoices > 0
                  ? `${Math.round((activeRun.total_matched / activeRun.total_books_invoices) * 100)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Deterministic Weighted Match</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Supplier Compliance</CardTitle>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">98.5%</div>
              <p className="text-xs text-muted-foreground mt-1">Compliant Vendor Ratio</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table Container */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Reconciliation Line Items</CardTitle>
              <CardDescription>
                Comparison of Purchase Register Books vs GSTR-2B Statement
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNotifyModalOpen(true)}
                disabled={!activeRun || activeRun.total_mismatched === 0}
              >
                <Send className="mr-2 h-4 w-4 text-emerald-500" />
                Notify Non-Compliant Vendors
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-80">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search GSTIN, Vendor, Invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="all">All Match Statuses</option>
                  <option value="exact_match">Exact Match</option>
                  <option value="fuzzy_match">Fuzzy Match</option>
                  <option value="tax_mismatch">Tax Mismatch</option>
                  <option value="missing_in_gstr">Missing in GSTR-2B</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Supplier GSTIN / Name</th>
                    <th className="px-4 py-3">Books Invoice</th>
                    <th className="px-4 py-3">Portal Invoice</th>
                    <th className="px-4 py-3">Taxable Value</th>
                    <th className="px-4 py-3">Variance</th>
                    <th className="px-4 py-3">Confidence Score</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Loading reconciliation items...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No reconciliation line items found for this period. Click "Run GSTR-2B Match" to begin.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.supplier_name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{item.supplier_gstin}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{item.invoice_number_books || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">{item.invoice_date_books || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{item.invoice_number_portal || "Missing"}</div>
                          <div className="text-xs text-muted-foreground">{item.invoice_date_portal || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>₹{Number(item.taxable_value_books).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            Portal: ₹{Number(item.taxable_value_portal).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {Number(item.variance_amount) > 0 ? (
                            <span className="text-rose-500">+₹{Number(item.variance_amount).toFixed(2)}</span>
                          ) : (
                            <span className="text-emerald-500">₹0.00</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs">{item.confidence_score}%</span>
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  Number(item.confidence_score) >= 90
                                    ? "bg-emerald-500"
                                    : Number(item.confidence_score) >= 70
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${item.confidence_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.match_status === "exact_match" && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Exact Match</Badge>
                          )}
                          {item.match_status === "fuzzy_match" && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Fuzzy Match</Badge>
                          )}
                          {item.match_status === "tax_mismatch" && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Tax Mismatch</Badge>
                          )}
                          {item.match_status === "missing_in_gstr" && (
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30">Missing in 2B</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedOverrideItem(item)
                              setOverrideStatus(item.match_status)
                              setOverrideReasoning(item.ai_match_reasoning || "")
                            }}
                          >
                            Review / Override
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* GSP OTP Modal */}
        <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect GST Portal (GSP/ASP OTP Session)</DialogTitle>
              <DialogDescription>
                Authenticate session via Masters India / ClearTax ASP API to fetch GSTR-2B statement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Supplier / Company GSTIN</Label>
                <Input
                  placeholder="27AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  disabled={otpSent}
                />
              </div>
              {otpSent && (
                <div>
                  <Label>6-Digit GSTN Session OTP</Label>
                  <Input placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
              )}
            </div>
            <DialogFooter>
              {!otpSent ? (
                <Button onClick={handleRequestOtp}>Send OTP</Button>
              ) : (
                <Button onClick={handleVerifyOtpAndRun}>Verify OTP & Execute Run</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Override Modal */}
        <Dialog open={!!selectedOverrideItem} onOpenChange={() => setSelectedOverrideItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review & Manual Override</DialogTitle>
              <DialogDescription>
                Override deterministic status with audit log record for Supplier {selectedOverrideItem?.supplier_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Override Status</Label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full h-9 mt-1 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="exact_match">Approve as Exact Match</option>
                  <option value="fuzzy_match">Approve as Fuzzy Match</option>
                  <option value="tax_mismatch">Mark Tax Mismatch</option>
                  <option value="missing_in_gstr">Mark Missing in GSTR-2B</option>
                </select>
              </div>
              <div>
                <Label>Audit Reason / Notes</Label>
                <Input
                  placeholder="e.g. Verified paper invoice copy with vendor..."
                  value={overrideReasoning}
                  onChange={(e) => setOverrideReasoning(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleOverrideSubmit}>Save Audit Override</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Reminders Dialog */}
        <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-500" />
                WhatsApp Vendor Reminder (Meta Utility Template)
              </DialogTitle>
              <DialogDescription>
                Sends Meta pre-approved template <code>gst_invoice_mismatch_v1</code> to {activeRun?.total_mismatched} non-compliant vendors.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border bg-muted/40 p-4 text-xs space-y-2">
              <p className="font-semibold text-foreground">Pre-Approved Template Preview:</p>
              <p className="text-muted-foreground font-mono">
                "Hello [Vendor Name], this is an automated message from [Company Name]. We identified a GST reconciliation mismatch for Invoice [Invoice No] (Taxable Value: ₹[Amount]). Please file GSTR-1 for timely ITC claims."
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleNotifyVendors} className="bg-emerald-600 hover:bg-emerald-700">
                Send WhatsApp Reminders
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Company GST Reconciliation Settings</DialogTitle>
              <DialogDescription>
                Configure vendor payment blocking policies and tolerance thresholds.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <Label className="font-semibold">Automatic Payment Blocking</Label>
                  <p className="text-xs text-muted-foreground">
                    Default is Off (Flag & Notify). When enabled, payments to non-compliant vendors require Owner PIN override.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPaymentBlock}
                  onChange={(e) => setAutoPaymentBlock(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>

              <div>
                <Label>Canonical Monetary Tolerance Threshold (₹)</Label>
                <Input
                  type="number"
                  value={toleranceAmount}
                  onChange={(e) => setToleranceAmount(parseFloat(e.target.value))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default: ₹5.00 (Accounts for standard Indian GST rounding variances).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSettings}>Save Company Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
