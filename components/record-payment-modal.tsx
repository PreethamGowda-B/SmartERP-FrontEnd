"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import { Loader2, CheckCircle2, IndianRupee, CreditCard, Banknote, QrCode, Building, Receipt } from "lucide-react"

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: any | null
  onPaymentRecorded: () => void
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [transactionRef, setTransactionRef] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Set default amount to due amount when modal opens
  React.useEffect(() => {
    if (invoice) {
      const due = Number(invoice.amount_due ?? (Number(invoice.total_amount || 0) - Number(invoice.amount_paid || 0)))
      setAmount(due > 0 ? due.toFixed(2) : Number(invoice.total_amount || 0).toFixed(2))
      setTransactionRef("")
      setNotes("")
    }
  }, [invoice])

  if (!invoice) return null

  const totalAmount = Number(invoice.total_amount || 0)
  const amountPaid = Number(invoice.amount_paid || 0)
  const amountDue = Number(invoice.amount_due ?? (totalAmount - amountPaid))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payAmount = parseFloat(amount)

    if (isNaN(payAmount) || payAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount greater than zero.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const res = await apiClient<{ success: boolean }>(`/api/invoices/${invoice.id}/record-payment`, {
        method: "POST",
        body: JSON.stringify({
          paymentMethod,
          amount: payAmount,
          transactionReference: transactionRef || `COUNTER_${paymentMethod.toUpperCase()}`,
          notes,
        }),
      })

      if (res && res.success) {
        toast({
          title: "Payment Recorded Successfully",
          description: `Received ₹${payAmount.toLocaleString("en-IN")} via ${paymentMethod.toUpperCase()}.`,
        })
        onPaymentRecorded()
        onClose()
      }
    } catch (err: any) {
      toast({
        title: "Payment Recording Failed",
        description: err.message || "Failed to record payment.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full rounded-2xl p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Record Counter Payment
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Log immediate counter, cash, UPI QR, or bank payment for Invoice{" "}
            <span className="font-mono font-bold text-foreground">{invoice.invoice_number}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary Pill */}
        <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 space-y-1.5 my-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-bold text-foreground">{invoice.customer_name || "Walk-in Customer"}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Total Invoiced:</span>
            <span className="font-semibold text-foreground">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Already Paid:</span>
            <span className="font-semibold text-emerald-600">₹{amountPaid.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-border/40 font-bold">
            <span className="text-foreground">Balance Due:</span>
            <span className="text-rose-600">₹{amountDue.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-base font-bold text-foreground"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Mode / Channel</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="text-xs rounded-xl">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Cash (Office Counter)</SelectItem>
                <SelectItem value="upi">📱 UPI QR Code / PhonePe / GPay</SelectItem>
                <SelectItem value="card">💳 POS Debit / Credit Card</SelectItem>
                <SelectItem value="bank_transfer">🏦 Direct Bank Transfer</SelectItem>
                <SelectItem value="cheque">📝 Cheque / Demand Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Transaction Reference / UTR # (Optional)</Label>
            <Input
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UPI Ref / Cheque No / Card Auth"
              className="text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Internal Receipt Note (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received by front desk supervisor"
              rows={2}
              className="text-xs rounded-xl resize-none"
            />
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Receipt (₹{parseFloat(amount || "0").toLocaleString("en-IN")})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
