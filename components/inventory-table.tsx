"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Edit, Archive, Trash2, Package } from "lucide-react"
import { getAccessToken } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"
import { EnterpriseDataTable } from "@/components/data-table/enterprise-data-table"
import type { ColumnDef } from "@/components/data-table/data-table-types"

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
  onEdit,
}: {
  role: "owner" | "employee"
  refreshTrigger?: number
  onItemsChange?: (items: InventoryItem[]) => void
  onEdit?: (item: InventoryItem) => void
}) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const api = process.env.NEXT_PUBLIC_API_URL || ""
  const onItemsChangeRef = useRef(onItemsChange)
  useEffect(() => { onItemsChangeRef.current = onItemsChange }, [onItemsChange])

  // Helper function to get full image URL
  const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return null
    // If it's already a full URL (Cloudinary), return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    // Otherwise, prepend backend URL for local uploads
    return `${api}/${imageUrl}`
  }

  const categoryColors: Record<string, string> = {
    "Raw Materials": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Finished Goods": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Tools": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "Supplies": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "Uncategorized": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)

      const token = getAccessToken()
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
      onItemsChangeRef.current?.(itemsData)
    } catch (err) {
      logger.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [api]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchItems()
  }, [fetchItems, refreshTrigger])

  const handleEdit = (item: InventoryItem) => {
    onEdit?.(item)
  }

  const handleArchive = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to archive "${item.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`${api}/api/inventory/${item.id}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        },
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to archive")
      }

      alert("Item archived successfully")
      fetchItems() // Refresh the list
    } catch (err) {
      logger.error(err)
      alert(err instanceof Error ? err.message : "Error archiving item")
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = getAccessToken()
      const response = await fetch(`${api}/api/inventory/${item.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete")
      }

      alert("Item deleted successfully")
      fetchItems() // Refresh the list
    } catch (err) {
      logger.error(err)
      alert(err instanceof Error ? err.message : "Error deleting item")
    }
  }

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        id: "image",
        header: "Image",
        enableSorting: false,
        enableHiding: false,
        cell: (item) => {
          const url = getImageUrl(item.image_url)
          return url ? (
            <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden relative border border-border/60">
              <Image src={url} alt={item.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold">
              {item.name.slice(0, 2).toUpperCase()}
            </div>
          )
        },
      },
      {
        id: "name",
        header: "Item Name",
        accessorKey: "name",
        enableSorting: true,
        cell: (item) => (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground capitalize">{item.name}</span>
              {item.category && (
                <Badge className={cn("text-[10px] px-1.5 py-0 font-medium", categoryColors[item.category] || categoryColors["Uncategorized"])}>
                  {item.category}
                </Badge>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
            )}
          </div>
        ),
      },
      {
        id: "quantity",
        header: "Stock Level",
        accessorKey: "quantity",
        enableSorting: true,
        cell: (item) => {
          const isLowStock = item.min_quantity && item.quantity < item.min_quantity
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{item.quantity}</span>
              <span className="text-xs text-muted-foreground">{item.unit || "units"}</span>
              {isLowStock && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Low Stock
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: "min_quantity",
        header: "Min Target",
        accessorKey: "min_quantity",
        enableSorting: true,
        cell: (item) => item.min_quantity || "—",
      },
      {
        id: "supplier",
        header: "Supplier",
        accessorKey: "supplier_name",
        enableSorting: true,
        cell: (item) => item.supplier_name || "—",
      },
      ...(role === "owner"
        ? [
            {
              id: "added_by",
              header: "Added By",
              accessorKey: "employee_name",
              enableSorting: true,
              cell: (item: InventoryItem) => item.employee_name || "—",
            },
          ]
        : []),
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableHiding: false,
        headerClassName: "text-right",
        cell: (item) => (
          <div className="flex items-center gap-1.5 justify-end">
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => handleEdit(item)}>
              <Edit className="h-3 w-3 mr-1" /> Edit
            </Button>
            {role === "owner" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={() => handleArchive(item)}
              >
                <Archive className="h-3 w-3 mr-1" /> Archive
              </Button>
            )}
          </div>
        ),
      },
    ],
    [role, handleEdit, handleArchive, categoryColors, getImageUrl]
  )

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <EnterpriseDataTable<InventoryItem>
          data={items}
          columns={columns}
          getRowId={(item) => String(item.id)}
          searchPlaceholder="Search inventory items, suppliers, descriptions..."
          searchableKey="name"
          isLoading={loading}
          storageKey="inventory_table"
          emptyTitle="No inventory items"
          emptyDescription={items.length === 0 ? "No inventory items recorded yet." : "No items match your search term."}
          emptyIcon={Package}
        />
      </CardContent>
    </Card>
  )
}
