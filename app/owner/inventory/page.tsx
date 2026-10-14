"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { OwnerLayout } from "@/components/owner-layout"
import InventoryForm from "@/components/inventory-form"
import InventoryTable from "@/components/inventory-table"
import InventoryInsights from "@/components/inventory-insights"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Boxes, ClipboardList, TrendingUp } from "lucide-react"
import { ExportButton } from "@/components/export-button"
import { MaterialsView } from "@/components/materials-view"
import { ForecastsView } from "@/components/forecasts-view"

type InventoryItem = {
  id: number
  name: string
  quantity: number
  min_quantity?: number
  category?: string
  unit?: string
  description?: string
  supplier_name?: string
  supplier_contact?: string
  supplier_email?: string
  image_url?: string
}

function InventoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState<string>("stock")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined)

  useEffect(() => {
    if (tabParam === "materials" || tabParam === "requests") {
      setActiveTab("materials")
    } else if (tabParam === "forecasts" || tabParam === "reorder") {
      setActiveTab("forecasts")
    } else if (tabParam === "stock") {
      setActiveTab("stock")
    }
  }, [tabParam])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    router.replace(`/owner/inventory?tab=${val}`, { scroll: false })
  }

  const handleItemAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
    setIsFormOpen(false)
    setEditingItem(undefined)
  }

  const handleItemsChange = (items: any[]) => {
    setInventoryItems(items)
  }

  const handleOpenForm = () => {
    setEditingItem(undefined)
    setIsFormOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleCancelEdit = () => {
    setEditingItem(undefined)
    setIsFormOpen(false)
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Main In-Page Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Inventory & Supplies Hub
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Unified warehouse tracking, stock replenishment, material requests, and AI demand forecasting.
              </p>
            </div>

            <TabsList className="grid grid-cols-3 w-full sm:w-auto h-10 p-1 bg-muted/70">
              <TabsTrigger value="stock" className="flex items-center gap-1.5 text-xs font-medium">
                <Boxes className="h-3.5 w-3.5" />
                <span>Stock & Parts</span>
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-1.5 text-xs font-medium">
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Material Requests</span>
              </TabsTrigger>
              <TabsTrigger value="forecasts" className="flex items-center gap-1.5 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Demand Forecasts</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Sub-Tab 1: Stock & Parts */}
          <TabsContent value="stock" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header with Add Button & Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Stock & Inventory Items</h2>
                    <p className="text-xs text-muted-foreground">Manage and track all inventory items across your facilities.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExportButton
                      filename="Inventory_Report"
                      title="Inventory Status Report"
                      subtitle="Operational Stock Analysis"
                      onExport={async () => {
                        const res = await apiClient("/api/inventory?limit=10000")
                        return res.map((item: any) => ({
                          ...item,
                          status: item.quantity <= (item.min_quantity || 0) ? "Low Stock" : "Available"
                        }))
                      }}
                      columns={[
                        { header: "Item Name", dataKey: "name" },
                        { header: "Category", dataKey: "category" },
                        { header: "Quantity", dataKey: "quantity", type: "number" },
                        { header: "Min Stock", dataKey: "min_quantity", type: "number" },
                        { header: "Status", dataKey: "status" },
                        { header: "Supplier", dataKey: "supplier_name" },
                        { header: "Description", dataKey: "description" }
                      ]}
                    />
                    <Button onClick={handleOpenForm} size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Stock
                    </Button>
                  </div>
                </div>

                <InventoryTable
                  role="owner"
                  refreshTrigger={refreshTrigger}
                  onItemsChange={handleItemsChange}
                  onEdit={handleEdit}
                />
              </div>

              {/* Right column: Insights */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <InventoryInsights items={inventoryItems} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Sub-Tab 2: Material Requests */}
          <TabsContent value="materials" className="mt-0">
            <MaterialsView />
          </TabsContent>

          {/* Sub-Tab 3: Demand Forecasts */}
          <TabsContent value="forecasts" className="mt-0">
            <ForecastsView />
          </TabsContent>
        </Tabs>
      </div>

      {/* Inventory Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Stock" : "Add New Stock"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the details of this item." : "Fill in the details to add a new item to your inventory."}
            </DialogDescription>
          </DialogHeader>
          <InventoryForm role="owner" onItemAdded={handleItemAdded} item={editingItem} onCancel={handleCancelEdit} />
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  )
}

export default function OwnerInventoryPage() {
  return (
    <Suspense
      fallback={
        <OwnerLayout>
          <div className="p-6">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-6" />
            <div className="h-64 bg-muted/40 animate-pulse rounded-xl" />
          </div>
        </OwnerLayout>
      }
    >
      <InventoryContent />
    </Suspense>
  )
}
