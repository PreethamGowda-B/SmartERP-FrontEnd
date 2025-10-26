"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockJobs, type MaterialRequest } from "@/lib/data"
import { materialsCatalog } from "@/lib/materials-data"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Trash2, Loader2, Search } from "lucide-react"

interface MaterialRequestFormProps {
  request?: MaterialRequest
  onSubmit: (request: Partial<MaterialRequest>) => void
  onCancel: () => void
  isLoading?: boolean
}

interface RequestItem {
  name: string
  quantity: number
  unit: string
  estimatedCost: number
}

export function MaterialRequestForm({ request, onSubmit, onCancel, isLoading }: MaterialRequestFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    jobId: request?.jobId || "",
    urgency: request?.urgency || "medium",
    notes: request?.notes || "",
  })
  const [items, setItems] = useState<RequestItem[]>(
    request?.items || [{ name: "", quantity: 1, unit: "", estimatedCost: 0 }],
  )
  const [searchTerm, setSearchTerm] = useState("")

  // Get user's assigned jobs for employees, all jobs for owners
  const availableJobs =
    user?.role === "owner"
      ? mockJobs
      : mockJobs.filter((job) => job.assignedEmployees.includes(user?.id || "") && job.status === "active")

  const filteredMaterials = materialsCatalog.filter((material) =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter((item) => item.name && item.quantity > 0)
    if (validItems.length === 0) return

    onSubmit({
      ...formData,
      items: validItems,
      requestedBy: user?.name || "",
      requestDate: new Date().toISOString().split("T")[0],
    })
  }

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, unit: "", estimatedCost: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const selectMaterial = (index: number, materialId: string) => {
    const material = materialsCatalog.find((m) => m.id === materialId)
    if (material) {
      updateItem(index, "name", material.name)
      updateItem(index, "unit", material.unit)
      updateItem(index, "estimatedCost", material.standardCost)
    }
  }

  const totalEstimatedCost = items.reduce((sum, item) => sum + item.quantity * item.estimatedCost, 0)

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{request ? "Edit Material Request" : "New Material Request"}</CardTitle>
        <CardDescription>
          {request ? "Update your material request details" : "Request materials needed for your project"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobId">Project</Label>
              <Select
                value={formData.jobId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, jobId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {availableJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} - {job.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, urgency: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Materials Needed</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* Material Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials catalog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Add from Catalog */}
            {searchTerm && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {filteredMaterials.slice(0, 6).map((material) => (
                  <Button
                    key={material.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-2 bg-transparent"
                    onClick={() => {
                      const emptyIndex = items.findIndex((item) => !item.name)
                      if (emptyIndex >= 0) {
                        selectMaterial(emptyIndex, material.id)
                      } else {
                        setItems([
                          ...items,
                          {
                            name: material.name,
                            quantity: 1,
                            unit: material.unit,
                            estimatedCost: material.standardCost,
                          },
                        ])
                      }
                      setSearchTerm("")
                    }}
                  >
                    <div className="text-left">
                      <p className="font-medium text-xs">{material.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${material.standardCost}/{material.unit}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <Label className="text-sm">Material Name</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder="Enter material name"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-sm">Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-sm">Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                      placeholder="e.g., pieces"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-sm">Unit Cost ($)</Label>
                    <Input
                      type="number"
                      value={item.estimatedCost}
                      onChange={(e) => updateItem(index, "estimatedCost", Number.parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2 flex items-center gap-2">
                    <div className="text-sm font-medium">${(item.quantity * item.estimatedCost).toFixed(2)}</div>
                    {items.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Total Estimated Cost:</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                ${totalEstimatedCost.toFixed(2)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes, delivery instructions, or special requirements..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading || !formData.jobId || items.every((item) => !item.name)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {request ? "Updating..." : "Submitting..."}
                </>
              ) : request ? (
                "Update Request"
              ) : (
                "Submit Request"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
