"use client"

import { useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import InventoryForm from "@/components/inventory-form"
import InventoryTable from "@/components/inventory-table"
import InventoryInsights from "@/components/inventory-insights"

export default function OwnerInventoryPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleItemAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <OwnerLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Form and List */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Owner Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage and track all inventory items across your organization.</p>
          </div>

          <InventoryForm role="owner" onItemAdded={handleItemAdded} />

          <InventoryTable role="owner" refreshTrigger={refreshTrigger} />
        </div>

        {/* Right column: Insights */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <InventoryInsights />
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
