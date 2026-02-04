"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, Loader2 } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
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
}

export default function EmployeeMaterialsPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "",
    urgency: "Medium",
    description: "",
  })

  // Fetch user's material requests
  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await apiClient("/api/material-requests")
      setRequests(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Submit new material request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.item_name.trim()) {
      setError("Item name is required")
      return
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError("Valid quantity is required")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await apiClient("/api/material-requests", {
        method: "POST",
        body: JSON.stringify({
          item_name: formData.item_name,
          quantity: parseInt(formData.quantity),
          urgency: formData.urgency,
          description: formData.description,
        }),
      })

      // Reset form
      setFormData({
        item_name: "",
        quantity: "",
        urgency: "Medium",
        description: "",
      })

      // Refresh requests list
      await fetchRequests()

      alert("Material request submitted successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

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
        return "text-red-600"
      case "High":
        return "text-orange-600"
      case "Medium":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Material Requests</h1>
          <p className="text-muted-foreground mt-1">Request materials needed for your work</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>New Material Request</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="item_name">Item Name *</Label>
                    <Input
                      id="item_name"
                      placeholder="e.g., Cement Bags, Steel Rods"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="e.g., 10"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="urgency">Urgency</Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide details about the material, specifications, or any special requirements..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>No material requests yet</p>
                    <p className="text-sm">Submit your first request using the form</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{request.item_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Quantity: <span className="font-medium text-foreground">{request.quantity}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            <span className={`text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency}
                            </span>
                          </div>
                        </div>

                        {request.description && (
                          <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(request.created_at).toLocaleDateString()} at{" "}
                          {new Date(request.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}
