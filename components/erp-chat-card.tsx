"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, FileText, Calendar, DollarSign, Laptop, ExternalLink, CheckCircle2 } from "lucide-react"

interface ErpChatCardProps {
  recordType?: "job" | "invoice" | "leave" | "payslip" | "asset" | string
  recordId?: string
  content?: string
}

export function ErpChatCard({ recordType, recordId, content }: ErpChatCardProps) {
  if (recordType === "job") {
    return (
      <Card className="premium-card border-blue-500/30 bg-blue-500/5 my-1 max-w-sm">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-600">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground">SmartERP Job Record</span>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">Active</Badge>
          </div>
          <p className="text-xs font-semibold text-foreground">{content || `Job #${recordId}`}</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs font-bold rounded-xl border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
            onClick={() => window.location.href = `/customer/jobs`}
          >
            View Job Details <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (recordType === "invoice") {
    return (
      <Card className="premium-card border-emerald-500/30 bg-emerald-500/5 my-1 max-w-sm">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground">SmartERP Invoice Card</span>
            </div>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">Issued</Badge>
          </div>
          <p className="text-xs font-semibold text-foreground">{content || `Invoice #${recordId}`}</p>
          <Button
            size="sm"
            className="w-full h-7 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => window.location.href = `/customer/invoices/${recordId || ''}`}
          >
            View & Pay Invoice <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (recordType === "leave") {
    return (
      <Card className="premium-card border-amber-500/30 bg-amber-500/5 my-1 max-w-sm">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground">Leave Application Card</span>
            </div>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">Pending</Badge>
          </div>
          <p className="text-xs font-semibold text-foreground">{content || `Leave Request #${recordId}`}</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs font-bold rounded-xl border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
            onClick={() => window.location.href = `/hr/requests`}
          >
            Review in HR Inbox <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border my-1 max-w-sm">
      <CardContent className="p-3 space-y-1">
        <span className="text-[10px] font-extrabold uppercase text-primary">SmartERP Linked Record</span>
        <p className="text-xs font-semibold text-foreground">{content}</p>
      </CardContent>
    </Card>
  )
}
