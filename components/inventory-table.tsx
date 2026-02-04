"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Edit, Archive, Trash2 } from "lucide-react"

type InventoryItem = {
  id: number
  name: string
  description?: string
  quantity: number
  category?: string
  unit?: string
  min_quantity?: number
  supplier_name?: string
  supplier_contact?: string
  supplier_email?: string
  image_url?: string
  employee_name?: string
  office_name?: string
  is_deleted?: boolean
}

export default function InventoryTable({
  role,
  refreshTrigger = 0,
  onItemsChange,
}: {
  role: "owner" | "employee"
  refreshTrigger?: number
  onItemsChange?: (items: InventoryItem[]) => void
}) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const api = process.env.NEXT_PUBLIC_API_URL || ""

  const categoryColors: Record<string, string> = {
    "Raw Materials": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Finished Goods": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Tools": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Supplies": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Uncategorized": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        // Get token from localStorage
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

        const response = await fetch(api + "/api/inventory", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        })

        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        const itemsData = Array.isArray(data) ? data : []
        setItems(itemsData)
        onItemsChange?.(itemsData)
      } catch (err) {
        console.error(err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [api, refreshTrigger])

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.employee_name?.toLowerCase().includes(term) ||
        item.office_name?.toLowerCase().includes(term),
    )
  }, [items, searchTerm])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading inventory...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Inventory List</CardTitle>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            {items.length === 0 ? "No inventory items yet" : "No items match your search"}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isLowStock = item.min_quantity && item.quantity < item.min_quantity
              const stockPercentage = item.min_quantity ? (item.quantity / item.min_quantity) * 100 : 100

              return (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-accent/5 transition">
                  <div className="flex gap-4">
                    {item.image_url && (
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground text-base capitalize">{item.name}</h3>
                          {item.category && (
                            <Badge className={categoryColors[item.category] || categoryColors["Uncategorized"]}>
                              {item.category}
                            </Badge>
                          )}
                          {isLowStock && (
                            <Badge variant="destructive" className="flex-shrink-0">
                              Low Stock
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {role === "owner" && (
                            <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive">
                              <Archive className="h-3 w-3 mr-1" />
                              Archive
                            </Button>
                          )}
                        </div>
                      </div>

                      {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{item.quantity}</span> {item.unit || "units"}
                        </span>
                        {item.min_quantity && item.min_quantity > 0 && (
                          <span className="text-muted-foreground">
                            Min: <span className="font-semibold text-foreground">{item.min_quantity}</span>
                          </span>
                        )}
                        {item.supplier_name && (
                          <span className="text-muted-foreground">
                            Supplier: <span className="font-semibold text-foreground">{item.supplier_name}</span>
                          </span>
                        )}
                        {role === "owner" && item.employee_name && (
                          <span className="text-muted-foreground">
                            Added by: <span className="font-semibold text-foreground">{item.employee_name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
