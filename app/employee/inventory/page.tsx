"use client"

import { useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import InventoryForm from "@/components/inventory-form"
import InventoryTable from "@/components/inventory-table"
import InventoryInsights from "@/components/inventory-insights"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

type InventoryItem = {
  id: number
  name: string
  quantity: number
  min_quantity?: number
  category?: string
  unit?: string
}

export default function EmployeeInventoryPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleItemAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
    setIsFormOpen(false) // Close dialog after adding item
  }

  const handleItemsChange = (items: any[]) => {
    setInventoryItems(items)
  }

  const handleOpenForm = () => {
    setIsFormOpen(true)
  }

  return (
    <EmployeeLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                Inventory Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Add and manage stock details with images, descriptions, and quantities.
              </p>
            </div>
            <Button onClick={handleOpenForm} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add New Stock
            </Button>
          </div>

          <InventoryTable role="employee" refreshTrigger={refreshTrigger} onItemsChange={handleItemsChange} />
        </div>

        {/* Right column: Insights */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <InventoryInsights items={inventoryItems} />
          </div>
        </div>
      </div>

      {/* Inventory Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Stock</DialogTitle>
          </DialogHeader>
          <InventoryForm role="employee" onItemAdded={handleItemAdded} />
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  )
}
