"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MaterialRequestWithDetails } from "@/lib/materials-data"
import { Calendar, DollarSign, Package, User, Edit, Trash2, Eye, Check, X } from "lucide-react"
import { format } from "date-fns"

interface MaterialRequestCardProps {
  request: MaterialRequestWithDetails
  onEdit?: (request: MaterialRequestWithDetails) => void
  onDelete?: (request: MaterialRequestWithDetails) => void
  onView?: (request: MaterialRequestWithDetails) => void
  onApprove?: (request: MaterialRequestWithDetails) => void
  onReject?: (request: MaterialRequestWithDetails) => void
  showActions?: boolean
  showApprovalActions?: boolean
}

export function MaterialRequestCard({
  request,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  showActions = true,
  showApprovalActions = false,
}: MaterialRequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "outline"
      case "approved":
        return "default"
      case "ordered":
        return "secondary"
      case "delivered":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Material Request #{request.id}</CardTitle>
            <CardDescription>{request.jobTitle}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
            <Badge variant={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(request.requestDate), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${request.totalCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Requested by {request.requestedBy}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>Items ({request.items.length})</span>
          </div>
          <div className="space-y-1">
            {request.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
                <span>
                  {item.name} ({item.quantity} {item.unit})
                </span>
                <span className="font-medium">${item.estimatedCost.toLocaleString()}</span>
              </div>
            ))}
            {request.items.length > 3 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                +{request.items.length - 3} more items
              </div>
            )}
          </div>
        </div>

        {request.notes && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Notes:</p>
            <p className="text-sm bg-muted/50 p-2 rounded">{request.notes}</p>
          </div>
        )}

        {(showActions || showApprovalActions) && (
          <div className="flex gap-2 pt-2 flex-wrap">
            {showApprovalActions && request.status === "pending" && (
              <>
                {onApprove && (
                  <Button variant="default" size="sm" onClick={() => onApprove(request)}>
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
                {onReject && (
                  <Button variant="destructive" size="sm" onClick={() => onReject(request)}>
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                )}
              </>
            )}
            {showActions && (
              <>
                {onView && (
                  <Button variant="outline" size="sm" onClick={() => onView(request)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}
                {onEdit && request.status === "pending" && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(request)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {onDelete && request.status === "pending" && (
                  <Button variant="outline" size="sm" onClick={() => onDelete(request)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
