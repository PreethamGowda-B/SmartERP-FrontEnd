"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { MaterialRequestCard } from "@/components/material-request-card"
import { MaterialRequestForm } from "@/components/material-request-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  mockMaterialRequestsWithDetails,
  getMaterialRequestStats,
  type MaterialRequestWithDetails,
} from "@/lib/materials-data"
import { Search, Filter, Plus, Package, Clock, CheckCircle, Truck } from "lucide-react"

export default function OwnerMaterialsPage() {
  const [requests, setRequests] = useState<MaterialRequestWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaterialRequestWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch material requests from backend with real-time polling
  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function loadMaterialRequests() {
      try {
        const response = await fetch((process.env.NEXT_PUBLIC_API_BASE || '') + '/api/materials/requests', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        
        if (response.ok && mounted) {
          const serverRequests = await response.json()
          
          // Transform backend data to match frontend MaterialRequestWithDetails interface
          const transformedRequests: MaterialRequestWithDetails[] = serverRequests.map((req: any) => ({
            id: req.id?.toString() || Date.now().toString(),
            requestNumber: req.request_number || `REQ-${req.id}`,
            jobTitle: req.job_title || 'General Request',
            requestedBy: req.requested_by_name || `User ${req.requested_by}`,
            status: req.status || 'pending',
            urgency: req.urgency || 'medium',
            items: req.items || [],
            totalCost: req.total_cost || 0,
            createdAt: req.created_at || new Date().toISOString(),
            notes: req.notes || '',
          }))
          
          setRequests(transformedRequests)
        } else if (!response.ok) {
          console.warn('Failed to fetch material requests from backend, using fallback data')
          if (mounted && requests.length === 0) {
            setRequests(mockMaterialRequestsWithDetails)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch material requests from server, using fallback data', err)
        if (mounted && requests.length === 0) {
          setRequests(mockMaterialRequestsWithDetails)
        }
      }
    }

    // Initial load
    loadMaterialRequests()
    // Poll every 2 seconds for real-time updates of material requests
    intervalId = setInterval(loadMaterialRequests, 2000)

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesUrgency = urgencyFilter === "all" || request.urgency === urgencyFilter
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const stats = getMaterialRequestStats(requests)

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

  const handleApproveRequest = (request: MaterialRequestWithDetails) => {
    // Call backend to approve
    ;(async () => {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || '') + `/api/materials/requests/${request.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'approve' }),
        })
        if (!res.ok) throw new Error('Failed to approve')
        
        // Update local state immediately for better UX
        setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: 'approved' as const } : r)))
      } catch (err) {
        console.warn('Approve failed', err)
        alert('Failed to approve request')
      }
    })()
  }

  const handleRejectRequest = (request: MaterialRequestWithDetails) => {
    ;(async () => {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || '') + `/api/materials/requests/${request.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'reject' }),
        })
        if (!res.ok) throw new Error('Failed to reject')
        
        // Update local state immediately for better UX
        setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: 'rejected' as const } : r)))
      } catch (err) {
        console.warn('Reject failed', err)
        alert('Failed to reject request')
      }
    })()
  }

  const handleSubmitRequest = async (requestData: any) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (editingRequest) {
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
      const newRequest: MaterialRequestWithDetails = {
        id: Date.now().toString(),
        ...requestData,
        status: "pending" as const,
        totalCost: requestData.items.reduce((sum: number, item: any) => sum + item.quantity * item.estimatedCost, 0),
      }
      setRequests((prev) => [newRequest, ...prev])
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
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Material Requests</h1>
            <p className="text-muted-foreground">Manage material requests and procurement for all projects</p>
          </div>
          {/* Owners cannot create requests here; employees create requests from the Employee Portal */}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">${stats.pendingValue.toLocaleString()} value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Ready for ordering</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.ordered}</div>
              <p className="text-xs text-muted-foreground">On the way</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests, jobs, or materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
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
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <MaterialRequestCard
              key={request.id}
              request={request}
              onEdit={handleEditRequest}
              onDelete={handleDeleteRequest}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              showApprovalActions={true}
            />
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No material requests found</h3>
            <p className="text-muted-foreground">No requests match your current filters.</p>
          </div>
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
    </OwnerLayout>
  )
}