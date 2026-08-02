"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import {
  FileText, Download, Send, Eye, MessageSquare, Mail, CheckCircle2, Clock,
  AlertTriangle, Search, Filter, Loader2, Plus, Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/apiClient"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function OwnerInvoicesListPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter])

  const fetchInvoices = async () => {
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
  }

  const handleSendWhatsApp = async (invId: string) => {
    try {
      await apiClient(`/api/invoices/${invId}/send-whatsapp`, { method: "POST" })
      toast({ title: "WhatsApp Dispatched", description: "Invoice link sent via WhatsApp to client." })
    } catch (err: any) {
      toast({ title: "WhatsApp Failed", description: err.message, variant: "destructive" })
    }
  }

  const handleSendEmail = async (invId: string) => {
    try {
      await apiClient(`/api/invoices/${invId}/send-email`, { method: "POST" })
      toast({ title: "Email Dispatched", description: "Invoice PDF emailed to client successfully." })
    } catch (err: any) {
      toast({ title: "Email Failed", description: err.message, variant: "destructive" })
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase()
    return (
      (inv.invoice_number || "").toLowerCase().includes(query) ||
      (inv.customer_name || "").toLowerCase().includes(query)
    )
  })

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Invoices & Billing Command Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dispatch customer invoices, track billing statuses, trigger WhatsApp/Email reminders, and inspect tax amounts.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search invoice # or customer name..."
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
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices List Table */}
        <Card className="rounded-2xl border border-border/70 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs font-bold">No invoices found matching filter criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b uppercase font-extrabold">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5 text-right">Subtotal</th>
                      <th className="p-3.5 text-right">Tax</th>
                      <th className="p-3.5 text-right">Total Amount</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Dispatch & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-foreground">{inv.invoice_number}</td>
                        <td className="p-3.5 font-semibold text-foreground">{inv.customer_name || "Client"}</td>
                        <td className="p-3.5 text-right">₹{Number(inv.subtotal || 0).toLocaleString("en-IN")}</td>
                        <td className="p-3.5 text-right text-muted-foreground">₹{Number(inv.total_tax || 0).toLocaleString("en-IN")}</td>
                        <td className="p-3.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                          ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge className="text-[10px] font-bold uppercase px-2 py-0.5">
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="View PDF"
                            onClick={() => {
                              const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"
                              window.open(`${baseUrl}/api/invoices/${inv.id}/pdf`, "_blank")
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Send WhatsApp"
                            onClick={() => handleSendWhatsApp(inv.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Send Email"
                            onClick={() => handleSendEmail(inv.id)}
                          >
                            <Mail className="h-3.5 w-3.5 text-indigo-600" />
                          </Button>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  )
}
