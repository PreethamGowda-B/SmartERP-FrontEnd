"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Package, Boxes } from "lucide-react"

type InventoryItem = {
  id: number
  name: string
  quantity: number
}

export default function InventoryInsights() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const api = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        const response = await fetch(api + "/api/inventory")
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [api])

  const totalItems = items.length
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const lowStockItems = items.filter((item) => item.quantity <= 1)
  const hasLowStock = lowStockItems.length > 0

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inventory Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Items</span>
            <Package className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{totalItems}</p>
        </div>

        {/* Total Quantity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Quantity</span>
            <Boxes className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-bold">{totalQuantity}</p>
        </div>

        {/* Low Stock Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Low Stock Items</span>
            <AlertCircle className={`h-4 w-4 ${hasLowStock ? "text-destructive" : "text-green-600"}`} />
          </div>
          <p className={`text-2xl font-bold ${hasLowStock ? "text-destructive" : "text-green-600"}`}>
            {lowStockItems.length}
          </p>
        </div>

        {/* Status Message */}
        <div className="pt-4 border-t">
          {hasLowStock ? (
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Low stock alert!</p>
                <div className="mt-2 space-y-1">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground capitalize">{item.name}</span>
                      <Badge variant="destructive" className="text-xs">
                        {item.quantity}
                      </Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <p className="text-xs text-muted-foreground pt-1">+{lowStockItems.length - 3} more</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600">All items sufficiently stocked.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
