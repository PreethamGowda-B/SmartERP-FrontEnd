"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import customerApi from "@/lib/customerApi"
import { toast } from "sonner"
import { CustomerNavbar } from "@/components/customer/layout/CustomerNavbar"
import { FileText, Download, Search, ShieldCheck, FileCheck } from "lucide-react"

export default function CustomerDocumentCenterPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await customerApi.get<{ success?: boolean; documents?: any[] }>("/api/customer/documents")
      const docs = res.data?.documents || (res.data as any)?.data?.documents || []
      setDocuments(docs)
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-500" /> Customer Document Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Download Service Reports, Quotations, Invoices, AMC Contracts, Warranty Certificates, and PM Reports
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by Document Name, Type, or Date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900"
        />
      </div>

      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">No customer documents available.</Card>
        ) : (
          documents.map((d) => (
            <Card key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 border">
              <div className="flex items-center gap-3">
                <FileCheck className="h-6 w-6 text-emerald-500" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{d.name || d.title || "Document"}</h4>
                  <p className="text-xs text-slate-500 uppercase font-mono">{d.category || d.document_type || "General"}</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" asChild>
                <a href={d.file_url || "#"} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
    </div>
  )
}
