"use client"

import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

type InventoryItem = {
  id: number
  name: string
  description?: string
  quantity: number
  image_url?: string
  employee_name?: string
  office_name?: string
}

export default function InventoryTable({
  role,
  refreshTrigger = 0,
}: {
  role: "owner" | "employee"
  refreshTrigger?: number
}) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
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
            {filteredItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:bg-accent/5 transition">
                <div className="flex gap-4">
                  {item.image_url && (
                    <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                      <Image
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-base capitalize">{item.name}</h3>
                      {item.quantity <= 1 && (
                        <Badge variant="destructive" className="flex-shrink-0">
                          Low Stock
                        </Badge>
                      )}
                    </div>

                    {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{item.quantity}</span> units
                      </span>
                      {role === "owner" && item.employee_name && (
                        <span className="text-muted-foreground">
                          Employee: <span className="font-semibold text-foreground">{item.employee_name}</span>
                        </span>
                      )}
                      {role === "owner" && item.office_name && (
                        <span className="text-muted-foreground">
                          Office: <span className="font-semibold text-foreground">{item.office_name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
