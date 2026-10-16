"use client"

import { useCallback, useEffect, useState } from "react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, FileText, RefreshCw } from "lucide-react"

type Bill = {
  id: string
  file_name: string
  supplier_name?: string
  invoice_number?: string
  invoice_total?: number
  ai_status: string
  draft_status: string
  rejection_reason?: string
  discrepancies?: Array<{ code: string; severity: string; message: string }>
  file_url: string
  created_at: string
}

const statusLabel: Record<string, string> = {
  processing: "Processing",
  ai_verification_passed: "AI verification passed — owner review required",
  review_required: "Review required",
  ai_verification_failed: "AI verification failed — correction required",
  unable_to_analyse: "Unable to analyse — manual review required",
  verified: "Verified and received into inventory",
  correction_required: "Correction requested",
  rejected: "Rejected",
  superseded: "Replaced by a newer upload",
  awaiting_owner_verification: "Draft — awaiting owner verification",
}

export function MaterialPurchaseBillPanel({ requestId, requestStatus }: { requestId: number; requestStatus: string }) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiClient<{ bills: Bill[] }>(`/api/material-requests/${requestId}/purchase-bills`, { signal: AbortSignal.timeout(20000) })
      setBills(Array.isArray(result.bills) ? result.bills : [])
    } catch (err: any) {
      setError(err?.message || "Unable to load purchase bill history.")
    } finally { setLoading(false) }
  }, [requestId])

  useEffect(() => { refresh() }, [refresh])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")
    const form = event.currentTarget
    const data = new FormData(form)
    const file = data.get("invoice")
    if (!(file instanceof File) || !file.size) { setError("Choose a PDF, JPG, JPEG or PNG invoice."); return }
    if (file.size > 10 * 1024 * 1024) { setError("Invoice must be 10 MB or smaller."); return }
    setUploading(true)
    try {
      const result = await apiClient<{ success: boolean; ai_status?: string; message?: string }>(`/api/material-requests/${requestId}/purchase-bills`, { method: "POST", body: data })
      if (!result?.success) throw new Error(result?.message || "The invoice was not saved.")
      setMessage(result.message || (result.ai_status === "processing" ? "Invoice saved; analysis is processing." : "Invoice saved securely as a draft for owner review."))
      form.reset()
      await refresh()
    } catch (err: any) {
      setError(err?.message || "Invoice upload failed. Check your connection and try again.")
      await refresh()
    } finally { setUploading(false) }
  }

  const openInvoice = async (bill: Bill) => {
    setError("")
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"
      const { getAuthToken } = await import("@/lib/apiClient")
      const response = await fetch(`${apiBase}${bill.file_url}`, { headers: { Authorization: `Bearer ${getAuthToken(bill.file_url) || ""}` }, credentials: "include" })
      if (!response.ok) throw new Error("Invoice preview is not available for this account.")
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = url
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err: any) { setError(err?.message || "Could not open invoice.") }
  }

  return <section className="mt-3 space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3" aria-label="Purchase bill workflow">
    <div className="flex items-center justify-between gap-2">
      <div><h4 className="text-xs font-bold">Purchase bill & inventory draft</h4><p className="text-[11px] text-muted-foreground">Invoices stay out of available stock until an owner confirms receipt.</p></div>
      <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={refresh} disabled={loading}><RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
    </div>
    {error && <p role="alert" className="rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
    {message && <p role="status" className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">{message}</p>}
    {requestStatus === "accepted" && <form onSubmit={submit} className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <div className="space-y-1"><Label className="text-[11px]">Invoice file (PDF/JPG/PNG, max 10 MB)</Label><Input name="invoice" type="file" accept="application/pdf,image/jpeg,image/png" required disabled={uploading} className="h-9 text-xs" /></div>
      <div className="space-y-1"><Label className="text-[11px]">Supplier name</Label><Input name="supplier_name" required disabled={uploading} placeholder="Supplier / vendor" className="h-9 text-xs" /></div>
      <div className="space-y-1"><Label className="text-[11px]">Invoice number</Label><Input name="invoice_number" required disabled={uploading} placeholder="Invoice number" className="h-9 text-xs" /></div>
      <div className="space-y-1"><Label className="text-[11px]">Invoice date</Label><Input name="invoice_date" type="date" required disabled={uploading} className="h-9 text-xs" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-[11px]">Purchased quantity</Label><Input name="purchased_quantity" type="number" min="0.001" step="any" required disabled={uploading} className="h-9 text-xs" /></div>
        <div className="space-y-1"><Label className="text-[11px]">Unit</Label><Input name="purchased_unit" required disabled={uploading} placeholder="pieces, kg..." className="h-9 text-xs" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-[11px]">Invoice total</Label><Input name="invoice_total" type="number" min="0" step="0.01" required disabled={uploading} className="h-9 text-xs" /></div>
        <div className="space-y-1"><Label className="text-[11px]">Currency</Label><Input name="currency" defaultValue="INR" disabled={uploading} className="h-9 text-xs" /></div>
      </div>
      <div className="space-y-1"><Label className="text-[11px]">Unit price (optional)</Label><Input name="unit_price" type="number" min="0" step="0.01" disabled={uploading} className="h-9 text-xs" /></div>
      <div className="space-y-1"><Label className="text-[11px]">Tax (optional)</Label><Input name="tax_amount" type="number" min="0" step="0.01" disabled={uploading} className="h-9 text-xs" /></div>
      <div className="space-y-1"><Label className="text-[11px]">Supplier GSTIN (optional)</Label><Input name="supplier_gstin" disabled={uploading} className="h-9 text-xs" /></div>
      <div className="space-y-1"><Label className="text-[11px]">Notes (optional)</Label><Input name="notes" maxLength={1000} disabled={uploading} className="h-9 text-xs" /></div>
      <div className="md:col-span-2"><Button type="submit" size="sm" disabled={uploading} className="h-8 text-xs">{uploading ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Uploading & analysing…</> : <><Upload className="mr-1 h-3 w-3" /> Upload purchase bill</>}</Button></div>
    </form>}
    {bills.length > 0 ? <div className="space-y-2">{bills.map((bill) => <article key={bill.id} className="rounded-lg border bg-background p-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 font-semibold"><FileText className="h-3.5 w-3.5" />{bill.file_name}</div><Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => openInvoice(bill)}>Open invoice</Button></div>
      <p className="mt-1 text-muted-foreground">{statusLabel[bill.draft_status] || statusLabel[bill.ai_status] || bill.ai_status} · {new Date(bill.created_at).toLocaleString()}</p>
      {bill.rejection_reason && <p className="mt-1 text-rose-700">Owner note: {bill.rejection_reason}</p>}
      {!!bill.discrepancies?.length && <ul className="mt-1 list-inside list-disc text-amber-700">{bill.discrepancies.map((finding, index) => <li key={`${finding.code}-${index}`}>{finding.message}</li>)}</ul>}
    </article>)}</div> : <p className="text-[11px] text-muted-foreground">{loading ? "Loading bill history…" : "No purchase bill uploaded yet."}</p>}
  </section>
}
