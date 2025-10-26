"use client"

import { useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { MaterialRequestCard } from "@/components/material-request-card"
import { MaterialRequestForm } from "@/components/material-request-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockMaterialRequestsWithDetails, type MaterialRequestWithDetails } from "@/lib/materials-data"
import { useAuth } from "@/contexts/auth-context"
import { Search, Plus, Package, Clock, CheckCircle } from "lucide-react"

export default function EmployeeMaterialsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MaterialRequestWithDetails[]>(mockMaterialRequestsWithDetails)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaterialRequestWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter requests to show only those created by the current user
  const userRequests = requests.filter((request) => request.requestedBy === user?.name)

  const filteredRequests = userRequests.filter((request) => {
    const matchesSearch =
      request.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingRequests = userRequests.filter((r) => r.status === "pending").length
  const approvedRequests = userRequests.filter((r) => r.status === "approved").length
  const deliveredRequests = userRequests.filter((r) => r.status === "delivered").length

  const handleCreateRequest = () => {
    setEditingRequest(null)
    setIsFormOpen(true)
  }

  const handleEditRequest = (request: MaterialRequestWithDetails) => {
    setEditingRequest(request)
    setIsFormOpen(true)
  }

  const handleDeleteRequest = (request: MaterialRequestWithDetails) => {
    if (confirm("Are you sure you want to delete this material request?")) {
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
    }
  }

  const handleSubmitRequest = async (requestData: any) => {
    setIsLoading(true)
    try {
      if (editingRequest) {
        // update locally for now; backend update endpoint not implemented for edits
        setRequests((prev) =>
          prev.map((request) =>
            request.id === editingRequest.id
              ? {
                  ...request,
                  ...requestData,
                  totalCost: requestData.items.reduce(
                    (sum: number, item: any) => sum + item.quantity * item.estimatedCost,
                    0,
                  ),
                }
              : request,
          ),
        )
      } else {
        // Create via backend
        const body = {
          requestNumber: requestData.requestNumber,
          items: requestData.items,
        }
        const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || '') + '/api/materials/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        if (res.ok) {
          const { id } = await res.json()
          const newRequest: MaterialRequestWithDetails = {
            id: id.toString(),
            ...requestData,
            status: 'pending',
            totalCost: requestData.items.reduce((sum: number, item: any) => sum + item.quantity * item.estimatedCost, 0),
            requestedBy: user?.name || 'You',
          }
          setRequests((prev) => [newRequest, ...prev])
        } else {
          throw new Error('Failed to create request on server')
        }
      }
    } catch (err) {
      console.warn('Failed to create request on server, saved locally', err)
      if (!editingRequest) {
        const newRequest: MaterialRequestWithDetails = {
          id: Date.now().toString(),
          ...requestData,
          status: 'pending',
          totalCost: requestData.items.reduce((sum: number, item: any) => sum + item.quantity * item.estimatedCost, 0),
          requestedBy: user?.name || 'You',
        }
        setRequests((prev) => [newRequest, ...prev])
      }
    }

    setIsLoading(false)
    setIsFormOpen(false)
    setEditingRequest(null)
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setEditingRequest(null)
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">My Material Requests</h1>
            <p className="text-muted-foreground">Request materials needed for your assigned projects</p>
          </div>
          <Button onClick={handleCreateRequest}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{approvedRequests}</div>
              <p className="text-xs text-muted-foreground">Being processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deliveredRequests}</div>
              <p className="text-xs text-muted-foreground">Ready to use</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests Grid */}
        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <MaterialRequestCard
                key={request.id}
                request={request}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
                showActions={true}
                showApprovalActions={false}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No material requests found</h3>
              <p className="text-muted-foreground mb-4">
                {userRequests.length === 0
                  ? "You haven't submitted any material requests yet."
                  : "No requests match your search criteria."}
              </p>
              {userRequests.length === 0 && (
                <Button onClick={handleCreateRequest}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Material Request Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRequest ? "Edit Material Request" : "New Material Request"}</DialogTitle>
            </DialogHeader>
            <MaterialRequestForm
              request={editingRequest || undefined}
              onSubmit={handleSubmitRequest}
              onCancel={handleCancelForm}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </EmployeeLayout>
  )
}
