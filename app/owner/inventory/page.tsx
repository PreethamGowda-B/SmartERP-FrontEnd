"use client"

import { useInventory } from "@/contexts/inventory-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, User } from "lucide-react"

export default function OwnerInventoryPage() {
  const { items, isLoading } = useInventory()

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueItems = new Set(items.map((item) => item.itemName)).size
  const employees = new Set(items.map((item) => item.employeeId)).size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor all employee stocks and materials across offices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold">{totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Item Types</p>
                <p className="text-3xl font-bold">{uniqueItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-3xl font-bold">{employees}</p>
              </div>
              <User className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No inventory items yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Item Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold">Location</th>
                    <th className="text-left py-3 px-4 font-semibold">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{item.employeeName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {item.quantity} {item.unit}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{item.location}</td>
                      <td className="py-3 px-4 text-sm">{item.lastUpdated.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
