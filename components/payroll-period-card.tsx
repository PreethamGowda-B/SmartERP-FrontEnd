"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PayrollPeriod } from "@/lib/payroll-data"
import { Calendar, DollarSign, Users, Eye, Play, Check, Download } from "lucide-react"
import { format } from "date-fns"

interface PayrollPeriodCardProps {
  period: PayrollPeriod
  onView?: (period: PayrollPeriod) => void
  onProcess?: (period: PayrollPeriod) => void
  onComplete?: (period: PayrollPeriod) => void
  onDownload?: (period: PayrollPeriod) => void
  showActions?: boolean
}

export function PayrollPeriodCard({
  period,
  onView,
  onProcess,
  onComplete,
  onDownload,
  showActions = true,
}: PayrollPeriodCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "outline"
      case "processing":
        return "secondary"
      case "completed":
        return "default"
      case "paid":
        return "default"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return null
      case "processing":
        return <Play className="h-3 w-3" />
      case "completed":
        return <Check className="h-3 w-3" />
      case "paid":
        return <Check className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{format(new Date(period.startDate), "MMMM yyyy")} Payroll</CardTitle>
            <CardDescription>
              {format(new Date(period.startDate), "MMM dd")} - {format(new Date(period.endDate), "MMM dd, yyyy")}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(period.status)} className="flex items-center gap-1">
            {getStatusIcon(period.status)}
            {period.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{period.totalEmployees} employees</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(period.endDate), "MMM dd")}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross Pay</span>
            <span className="font-medium">${period.totalGrossPay.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deductions</span>
            <span className="font-medium text-destructive">-${period.totalDeductions.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t pt-2">
            <span>Net Pay</span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {period.totalNetPay.toLocaleString()}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2 flex-wrap">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(period)}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            )}
            {onProcess && period.status === "draft" && (
              <Button variant="default" size="sm" onClick={() => onProcess(period)}>
                <Play className="h-4 w-4 mr-1" />
                Process
              </Button>
            )}
            {onComplete && period.status === "processing" && (
              <Button variant="default" size="sm" onClick={() => onComplete(period)}>
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            {onDownload && (period.status === "completed" || period.status === "paid") && (
              <Button variant="outline" size="sm" onClick={() => onDownload(period)}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
