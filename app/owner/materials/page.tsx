"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Search, Loader2, Check, X, Clock } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"

interface MaterialRequest {
  id: number
  item_name: string
  quantity: number
  urgency: string
  description: string
  status: string
  requested_by_name: string
  created_at: string
  reviewed_at?: string
}

export default function OwnerMaterialsPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch all material requests
  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await apiClient("/api/material-requests")
      setRequests(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Accept request
  const handleAccept = async (requestId: number) => {
    setProcessing(requestId)
    setError(null)
    try {
      await apiClient(`/api/material-requests/${requestId}/accept`, {
        method: "PATCH",
      })
      await fetchRequests()
    } catch (err: any) {
      setError(err.message || "Failed to accept request")
    } finally {
      setProcessing(null)
    }
  }

  // Decline request
  const handleDecline = async (requestId: number) => {
    setProcessing(requestId)
    setError(null)
    try {
      await apiClient(`/api/material-requests/${requestId}/decline`, {
        method: "PATCH",
      })
      await fetchRequests()
    } catch (err: any) {
      setError(err.message || "Failed to decline request")
    } finally {
      setProcessing(null)
    }
  }

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_by_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const pendingCount = requests.filter((r) => r.status === "pending").length
  const acceptedCount = requests.filter((r) => r.status === "accepted").length
  const declinedCount = requests.filter((r) => r.status === "declined").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Urgent":
        return "text-red-600 font-semibold"
      case "High":
        return "text-orange-600 font-medium"
      case "Medium":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Material Requests</h1>
          <p className="text-muted-foreground mt-1">Review and approve material requests from employees</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">&times;</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-bold">{acceptedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Declined</p>
                  <p className="text-2xl font-bold">{declinedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40 text-muted-foreground" />
              <p className="text-lg font-medium">No material requests found</p>
              <p className="text-sm text-muted-foreground">
                {requests.length === 0 ? "No requests have been submitted yet" : "Try adjusting your search or filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{request.item_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested by: <span className="font-medium text-foreground">{request.requested_by_name}</span>
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-semibold">{request.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Urgency:</span>
                      <span className={getUrgencyColor(request.urgency)}>{request.urgency}</span>
                    </div>
                  </div>

                  {request.description && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Description:</p>
                      <p className="text-sm">{request.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Clock className="h-3 w-3" />
                    {new Date(request.created_at).toLocaleDateString()} at{" "}
                    {new Date(request.created_at).toLocaleTimeString()}
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAccept(request.id)}
                        disabled={processing === request.id}
                      >
                        {processing === request.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 hover:bg-red-50"
                        onClick={() => handleDecline(request.id)}
                        disabled={processing === request.id}
                      >
                        {processing === request.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  )
}
