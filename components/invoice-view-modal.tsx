"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"
import {
  Printer,
  Download,
  CreditCard,
  MessageSquare,
  Mail,
  Edit,
  Loader2,
  CheckCircle2,
  Building,
  QrCode,
  FileText,
  AlertCircle
} from "lucide-react"

interface InvoiceViewModalProps {
  invoiceId: string | null
  isOpen: boolean
  onClose: () => void
  onPaymentRecorded?: () => void
  onOpenPayment?: (invoice: any) => void
}

export function InvoiceViewModal({
  invoiceId,
  isOpen,
  onClose,
  onPaymentRecorded,
  onOpenPayment,
}: InvoiceViewModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    invoice: any
    company: any
    lineItems: any[]
    payments: any[]
  } | null>(null)

  const printIframeRef = useRef<HTMLIFrameElement | null>(null)

  const fetchInvoiceDetails = React.useCallback(async (id: string) => {
    try {
      setLoading(true)
      const res = await apiClient<{
        success: boolean
        invoice: any
        company: any
        lineItems: any[]
        payments: any[]
      }>(`/api/invoices/${id}`)
      if (res && res.success) {
        setData({
          invoice: res.invoice,
          company: res.company || {},
          lineItems: res.lineItems || [],
          payments: res.payments || [],
        })
      }
    } catch (err: any) {
      toast({
        title: "Error Loading Invoice",
        description: err.message || "Failed to retrieve invoice details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchInvoiceDetails(invoiceId)
    } else {
      setData(null)
    }
  }, [isOpen, invoiceId, fetchInvoiceDetails])

  const handlePrint = () => {
    if (!data) return

    const { invoice, company, lineItems } = data
    const formattedDate = new Date(invoice.created_at || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    const formattedDueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "On Receipt"

    const companyName = company.legal_name || company.name || "BUSINESS ENTERPRISE"
    const companyAddress = company.address
      ? `${company.address}${company.city ? ", " + company.city : ""}${
          company.state ? ", " + company.state : ""
        } ${company.pincode || ""}`
      : ""

    const upiQrUrl = company.upi_id
      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
          `upi://pay?pa=${company.upi_id}&pn=${companyName}&am=${invoice.total_amount}&cu=INR`
        )}`
      : null

    const itemsRows = lineItems
      .map(
        (item: any, idx: number) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 12px; color: #334155; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; font-size: 12px; color: #0f172a; font-weight: 600;">
          ${item.description || "Service"}
          <div style="font-size: 11px; color: #64748b; font-weight: 400; margin-top: 2px;">HSN/SAC: ${
            item.hsn_code || "998311"
          }</div>
        </td>
        <td style="padding: 10px; font-size: 12px; color: #334155; text-align: center;">${
          item.quantity || 1
        }</td>
        <td style="padding: 10px; font-size: 12px; color: #334155; text-align: right;">₹${Number(
          item.unit_price || 0
        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; font-size: 12px; color: #0f172a; font-weight: 700; text-align: right;">₹${Number(
          item.total_amount || 0
        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join("")

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${invoice.invoice_number}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; line-height: 1.5; }
          .card { max-width: 820px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 28px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f8fafc; padding: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div style="font-size: 22px; font-weight: 900; color: #1e293b;">${companyName}</div>
              <div style="font-size: 11px; color: #475569;">${companyAddress}</div>
              ${company.gstin ? `<div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 4px;">GSTIN: ${company.gstin}</div>` : ""}
              ${company.phone ? `<div style="font-size: 11px; color: #64748b;">Phone: ${company.phone}</div>` : ""}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: 900; color: #2563eb;">TAX INVOICE</div>
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${invoice.invoice_number}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Date: ${formattedDate}</div>
              <div style="font-size: 11px; color: #64748b;">Due: ${formattedDueDate}</div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${invoice.status === "paid" ? "#16a34a" : "#ca8a04"};">
                Status: ${invoice.status || "Issued"}
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 14px; border-radius: 6px; margin-bottom: 20px;">
            <div>
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Billed To</div>
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${invoice.customer_name || "Customer"}</div>
              ${invoice.customer_address ? `<div style="font-size: 11px; color: #475569;">${invoice.customer_address}</div>` : ""}
              ${invoice.customer_gstin ? `<div style="font-size: 11px; font-weight: 700; color: #0f172a;">GSTIN: ${invoice.customer_gstin}</div>` : ""}
              ${invoice.customer_phone ? `<div style="font-size: 11px; color: #64748b;">Phone: ${invoice.customer_phone}</div>` : ""}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Payment Terms</div>
              <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-top: 2px;">${invoice.payment_terms || "Due on Receipt"}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">#</th>
                <th style="text-align: left;">Item & Description</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 100px;">Rate</th>
                <th style="text-align: right; width: 110px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <div style="width: 50%;">
              ${company.bank_name ? `
                <div style="font-size: 11px; color: #475569;">
                  <strong>Bank Transfer Details:</strong><br/>
                  Bank: ${company.bank_name}<br/>
                  A/C No: ${company.account_number || "N/A"}<br/>
                  IFSC: ${company.ifsc_code || "N/A"}
                </div>
              ` : ""}
            </div>
            <div style="width: 45%;">
              <table style="width: 100%; font-size: 12px;">
                <tr><td style="padding: 3px 0; color: #64748b;">Subtotal:</td><td style="text-align: right; font-weight: 600;">₹${Number(invoice.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                ${invoice.discount_amount > 0 ? `<tr><td style="padding: 3px 0; color: #16a34a;">Discount:</td><td style="text-align: right; color: #16a34a; font-weight: 600;">-₹${Number(invoice.discount_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>` : ""}
                ${invoice.is_inter_state ? `
                  <tr><td style="padding: 3px 0; color: #64748b;">IGST (${invoice.gst_rate || 18}%):</td><td style="text-align: right; font-weight: 600;">₹${Number(invoice.igst || invoice.total_tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                ` : `
                  <tr><td style="padding: 3px 0; color: #64748b;">CGST (${(invoice.gst_rate || 18)/2}%):</td><td style="text-align: right; font-weight: 600;">₹${Number(invoice.cgst || (invoice.total_tax / 2) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="padding: 3px 0; color: #64748b;">SGST (${(invoice.gst_rate || 18)/2}%):</td><td style="text-align: right; font-weight: 600;">₹${Number(invoice.sgst || (invoice.total_tax / 2) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                `}
                <tr style="border-top: 2px solid #0f172a;"><td style="padding: 8px 0; font-size: 14px; font-weight: 800;">Grand Total:</td><td style="text-align: right; font-size: 16px; font-weight: 900; color: #2563eb;">₹${Number(invoice.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Amount Paid:</td><td style="text-align: right; font-weight: 700; color: #16a34a;">₹${Number(invoice.amount_paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
                <tr><td style="padding: 4px 0; font-weight: 800; color: #0f172a;">Balance Due:</td><td style="text-align: right; font-weight: 800; color: ${invoice.amount_due > 0 ? "#dc2626" : "#16a34a"};">₹${Number(invoice.amount_due || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
              </table>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Print seamlessly inside hidden iframe
    let iframe = printIframeRef.current
    if (!iframe) {
      iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "none"
      document.body.appendChild(iframe)
      printIframeRef.current = iframe
    }

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(printHtml)
      doc.close()
      setTimeout(() => {
        iframe?.contentWindow?.focus()
        iframe?.contentWindow?.print()
      }, 300)
    }
  }

  const handleDownloadHtml = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Invoice-${data.invoice.invoice_number}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleWhatsApp = () => {
    if (!data?.invoice?.customer_phone) {
      toast({
        title: "No Phone Number",
        description: "Customer does not have a phone number on record",
        variant: "destructive",
      })
      return
    }
    const cleanPhone = data.invoice.customer_phone.replace(/[^0-9]/g, "")
    const msg = encodeURIComponent(
      `Hello ${data.invoice.customer_name},\nHere is your Tax Invoice ${data.invoice.invoice_number} for ₹${data.invoice.total_amount}. Balance Due: ₹${data.invoice.amount_due}.\nThank you!`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank")
  }

  const invoice = data?.invoice
  const company = data?.company || {}
  const lineItems = data?.lineItems || []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <DialogTitle className="text-xl font-bold">
                Tax Invoice <span className="font-mono text-indigo-600">#{invoice?.invoice_number || "..."}</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Tax invoice view and payment record
              </DialogDescription>
            </div>
            {invoice && (
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    invoice.status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : invoice.status === "disputed"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  {invoice.status?.toUpperCase() || "ISSUED"}
                </Badge>
                {invoice.invoice_type && (
                  <Badge variant="outline" className="text-xs uppercase font-semibold">
                    {invoice.invoice_type.replace("_", " ")}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-muted-foreground font-medium">Loading official invoice details...</p>
          </div>
        ) : !invoice ? (
          <div className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="font-semibold">Invoice could not be found or loaded.</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Header: Company Profile vs Billed To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm">
              <div className="space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-indigo-500" /> Issuer
                </div>
                <div className="font-extrabold text-base text-foreground">
                  {company.legal_name || company.name || "Business Enterprise"}
                </div>
                {company.address && (
                  <div className="text-xs text-muted-foreground">
                    {company.address}, {company.city} {company.state} {company.pincode}
                  </div>
                )}
                {company.gstin && (
                  <div className="text-xs font-semibold text-foreground pt-1">
                    GSTIN: <span className="font-mono text-indigo-600 dark:text-indigo-400">{company.gstin}</span>
                  </div>
                )}
                {company.phone && <div className="text-xs text-muted-foreground">Phone: {company.phone}</div>}
              </div>

              <div className="space-y-1 md:text-right">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billed To</div>
                <div className="font-extrabold text-base text-foreground">
                  {invoice.customer_name || "Direct Customer"}
                </div>
                {invoice.customer_address && (
                  <div className="text-xs text-muted-foreground">{invoice.customer_address}</div>
                )}
                {invoice.customer_gstin && (
                  <div className="text-xs font-semibold text-foreground pt-1">
                    Customer GSTIN: <span className="font-mono text-indigo-600">{invoice.customer_gstin}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {invoice.customer_phone || invoice.customer_email || "Walk-in Client"}
                </div>
                <div className="text-xs text-muted-foreground pt-1">
                  Issued:{" "}
                  <span className="font-semibold text-foreground">
                    {new Date(invoice.created_at).toLocaleDateString("en-IN")}
                  </span>{" "}
                  | Due:{" "}
                  <span className="font-semibold text-foreground">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-IN") : "On Receipt"}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-bold uppercase border-b">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Description & HSN</th>
                    <th className="p-3 w-16 text-center">Qty</th>
                    <th className="p-3 w-28 text-right">Rate</th>
                    <th className="p-3 w-28 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 text-center text-muted-foreground">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{item.description}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          HSN/SAC: {item.hsn_code || "998311"} | Type: {item.item_type || "service"}
                        </div>
                      </td>
                      <td className="p-3 text-center font-medium">{item.quantity}</td>
                      <td className="p-3 text-right font-medium">
                        ₹{Number(item.unit_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        ₹{Number(item.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        No line items recorded on this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Bank Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Payment Details & UPI QR */}
              <div className="space-y-3 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-indigo-500" /> Payment & Settlement
                </div>
                {company.bank_name ? (
                  <div className="space-y-1 text-muted-foreground">
                    <div>
                      Bank: <strong className="text-foreground">{company.bank_name}</strong>
                    </div>
                    <div>
                      Account Number: <strong className="text-foreground font-mono">{company.account_number}</strong>
                    </div>
                    <div>
                      IFSC Code: <strong className="text-foreground font-mono">{company.ifsc_code}</strong>
                    </div>
                    {company.upi_id && (
                      <div>
                        UPI ID: <strong className="text-foreground font-mono">{company.upi_id}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Standard cash or POS terminal settlement accepted.</p>
                )}
                {invoice.payment_terms && (
                  <div className="pt-2 border-t text-[11px] text-muted-foreground">
                    Terms: <strong className="text-foreground">{invoice.payment_terms}</strong>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="space-y-2 text-xs p-4 rounded-xl border bg-slate-50 dark:bg-slate-900">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">
                    ₹{Number(invoice.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {Number(invoice.discount_amount || 0) > 0 && (
                  <div className="flex justify-between py-1 text-emerald-600 font-medium">
                    <span>Discount:</span>
                    <span>
                      -₹{Number(invoice.discount_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {invoice.is_inter_state ? (
                  <div className="flex justify-between py-1 text-muted-foreground">
                    <span>IGST ({invoice.gst_rate || 18}%):</span>
                    <span className="font-semibold text-foreground">
                      ₹{Number(invoice.igst || invoice.total_tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-1 text-muted-foreground">
                      <span>CGST ({(invoice.gst_rate || 18) / 2}%):</span>
                      <span className="font-semibold text-foreground">
                        ₹{Number(invoice.cgst || (invoice.total_tax / 2) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-muted-foreground">
                      <span>SGST ({(invoice.gst_rate || 18) / 2}%):</span>
                      <span className="font-semibold text-foreground">
                        ₹{Number(invoice.sgst || (invoice.total_tax / 2) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-2 border-t border-b text-sm font-extrabold text-foreground">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-base font-black">
                    ₹{Number(invoice.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-emerald-600 font-bold">
                  <span>Amount Paid:</span>
                  <span>
                    ₹{Number(invoice.amount_paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-rose-600 font-extrabold text-sm">
                  <span>Balance Due:</span>
                  <span>
                    ₹{Number(invoice.amount_due || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!data} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print Invoice
            </Button>
            {invoice?.customer_phone && (
              <Button variant="outline" size="sm" onClick={handleWhatsApp} className="text-emerald-700 gap-1.5">
                <MessageSquare className="h-4 w-4" /> WhatsApp
              </Button>
            )}
            {invoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  router.push(`/owner/jobs/${invoice.job_id || invoice.id}/invoice-editor`)
                }}
                className="gap-1.5 text-indigo-700"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Invoice
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {invoice && Number(invoice.amount_due || 0) > 0 && onOpenPayment && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                onClick={() => {
                  onClose()
                  onOpenPayment(invoice)
                }}
              >
                <CreditCard className="h-4 w-4" /> Record Payment
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
