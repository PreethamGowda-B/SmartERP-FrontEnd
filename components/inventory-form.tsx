"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useInventory } from "@/contexts/inventory-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export function InventoryForm() {
  const { user } = useAuth()
  const { addItem } = useInventory()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    quantity: "",
    unit: "pieces",
    location: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.itemName || !formData.quantity) return

    addItem({
      employeeId: user.id,
      employeeName: user.name,
      itemName: formData.itemName,
      description: formData.description,
      quantity: Number.parseInt(formData.quantity),
      unit: formData.unit,
      location: formData.location,
    })

    setFormData({
      itemName: "",
      description: "",
      quantity: "",
      unit: "pieces",
      location: "",
    })
    setIsOpen(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Stock
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Inventory Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Item Name</label>
                  <Input
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="e.g., Safety Helmets"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Item details"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option>pieces</option>
                      <option>bags</option>
                      <option>boxes</option>
                      <option>meters</option>
                      <option>kg</option>
                      <option>liters</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Storage location"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Item</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
