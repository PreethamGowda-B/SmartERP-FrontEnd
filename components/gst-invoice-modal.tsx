"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Receipt } from "lucide-react"

interface GSTInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  customerName?: string
}

/**
 * This legacy preview has no persisted invoice identifier or server-backed line
 * items. Keep it from presenting demo values as an official tax invoice.
 */
export function GSTInvoiceModal({ isOpen, onClose }: GSTInvoiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Tax invoice preview unavailable
          </DialogTitle>
          <DialogDescription>
            This preview is not connected to a saved invoice, so it cannot display or print official invoice details.
            Create or open the persisted invoice from Invoices &amp; Billing.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
