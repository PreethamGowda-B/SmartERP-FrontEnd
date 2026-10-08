"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import {
  FileText, Plus, Trash2, CheckCircle2, Loader2, IndianRupee,
  User, Building2, Eye, Printer, Download, MessageSquare, Mail,
  Sparkles, QrCode, CreditCard, Banknote, HelpCircle, ArrowRight
} from "lucide-react"

interface DirectInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onInvoiceCreated: (invoice: any) => void
}

interface LineItem {
  id: string
  item_type: "service" | "material"
  description: string
  hsn_code: string
  quantity: number
  unit_price: number
  inventory_item_id?: number | null
}

export function DirectInvoiceModal({
  isOpen,
  onClose,
  onInvoiceCreated,
}: DirectInvoiceModalProps) {
  const { toast } = useToast()

  // Steps: 'form' | 'preview' | 'success'
  const [step, setStep] = useState<"form" | "preview" | "success">("form")
  const [submitting, setSubmitting] = useState(false)

  // Customer State
  const [customerMode, setCustomerMode] = useState<"quick_add" | "existing">("quick_add")
  const [existingCustomers, setExistingCustomers] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [loadingLookups, setLoadingLookups] = useState(false)

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [customerEmail, setCustomerEmail] = useState<string>("")
  const [customerAddress, setCustomerAddress] = useState<string>("")
  const [customerGstin, setCustomerGstin] = useState<string>("")

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      item_type: "service",
      description: "Counter Service / Labor Charges",
      hsn_code: "998311",
      quantity: 1,
      unit_price: 1500,
    },
  ])

  // Financial adjustments
  const [transportCharges, setTransportCharges] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [gstRate, setGstRate] = useState<number>(18)
  const [isInterState, setIsInterState] = useState<boolean>(false)
  const [customerNotes, setCustomerNotes] = useState<string>("Thank you for choosing our services!")

  // Payment at Counter
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [transactionRef, setTransactionRef] = useState<string>("")
  const [dueDays, setDueDays] = useState<number>(15)

  // Success State result
  const [createdInvoiceResult, setCreatedInvoiceResult] = useState<any | null>(null)

  // Load existing customers and inventory items when opened
  useEffect(() => {
    if (isOpen) {
      setStep("form")
      setCreatedInvoiceResult(null)
      fetchLookups()
    }
  }, [isOpen])

  const fetchLookups = async () => {
    try {
      setLoadingLookups(true)
      const [customerResult, invRes] = await Promise.all([
        apiClient<{ success: boolean; customers: any[] }>("/api/invoices/customers/search").catch(() => ({ success: false, customers: [] })),
        apiClient<{ success: boolean; items: any[] }>("/api/invoices/inventory/search").catch(() => ({ success: false, items: [] })),
      ])

      if (customerResult?.success && customerResult.customers) {
        setExistingCustomers(customerResult.customers)
      }
      if (invRes?.success && invRes.items) {
        setInventoryItems(invRes.items)
      }
    } catch (_) {
    } finally {
      setLoadingLookups(false)
    }
  }

  // Handle selecting an existing customer
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id)
    const customer = existingCustomers.find((c) => c.id === id)
    if (customer) {
      setCustomerName(customer.name || "")
      setCustomerEmail(customer.email || "")
      setCustomerPhone(customer.phone || "")
      setCustomerAddress(customer.address || "")
      setCustomerGstin(customer.gstin || "")
    }
  }

  // Calculations
  const calculations = useMemo(() => {
    let itemsTotal = 0
    let servicesTotal = 0
    let materialsTotal = 0

    lineItems.forEach((item) => {
      const line = Number((Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2))
      itemsTotal += line
      if (item.item_type === "material") materialsTotal += line
      else servicesTotal += line
    })

    const subtotal = Math.max(0, itemsTotal + Number(transportCharges || 0) - Number(discountAmount || 0))
    const taxRate = Number(gstRate || 0) / 100
    const totalTax = Number((subtotal * taxRate).toFixed(2))
    const cgst = isInterState ? 0 : Number((totalTax / 2).toFixed(2))
    const sgst = isInterState ? 0 : Number((totalTax / 2).toFixed(2))
    const igst = isInterState ? totalTax : 0
    const grandTotal = Number((subtotal + totalTax).toFixed(2))

    return {
      itemsTotal,
      servicesTotal,
      materialsTotal,
      subtotal,
      totalTax,
      cgst,
      sgst,
      igst,
      grandTotal,
    }
  }, [lineItems, transportCharges, discountAmount, gstRate, isInterState])

  // Line Items Handlers
  const addLineItem = (type: "service" | "material") => {
    const newItem: LineItem = {
      id: String(Date.now()),
      item_type: type,
      description: type === "service" ? "Professional Service" : "Spare Part / Consumable",
      hsn_code: type === "service" ? "998311" : "847990",
      quantity: 1,
      unit_price: 500,
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast({
        title: "Minimum Required",
        description: "Invoice must contain at least one line item.",
        variant: "destructive",
      })
      return
    }
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  // Quick Pick from Inventory
  const handlePickInventory = (rowId: string, inventoryId: string) => {
    const inv = inventoryItems.find((i) => String(i.id) === String(inventoryId))
    if (inv) {
      updateLineItem(rowId, {
        description: `${inv.name}${inv.category ? ` (${inv.category})` : ""}`,
        inventory_item_id: inv.id,
        item_type: "material",
        hsn_code: "847990",
      })
    }
  }

  // Submit Handler
  const handleIssueInvoice = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Customer Name Missing",
        description: "Please specify a customer name for this walk-in invoice.",
        variant: "destructive",
      })
      return
    }

    if (lineItems.length === 0) {
      toast({
        title: "No Line Items",
        description: "Add at least one service or material line item.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        invoice_type: "walk_in",
        customer_id: customerMode === "existing" ? selectedCustomerId : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        customer_address: customerAddress.trim(),
        customer_gstin: customerGstin.trim(),
        auto_create_customer: true,
        lineItems: lineItems.map((item) => ({
          item_type: item.item_type,
          description: item.description,
          hsn_code: item.hsn_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          inventory_item_id: item.inventory_item_id || null,
        })),
        transport_charges: Number(transportCharges || 0),
        discount_amount: Number(discountAmount || 0),
        gst_rate: Number(gstRate || 18),
        is_inter_state: Boolean(isInterState),
        payment_status: paymentStatus,
        payment_method: paymentStatus === "paid" ? paymentMethod : null,
        transaction_reference: transactionRef || (paymentStatus === "paid" ? `COUNTER_${paymentMethod.toUpperCase()}` : ""),
        payment_notes: paymentStatus === "paid" ? `Paid at counter via ${paymentMethod.toUpperCase()}` : "",
        due_days: paymentStatus === "paid" ? 0 : Number(dueDays || 15),
        customer_notes: customerNotes,
      }

      const res = await apiClient<{ success: boolean; invoice: any; payment: any; pdfUrl: string }>(
        "/api/invoices/direct-create",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )

      if (res && res.success) {
        setCreatedInvoiceResult(res)
        setStep("success")
        toast({
          title: "Direct Invoice Issued! 🧾",
          description: `Invoice ${res.invoice.invoice_number} generated successfully.`,
        })
        onInvoiceCreated(res.invoice)
      }
    } catch (err: any) {
      toast({
        title: "Invoice Generation Failed",
        description: err.message || "Failed to create direct invoice.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Quick Action dispatches from Success Screen
  const handlePrint = (_invoiceId: string) => {
    window.print()
  }

  const handleWhatsApp = async (invoiceId: string) => {
    try {
      await apiClient(`/api/invoices/${invoiceId}/send-whatsapp`, {
        method: "POST",
        body: JSON.stringify({ phone: customerPhone }),
      })
      toast({ title: "WhatsApp Sent", description: `Invoice PDF link sent to ${customerPhone}.` })
    } catch (e: any) {
      toast({ title: "WhatsApp Failed", description: e.message, variant: "destructive" })
    }
  }

  const handleEmail = async (invoiceId: string) => {
    try {
      await apiClient(`/api/invoices/${invoiceId}/send-email`, {
        method: "POST",
        body: JSON.stringify({ email: customerEmail }),
      })
      toast({ title: "Email Sent", description: `Invoice emailed to ${customerEmail}.` })
    } catch (e: any) {
      toast({ title: "Email Failed", description: e.message, variant: "destructive" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-8">
        
        {/* SUCCESS VIEW */}
        {step === "success" && createdInvoiceResult && (
          <div className="py-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-foreground">
                Invoice Issued Successfully!
              </h2>
              <p className="text-xs text-muted-foreground">
                Official GST Tax Invoice is registered in your financial ledger and ready to dispatch.
              </p>
            </div>

            {/* Issued Summary Card */}
            <div className="max-w-md mx-auto bg-card border border-border/70 rounded-2xl p-5 shadow-xs text-left space-y-3">
              <div className="flex justify-between items-center border-b border-border/50 pb-2.5">
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Invoice Number</div>
                  <div className="text-base font-black font-mono text-primary">{createdInvoiceResult.invoice.invoice_number}</div>
                </div>
                <Badge className={paymentStatus === "paid" ? "bg-emerald-600 text-white font-extrabold" : "bg-amber-600 text-white font-extrabold"}>
                  {paymentStatus === "paid" ? "PAID AT COUNTER" : "UNPAID / ISSUED"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-bold text-foreground">{customerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Grand Total:</span>
                  <div className="font-black text-foreground">₹{calculations.grandTotal.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Print, Send */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handlePrint(createdInvoiceResult.invoice.id)}
                className="rounded-xl text-xs font-bold gap-2"
              >
                <Printer className="w-4 h-4 text-foreground" /> Print / Save Invoice
              </Button>

              {customerPhone && (
                <Button
                  variant="outline"
                  onClick={() => handleWhatsApp(createdInvoiceResult.invoice.id)}
                  className="rounded-xl text-xs font-bold gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                >
                  <MessageSquare className="w-4 h-4" /> Send WhatsApp
                </Button>
              )}

              {customerEmail && (
                <Button
                  variant="outline"
                  onClick={() => handleEmail(createdInvoiceResult.invoice.id)}
                  className="rounded-xl text-xs font-bold gap-2 border-indigo-500/30 text-indigo-600 hover:bg-indigo-50"
                >
                  <Mail className="w-4 h-4" /> Send Email
                </Button>
              )}
            </div>

            <div className="pt-4 border-t border-border/50">
              <Button
                onClick={onClose}
                className="w-full sm:w-auto px-8 rounded-xl font-bold text-xs"
              >
                Close & Return to Invoices
              </Button>
            </div>
          </div>
        )}

        {/* LIVE PREVIEW VIEW */}
        {step === "preview" && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-black flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Live Tax Invoice Preview
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Verify all customer, line items, and GST calculations prior to issuing.
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="border-primary/40 text-primary font-bold">
                  DRAFT PREVIEW
                </Badge>
              </div>
            </DialogHeader>

            {/* Document Preview Sheet */}
            <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-xs font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xl font-black text-slate-900">TAX INVOICE</div>
                  <div className="text-[11px] text-slate-500 font-semibold">Prozync SmartERP Billing Engine</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Date</div>
                  <div className="font-bold text-slate-800">{new Date().toLocaleDateString("en-IN")}</div>
                </div>
              </div>

              {/* Bill To Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Billed To</div>
                  <div className="font-bold text-sm text-slate-900">{customerName || "Walk-in Customer"}</div>
                  {customerPhone && <div className="text-slate-600">Phone: {customerPhone}</div>}
                  {customerEmail && <div className="text-slate-600">Email: {customerEmail}</div>}
                  {customerAddress && <div className="text-slate-600">{customerAddress}</div>}
                  {customerGstin && <div className="font-mono font-bold text-slate-800 mt-1">GSTIN: {customerGstin}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Payment Status</div>
                  <Badge className={paymentStatus === "paid" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}>
                    {paymentStatus === "paid" ? `PAID (${paymentMethod.toUpperCase()})` : "UNPAID (CREDIT)"}
                  </Badge>
                  {paymentStatus === "unpaid" && (
                    <div className="text-slate-500 mt-2">Due in {dueDays} days</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-[11px] font-extrabold uppercase text-slate-600">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">HSN</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate (₹)</th>
                    <th className="py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-semibold text-slate-800">
                        {item.description}
                        <span className="text-[10px] text-slate-400 block font-normal capitalize">Type: {item.item_type}</span>
                      </td>
                      <td className="py-2.5 text-center font-mono text-slate-500">{item.hsn_code}</td>
                      <td className="py-2.5 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 text-right text-slate-600">₹{Number(item.unit_price).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ₹{(Number(item.quantity) * Number(item.unit_price)).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">₹{calculations.itemsTotal.toLocaleString("en-IN")}</span>
                  </div>
                  {transportCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Transport:</span>
                      <span className="font-semibold text-slate-800">₹{transportCharges.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {isInterState ? (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST ({gstRate}%):</span>
                      <span className="font-semibold text-slate-800">₹{calculations.igst.toLocaleString("en-IN")}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST ({gstRate / 2}%):</span>
                        <span className="font-semibold text-slate-800">₹{calculations.cgst.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST ({gstRate / 2}%):</span>
                        <span className="font-semibold text-slate-800">₹{calculations.sgst.toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span className="text-indigo-600">₹{calculations.grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={submitting}
                className="rounded-xl text-xs"
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleIssueInvoice}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Issuing Official Invoice...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Issue Invoice (₹{calculations.grandTotal.toLocaleString("en-IN")})
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* FORM VIEW (DEFAULT) */}
        {step === "form" && (
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <DialogTitle className="text-xl font-black text-foreground">
                  Direct / Walk-in Invoice Generator
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Bill walk-in customers and direct counter clients immediately with automatic GST calculation, line items, and payment settlement.
              </DialogDescription>
            </DialogHeader>

            {/* Step 1: Customer Selection */}
            <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Customer Information
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setCustomerMode("quick_add")}
                    className={`px-3 py-1 rounded-lg transition-all ${customerMode === "quick_add" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    + Walk-in Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode("existing")}
                    className={`px-3 py-1 rounded-lg transition-all ${customerMode === "existing" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Existing Client ({existingCustomers.length})
                  </button>
                </div>
              </div>

              {customerMode === "existing" ? (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Select Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={handleSelectCustomer}>
                    <SelectTrigger className="text-xs rounded-xl">
                      <SelectValue placeholder="Choose a registered client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCustomers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""} {c.email ? `• ${c.email}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* Customer Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Full Name <span className="text-rose-500">*</span></Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer / Company Name"
                    className="text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Phone Number</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Email Address (Optional)</Label>
                  <Input
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px] font-semibold">Billing Address (Optional)</Label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Street, City, State, PIN"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">GSTIN (Optional)</Label>
                  <Input
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    className="text-xs rounded-xl font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Line Items */}
            <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Line Items (Services & Materials)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addLineItem("service")}
                    className="text-[11px] h-7 rounded-lg font-bold gap-1"
                  >
                    <Plus className="w-3 h-3" /> Service
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addLineItem("material")}
                    className="text-[11px] h-7 rounded-lg font-bold gap-1"
                  >
                    <Plus className="w-3 h-3" /> Material / Part
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {lineItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-muted/30 border border-border/50 rounded-xl space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-bold uppercase">
                          {item.item_type}
                        </Badge>
                        Item #{idx + 1}
                      </span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-muted-foreground hover:text-rose-600 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      <div className="sm:col-span-6 space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-semibold">Description</Label>
                          {inventoryItems.length > 0 && item.item_type === "material" && (
                            <select
                              onChange={(e) => handlePickInventory(item.id, e.target.value)}
                              className="text-[10px] text-primary bg-transparent font-medium focus:outline-none cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>Pick from Inventory...</option>
                              {inventoryItems.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.name} (Qty: {inv.quantity})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                          className="text-xs rounded-xl"
                          placeholder="Item name / service scope"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[10px] font-semibold">HSN / SAC</Label>
                        <Input
                          value={item.hsn_code}
                          onChange={(e) => updateLineItem(item.id, { hsn_code: e.target.value })}
                          className="text-xs rounded-xl font-mono text-center"
                          placeholder="998311"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[10px] font-semibold">Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="text-xs rounded-xl text-center font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[10px] font-semibold">Unit Price (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                          className="text-xs rounded-xl text-right font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: GST, Discount & Charges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  3. Taxes & Adjustments
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">GST Rate</Label>
                    <Select value={String(gstRate)} onValueChange={(v) => setGstRate(Number(v))}>
                      <SelectTrigger className="text-xs rounded-xl">
                        <SelectValue placeholder="GST Rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0% (Nil / Exempt)</SelectItem>
                        <SelectItem value="5">5% GST</SelectItem>
                        <SelectItem value="12">12% GST</SelectItem>
                        <SelectItem value="18">18% GST (Standard)</SelectItem>
                        <SelectItem value="28">28% GST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Discount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="text-xs rounded-xl"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Transport / Conveyance (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                      className="text-xs rounded-xl"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <Label className="text-xs font-semibold cursor-pointer">Inter-State (IGST)</Label>
                      <p className="text-[10px] text-muted-foreground">Applies full IGST</p>
                    </div>
                    <Switch checked={isInterState} onCheckedChange={setIsInterState} />
                  </div>
                </div>
              </div>

              {/* Step 4: Payment Option */}
              <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  4. Payment Collection
                </span>

                <div className="flex gap-2 bg-muted p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("paid")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${paymentStatus === "paid" ? "bg-card text-emerald-600 shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    💵 Paid at Counter
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("unpaid")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${paymentStatus === "unpaid" ? "bg-card text-amber-600 shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    ⏳ Unpaid / On Credit
                  </button>
                </div>

                {paymentStatus === "paid" ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Payment Mode</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="text-xs rounded-xl">
                          <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash (Office Counter)</SelectItem>
                          <SelectItem value="upi">📱 UPI QR / PhonePe / GPay</SelectItem>
                          <SelectItem value="card">💳 POS Card Swipe</SelectItem>
                          <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                          <SelectItem value="cheque">📝 Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Reference / UTR # (Optional)</Label>
                      <Input
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. UPI Ref / Receipt No"
                        className="text-xs rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Credit Terms / Due In</Label>
                    <Select value={String(dueDays)} onValueChange={(v) => setDueDays(Number(v))}>
                      <SelectTrigger className="text-xs rounded-xl">
                        <SelectValue placeholder="Due terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Due Immediately</SelectItem>
                        <SelectItem value="7">Net 7 Days</SelectItem>
                        <SelectItem value="15">Net 15 Days</SelectItem>
                        <SelectItem value="30">Net 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Live Financial Total Summary Ribbon */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-primary">Calculation Summary</span>
                <div className="text-xs text-muted-foreground">
                  Subtotal: ₹{calculations.subtotal.toLocaleString("en-IN")} + GST ({gstRate}%): ₹{calculations.totalTax.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Grand Total</div>
                  <div className="text-2xl font-black text-foreground">
                    ₹{calculations.grandTotal.toLocaleString("en-IN")}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("preview")}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Button>

                <Button
                  type="button"
                  onClick={handleIssueInvoice}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl gap-2 shadow-md shadow-primary/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Issuing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Issue Invoice
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
