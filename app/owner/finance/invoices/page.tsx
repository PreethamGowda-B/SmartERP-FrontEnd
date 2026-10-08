"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import {
  FileText, Download, Send, Eye, MessageSquare, Mail, CheckCircle2, Clock,
  AlertTriangle, Search, Filter, Loader2, Plus, Zap, Printer, CreditCard,
  Banknote, Receipt, ArrowRight, UserPlus, Sparkles, IndianRupee
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"
import { DirectInvoiceModal } from "@/components/direct-invoice-modal"
import { RecordPaymentModal } from "@/components/record-payment-modal"
import { InvoiceViewModal } from "@/components/invoice-view-modal"
import { cn } from "@/lib/utils"

export default function OwnerInvoicesListPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals state
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null)
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null)

  const fetchInvoices = React.useCallback(async () => {
    try {
      setLoading(true)
      const url = statusFilter === "all" ? "/api/invoices" : `/api/invoices?status=${statusFilter}`
      const res = await apiClient<{ success: boolean; invoices: any[] }>(url)
      if (res && res.success) {
        setInvoices(res.invoices || [])
      }
    } catch (err: any) {
      toast({
        title: "Error loading invoices",
        description: err.message || "Could not fetch invoices list",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleSendWhatsApp = async (inv: any) => {
    try {
      await apiClient(`/api/invoices/${inv.id}/send-whatsapp`, {
        method: "POST",
        body: JSON.stringify({ phone: inv.customer_phone }),
      })
      toast({ title: "WhatsApp Dispatched", description: `Invoice link sent via WhatsApp to ${inv.customer_name || 'client'}.` })
    } catch (err: any) {
      toast({ title: "WhatsApp Failed", description: err.message, variant: "destructive" })
    }
  }

  const handleSendEmail = async (inv: any) => {
    try {
      await apiClient(`/api/invoices/${inv.id}/send-email`, {
        method: "POST",
        body: JSON.stringify({ email: inv.customer_email }),
      })
      toast({ title: "Email Dispatched", description: `Invoice PDF emailed to ${inv.customer_email || 'client'}.` })
    } catch (err: any) {
      toast({ title: "Email Failed", description: err.message, variant: "destructive" })
    }
  }

  const handleDirectPrint = (invId: string) => {
    setViewingInvoiceId(invId)
  }

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase()
    return (
      (inv.invoice_number || "").toLowerCase().includes(query) ||
      (inv.customer_name || "").toLowerCase().includes(query) ||
      (inv.job_title || "").toLowerCase().includes(query)
    )
  })

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Invoices & Billing Command Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct counter walk-ins, service jobs billing, payment recording, and instant tax invoice dispatch.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-xl text-xs font-bold gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4" /> Create Invoice
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl">
                <DropdownMenuItem
                  onClick={() => setIsDirectModalOpen(true)}
                  className="rounded-xl py-2.5 px-3 cursor-pointer text-xs font-bold flex items-center gap-2.5 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-extrabold">Direct / Walk-in</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Counter sales & walk-in clients</div>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/owner/jobs")}
                  className="rounded-xl py-2.5 px-3 cursor-pointer text-xs font-bold flex items-center gap-2.5 text-foreground hover:bg-primary/10 hover:text-primary transition-colors mt-1"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-extrabold">From Service Job</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Bill completed engineer job</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search invoice #, customer, or job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="issued">Issued / Unpaid</SelectItem>
              <SelectItem value="paid">Paid in Full</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices List Table */}
        <Card className="rounded-2xl border border-border/70 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-foreground">No invoices found</div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create your first invoice for a walk-in counter customer or select a completed service job.
                </p>
                <Button
                  onClick={() => setIsDirectModalOpen(true)}
                  size="sm"
                  className="rounded-xl text-xs font-bold gap-1.5 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> New Walk-in Invoice
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b uppercase font-extrabold">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5 text-right">Subtotal</th>
                      <th className="p-3.5 text-right">GST</th>
                      <th className="p-3.5 text-right">Total Amount</th>
                      <th className="p-3.5 text-center">Payment Status</th>
                      <th className="p-3.5 text-right">Actions & Dispatch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredInvoices.map((inv) => {
                      const isPaid = inv.status === "paid"
                      const isWalkIn = inv.invoice_type === "walk_in" || !inv.job_id
                      const amountDue = Number(inv.amount_due ?? (Number(inv.total_amount || 0) - Number(inv.amount_paid || 0)))

                      return (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-foreground block">{inv.invoice_number}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(inv.created_at).toLocaleDateString("en-IN")}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5",
                                isWalkIn
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                                  : "border-indigo-500/40 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20"
                              )}
                            >
                              {isWalkIn ? "Walk-in" : "Job"}
                            </Badge>
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-foreground">{inv.customer_name || "Client"}</div>
                            {inv.customer_phone && (
                              <div className="text-[10px] text-muted-foreground">{inv.customer_phone}</div>
                            )}
                          </td>

                          <td className="p-3.5 text-right text-muted-foreground">
                            ₹{Number(inv.subtotal || 0).toLocaleString("en-IN")}
                          </td>

                          <td className="p-3.5 text-right text-muted-foreground">
                            ₹{Number(inv.total_tax || (Number(inv.cgst || 0) + Number(inv.sgst || 0) + Number(inv.igst || 0))).toLocaleString("en-IN")}
                          </td>

                          <td className="p-3.5 text-right font-black text-foreground">
                            ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
                          </td>

                          <td className="p-3.5 text-center">
                            <Badge
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5",
                                isPaid
                                  ? "bg-emerald-600 text-white"
                                  : inv.status === "partially_paid"
                                  ? "bg-amber-600 text-white"
                                  : inv.status === "disputed"
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-700 text-white"
                              )}
                            >
                              {inv.status}
                            </Badge>
                            {!isPaid && amountDue > 0 && (
                              <div className="text-[10px] text-rose-500 font-semibold mt-0.5">
                                Due: ₹{amountDue.toLocaleString("en-IN")}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            {/* Record Payment Button if Unpaid */}
                            {!isPaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] font-bold rounded-lg border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 mr-1"
                                onClick={() => setPaymentInvoice(inv)}
                              >
                                <IndianRupee className="w-3 h-3 mr-0.5" /> Record Pay
                              </Button>
                            )}

                            {/* Direct Print Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Print Invoice"
                              onClick={() => handleDirectPrint(inv.id)}
                            >
                              <Printer className="h-3.5 w-3.5 text-foreground" />
                            </Button>

                            {/* View Invoice Modal Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="View Invoice"
                              onClick={() => setViewingInvoiceId(inv.id)}
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>

                            {/* WhatsApp Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Send WhatsApp"
                              onClick={() => handleSendWhatsApp(inv)}
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>

                            {/* Email Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Send Email"
                              onClick={() => handleSendEmail(inv)}
                            >
                              <Mail className="h-3.5 w-3.5 text-indigo-600" />
                            </Button>

                            {/* Edit Invoice */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] font-bold rounded-lg ml-1"
                              onClick={() => router.push(`/owner/jobs/${inv.job_id || inv.id}/invoice-editor`)}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Direct / Walk-in Invoice Generator Modal */}
      <DirectInvoiceModal
        isOpen={isDirectModalOpen}
        onClose={() => setIsDirectModalOpen(false)}
        onInvoiceCreated={() => fetchInvoices()}
      />

      {/* Record Counter Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(paymentInvoice)}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onPaymentRecorded={() => fetchInvoices()}
      />

      {/* In-Tab Official Invoice View & Print Modal */}
      <InvoiceViewModal
        isOpen={Boolean(viewingInvoiceId)}
        invoiceId={viewingInvoiceId}
        onClose={() => setViewingInvoiceId(null)}
        onPaymentRecorded={() => fetchInvoices()}
        onOpenPayment={(inv) => setPaymentInvoice(inv)}
      />
    </OwnerLayout>
  )
}
