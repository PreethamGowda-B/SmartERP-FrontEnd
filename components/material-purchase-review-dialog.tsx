"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FileText, RefreshCw } from "lucide-react"

type Finding = { code: string; severity: "critical" | "warning"; message: string; values?: { candidates?: Array<{ id: number; name: string; unit?: string }> } }
type Bill = {
  id: string; version: number; file_name: string; supplier_name?: string; invoice_number?: string; invoice_date?: string
  purchased_quantity?: number; purchased_unit?: string; unit_price?: number; subtotal?: number; tax_amount?: number
  invoice_total?: number; currency?: string; supplier_gstin?: string; notes?: string; ai_status: string
  draft_status: string; extraction?: any; discrepancies: Finding[]; rejection_reason?: string; matched_inventory_item_id?: number
  file_url: string; created_at: string; verified_at?: string; receipt_transaction_id?: string
}

export function MaterialPurchaseReviewDialog({ request, onUpdated }: { request: { id: number; item_name: string; quantity: number; unit?: string | null; requested_by_name: string; reviewed_by_name?: string | null; reviewed_at?: string | null; status: string }; onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [reason, setReason] = useState("")
  const [received, setReceived] = useState(false)
  const [acknowledged, setAcknowledged] = useState<string[]>([])
  const [inventoryId, setInventoryId] = useState("")
  const [mappingReason, setMappingReason] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const data = await apiClient<{ bills: Bill[] }>(`/api/material-requests/${request.id}/purchase-bills`, { signal: AbortSignal.timeout(20000) })
      setBills(Array.isArray(data.bills) ? data.bills : [])
    } catch (err: any) { setError(err?.message || "Unable to load bill details.") }
    finally { setLoading(false) }
  }, [request.id])

  useEffect(() => { if (open) refresh() }, [open, refresh])
  const current = bills.find((bill) => bill.draft_status === "awaiting_owner_verification") || bills[0]
  const findings = current?.discrepancies || []
  const warnings = findings.filter((item) => item.severity === "warning")
  const critical = findings.filter((item) => item.severity === "critical")
  const toggleAck = (code: string) => setAcknowledged((items) => items.includes(code) ? items.filter((item) => item !== code) : [...items, code])

  const openInvoice = async (bill: Bill) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"
      const response = await fetch(`${apiBase}${bill.file_url}`, { headers: { Authorization: `Bearer ${getAuthToken(bill.file_url) || ""}` }, credentials: "include" })
      if (!response.ok) throw new Error("You cannot access this invoice file.")
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement("a"); link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err: any) { setError(err?.message || "Unable to open invoice.") }
  }

  const verify = async () => {
    if (!current) return
    setBusy(true); setError(""); setSuccess("")
    try {
      const data = await apiClient<{ success: boolean; message?: string }>(`/api/material-requests/${request.id}/purchase-bills/${current.id}/verify`, {
        method: "POST", body: JSON.stringify({ received_confirmed: received, acknowledged_discrepancies: acknowledged, inventory_item_id: inventoryId || undefined, mapping_reason: mappingReason || undefined }),
      })
      if (!data.success) throw new Error(data.message || "Inventory receipt was not finalized.")
      setSuccess(data.message || "Receipt committed to inventory."); await refresh(); onUpdated()
    } catch (err: any) { setError(err?.message || "Unable to verify this bill.") }
    finally { setBusy(false) }
  }

  const correction = async (action: "correction" | "reject") => {
    if (!current) return
    setBusy(true); setError(""); setSuccess("")
    try {
      await apiClient(`/api/material-requests/${request.id}/purchase-bills/${current.id}/correction`, { method: "POST", body: JSON.stringify({ action, reason }) })
      setSuccess(action === "reject" ? "Bill rejected. It remains unavailable as inventory." : "Correction requested. The employee can upload a replacement bill.")
      setReason(""); await refresh(); onUpdated()
    } catch (err: any) { setError(err?.message || "Unable to save this decision.") }
    finally { setBusy(false) }
  }

  return <>
    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>Review bill{request.status === "accepted" ? "s" : ""}</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Purchase bill review · MR-{request.id}</DialogTitle><DialogDescription>Review the invoice, AI findings, and stock receipt before changing available inventory.</DialogDescription></DialogHeader>
        <div className="rounded-lg border bg-muted/20 p-3 text-sm"><strong>{request.item_name}</strong> · Requested {request.quantity} {request.unit || ""}<div className="text-xs text-muted-foreground">Requested by {request.requested_by_name} · approved by {request.reviewed_by_name || "—"}{request.reviewed_at ? ` on ${new Date(request.reviewed_at).toLocaleString()}` : ""} · request status: {request.status}</div></div>
        {error && <p role="alert" className="rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
        {success && <p role="status" className="rounded bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p>}
        <div className="flex justify-end"><Button variant="outline" size="sm" onClick={refresh} disabled={loading}><RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh</Button></div>
        {loading ? <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> : bills.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No purchase bills uploaded yet.</p> : <div className="space-y-4">
          {current && <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" />{current.file_name} · version {current.version}<div className="text-xs font-normal text-muted-foreground">{current.draft_status.replaceAll("_", " ")} · {current.ai_status.replaceAll("_", " ")}</div></div>
              <Button variant="outline" size="sm" onClick={() => openInvoice(current)}>Open invoice</Button>
            </div>
            <dl className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs md:grid-cols-3">
              <div><dt className="text-muted-foreground">Supplier</dt><dd>{current.supplier_name || "Unknown"}</dd></div>
              <div><dt className="text-muted-foreground">Invoice</dt><dd>{current.invoice_number || "Unknown"}</dd></div>
              <div><dt className="text-muted-foreground">Date</dt><dd>{current.invoice_date ? new Date(current.invoice_date).toLocaleDateString() : "Unknown"}</dd></div>
              <div><dt className="text-muted-foreground">Purchased</dt><dd>{current.purchased_quantity ?? "Unknown"} {current.purchased_unit || ""}</dd></div>
              <div><dt className="text-muted-foreground">Invoice total</dt><dd>{current.currency || ""} {current.invoice_total ?? "Unknown"}</dd></div>
              <div><dt className="text-muted-foreground">GSTIN</dt><dd>{current.supplier_gstin || "Not provided"}</dd></div>
              {current.receipt_transaction_id && <div className="col-span-2 md:col-span-3"><dt className="text-muted-foreground">Stock receipt transaction</dt><dd className="break-all">{current.receipt_transaction_id}</dd></div>}
            </dl>
            <section className="space-y-2 rounded-lg border p-3"><h3 className="text-sm font-semibold">AI extracted fields</h3>
              <p className="text-[11px] text-muted-foreground">{current.extraction?.status?.replaceAll("_", " ") || "Analysis status unavailable"}{current.extraction?.reason ? ` · ${current.extraction.reason}` : ""}. AI analysis is preliminary, not proof of invoice authenticity.</p>
              {current.extraction?.fields ? <dl className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">{["materialName", "supplierName", "invoiceNumber", "invoiceDate", "quantity", "unit", "unitPrice", "subtotal", "tax", "total", "currency", "gstin"].map((key) => {
                const value = current.extraction.fields[key]
                if (value == null || value === "") return null
                const confidence = current.extraction.fields.fieldConfidence?.[key]
                return <div key={key}><dt className="text-muted-foreground">{key.replace(/[A-Z]/g, (letter: string) => ` ${letter}`).replace(/^./, (letter: string) => letter.toUpperCase())}</dt><dd>{String(value)}{Number.isFinite(Number(confidence)) ? ` · ${Math.round(Number(confidence) * 100)}% confidence` : ""}</dd></div>
              })}</dl> : <p className="text-xs text-muted-foreground">No structured AI extraction is available. Verify values against the uploaded invoice.</p>}
            </section>
            <section className="space-y-2 rounded-lg border p-3"><h3 className="text-sm font-semibold">AI findings and owner review</h3>
              {!findings.length && <p className="text-xs text-muted-foreground">No discrepancies recorded. AI checks are preliminary and do not prove invoice authenticity.</p>}
              {findings.map((item, index) => <div key={`${item.code}-${index}`} className={`rounded-md p-2 text-xs ${item.severity === "critical" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"}`}><strong className="uppercase">{item.severity}</strong>: {item.message}{item.severity === "warning" && <label className="mt-1 flex items-center gap-2"><input type="checkbox" checked={acknowledged.includes(item.code)} onChange={() => toggleAck(item.code)} /> I reviewed this warning</label>}
                {item.values?.candidates?.map((candidate) => <Button key={candidate.id} type="button" variant="link" className="ml-1 h-auto p-0 text-xs" onClick={() => setInventoryId(String(candidate.id))}>Select {candidate.name}{candidate.unit ? ` (${candidate.unit})` : ""}</Button>)}
              </div>)}
            </section>
            <section className="space-y-2 rounded-lg border p-3">
              <label className="flex items-start gap-2 text-xs"><input className="mt-0.5" type="checkbox" checked={received} onChange={(e) => setReceived(e.target.checked)} /> I confirm these materials were physically received and counted.</label>
              <div className="grid gap-2 md:grid-cols-2"><div className="space-y-1"><Label className="text-xs">Inventory item ID (optional; choose a match or leave blank to reuse/create by name)</Label><Input value={inventoryId} onChange={(e) => setInventoryId(e.target.value)} placeholder="Existing inventory item ID" className="h-8 text-xs" /></div><div className="space-y-1"><Label className="text-xs">Reason if mapping a differently named item</Label><Input value={mappingReason} onChange={(e) => setMappingReason(e.target.value)} className="h-8 text-xs" /></div></div>
              {current.draft_status === "awaiting_owner_verification" && <Button disabled={busy || !received || critical.length > 0} onClick={verify} className="w-full">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verify & Add to Inventory</Button>}
            </section>
            {current.draft_status === "awaiting_owner_verification" && <section className="space-y-2 rounded-lg border border-rose-200 p-3"><Label className="text-xs">Correction or rejection reason (required)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} minLength={8} maxLength={1000} placeholder="Describe what needs correction" className="h-8 text-xs" /><div className="flex gap-2"><Button variant="outline" disabled={busy || reason.trim().length < 8} onClick={() => correction("correction")}>Request Correction</Button><Button variant="destructive" disabled={busy || reason.trim().length < 8} onClick={() => correction("reject")}>Reject Bill</Button></div></section>}
          </>}
          {bills.length > 1 && <section><h3 className="mb-2 text-sm font-semibold">Previous uploads and decisions</h3><div className="space-y-1">{bills.filter((bill) => bill.id !== current?.id).map((bill) => <div key={bill.id} className="flex items-center justify-between rounded border p-2 text-xs"><span>Version {bill.version}: {bill.file_name} · {bill.draft_status.replaceAll("_", " ")}{bill.rejection_reason ? ` · ${bill.rejection_reason}` : ""}</span><Button variant="link" className="h-auto p-0 text-xs" onClick={() => openInvoice(bill)}>Open</Button></div>)}</div></section>}
        </div>}
      </DialogContent>
    </Dialog>
  </>
}
