"use client"

import { InventoryForm } from "@/components/inventory-form"
import { InventoryList } from "@/components/inventory-list"
import { ClockInOutWidget } from "@/components/clock-in-out-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EmployeeInventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">Manage and track your office stocks and materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Stock Items</CardTitle>
              <InventoryForm />
            </CardHeader>
            <CardContent>
              <InventoryList />
            </CardContent>
          </Card>
        </div>

        <div>
          <ClockInOutWidget />
        </div>
      </div>
    </div>
  )
}
