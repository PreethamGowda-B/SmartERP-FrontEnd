"use client"

import { useInventory } from "@/contexts/inventory-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2 } from "lucide-react"

export function InventoryList() {
  const { items, deleteItem } = useInventory()

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No inventory items yet. Add your first stock item.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.itemName}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {item.location}
                  </div>
                  <div>
                    <span className="font-medium">Added by:</span> {item.employeeName}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {item.lastUpdated.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
