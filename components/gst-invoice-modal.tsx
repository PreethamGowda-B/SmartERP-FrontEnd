"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer, Download, Receipt, Sparkles, Loader2 } from "lucide-react"

interface GSTInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  customerName?: string
}

export function GSTInvoiceModal({ isOpen, onClose, customerName = "Acme Construction Corp" }: GSTInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>({
    invoiceNumber: `GST-INV-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString().split("T")[0],
    customerName,
    customerGstin: "27AAAAA0000A1Z5",
    lineItems: [
      { description: "Site Construction & Electrical Wiring", hsnCode: "998311", qty: 1, rate: 45000, total: 45000 },
      { description: "Material Supply & Safety Audit", hsnCode: "998312", qty: 2, rate: 12500, total: 25000 },
    ],
    cgst: 6300,
    sgst: 6300,
    igst: 0,
    subtotal: 70000,
    totalTax: 12600,
    grandTotal: 82600,
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border-primary/20 p-6 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black text-primary flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              <span>Tax Invoice (GST Compliant)</span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} className="text-xs gap-1.5">
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs">
            Official GST invoice issued under GST Rule 46.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-xs pt-2">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-xl border">
            <div>
              <p className="font-extrabold text-foreground text-sm">SmartERP Solutions</p>
              <p className="text-muted-foreground">GSTIN: 27AABCS1429B1Z2</p>
              <p className="text-muted-foreground">State Code: 27 (Maharashtra)</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">Invoice #: {invoiceData.invoiceNumber}</p>
              <p className="text-muted-foreground">Date: {invoiceData.date}</p>
              <p className="text-muted-foreground">Customer: {invoiceData.customerName}</p>
              <p className="text-muted-foreground">Customer GSTIN: {invoiceData.customerGstin}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3">HSN/SAC</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Rate (₹)</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoiceData.lineItems.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{item.description}</td>
                    <td className="p-3 text-muted-foreground font-mono">{item.hsnCode}</td>
                    <td className="p-3 text-center font-bold">{item.qty}</td>
                    <td className="p-3 text-right">{item.rate.toLocaleString()}</td>
                    <td className="p-3 text-right font-extrabold">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Calculation Breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 p-4 bg-muted/30 rounded-xl border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-bold text-foreground">₹{invoiceData.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>CGST (9%)</span>
                <span>₹{invoiceData.cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST (9%)</span>
                <span>₹{invoiceData.sgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t">
                <span className="font-bold">Total GST (18%)</span>
                <span className="font-bold text-primary">₹{invoiceData.totalTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t">
                <span>Grand Total</span>
                <span className="text-primary">₹{invoiceData.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
