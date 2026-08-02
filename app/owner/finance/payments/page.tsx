"use client"

import React, { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import {
  CreditCard, Plus, DollarSign, CheckCircle2, Calendar, User, FileText, Loader2, RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"

export default function OwnerPaymentsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<any[]>([])

  // Record Payment Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [invoicesList, setInvoicesList] = useState<any[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [transactionRef, setTransactionRef] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; payments: any[] }>("/api/finance/payments")
      if (res && res.success) {
        setPayments(res.payments || [])
      }
    } catch (err: any) {
      toast({ title: "Error loading payments", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = async () => {
    try {
      const res = await apiClient<{ success: boolean; invoices: any[] }>("/api/invoices?status=issued")
      if (res && res.success) {
        setInvoicesList(res.invoices || [])
      }
      setModalOpen(true)
    } catch (err: any) {
      toast({ title: "Failed to fetch unpaid invoices", description: err.message, variant: "destructive" })
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoiceId || !amount) {
      toast({ title: "Validation Error", description: "Please select an invoice and enter an amount", variant: "destructive" })
      return
    }

    try {
      setRecording(true)
      const res = await apiClient<{ success: boolean; message: string }>("/api/finance/payments", {
        method: "POST",
        body: JSON.stringify({
          invoice_id: selectedInvoiceId,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          transaction_reference: transactionRef,
          notes,
        }),
      })

      if (res && res.success) {
        toast({ title: "Payment Recorded", description: "Payment ledger and invoice status updated." })
        setModalOpen(false)
        setSelectedInvoiceId("")
        setAmount("")
        setTransactionRef("")
        setNotes("")
        fetchPayments()
      }
    } catch (err: any) {
      toast({ title: "Error recording payment", description: err.message, variant: "destructive" })
    } finally {
      setRecording(false)
    }
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" /> Payments & Accounts Receivable Ledger
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record incoming customer payments, track bank transaction references, and manage collection ledgers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading} className="h-9 text-xs font-bold rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Payments
            </Button>
            <Button size="sm" onClick={handleOpenModal} className="h-9 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Record New Payment
            </Button>
          </div>
        </div>

        {/* Payments Table */}
        <Card className="rounded-2xl border border-border/70 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs font-bold">No payments recorded in ledger yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b uppercase font-extrabold">
                    <tr>
                      <th className="p-3.5">Payment Date</th>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">Txn Reference</th>
                      <th className="p-3.5 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-mono text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td className="p-3.5 font-mono font-bold text-foreground">{p.invoice_number || "INV-MANUAL"}</td>
                        <td className="p-3.5 font-semibold text-foreground">{p.customer_name || "Client"}</td>
                        <td className="p-3.5 uppercase font-bold text-muted-foreground">{p.payment_method}</td>
                        <td className="p-3.5 font-mono text-muted-foreground">{p.transaction_reference || "—"}</td>
                        <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                          ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Dialog */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-lg">Record Customer Payment</DialogTitle>
              <DialogDescription className="text-xs">Select an issued invoice to log payment receipt into the financial ledger.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Select Issued Invoice</Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Choose an invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoicesList.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.customer_name} (₹{Number(inv.total_amount).toLocaleString("en-IN")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Amount Paid (₹)</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="h-9 text-xs rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI / GPay / PhonePe</SelectItem>
                      <SelectItem value="bank_transfer">NEFT / RTGS Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Credit / Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Transaction Ref / UTR / Cheque #</Label>
                <Input placeholder="e.g. UTR-982138912" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} className="h-9 text-xs rounded-xl font-mono" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Notes</Label>
                <Textarea placeholder="Payment notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="text-xs rounded-xl min-h-[60px]" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)} className="h-8 text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={recording} className="h-8 text-xs font-bold bg-amber-600 text-white px-4">
                  {recording ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Record Payment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
