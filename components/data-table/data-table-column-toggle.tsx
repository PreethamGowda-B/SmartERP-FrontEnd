"use client"

import * as React from "react"
import { SlidersHorizontal, Bookmark, Plus, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { ColumnDef, SavedView } from "./data-table-types"

interface DataTableColumnToggleProps<TData> {
  columns: ColumnDef<TData>[]
  visibleColumnIds: string[]
  onToggleColumn: (columnId: string) => void
  onResetColumns: () => void
  storageKey?: string
}

export function DataTableColumnToggle<TData>({
  columns,
  visibleColumnIds,
  onToggleColumn,
  onResetColumns,
  storageKey,
}: DataTableColumnToggleProps<TData>) {
  const [savedViews, setSavedViews] = React.useState<SavedView[]>(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        const saved = localStorage.getItem(`dt_views_${storageKey}`)
        if (saved) return JSON.parse(saved)
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "default",
        name: "Default View",
        visibleColumnIds,
        density: "normal",
        pageSize: 10,
        isDefault: true,
      },
    ]
  })

  const [newViewName, setNewViewName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const handleSaveView = () => {
    if (!newViewName.trim()) return
    const view: SavedView = {
      id: String(Date.now()),
      name: newViewName.trim(),
      visibleColumnIds: [...visibleColumnIds],
      density: "normal",
      pageSize: 10,
    }
    const next = [...savedViews, view]
    setSavedViews(next)
    if (typeof window !== "undefined" && storageKey) {
      try {
        localStorage.setItem(`dt_views_${storageKey}`, JSON.stringify(next))
      } catch (e) {}
    }
    setNewViewName("")
    setIsCreating(false)
  }

  const handleDeleteView = (id: string, e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.stopPropagation()
    const next = savedViews.filter((v) => v.id !== id)
    setSavedViews(next)
    if (typeof window !== "undefined" && storageKey) {
      try {
        localStorage.setItem(`dt_views_${storageKey}`, JSON.stringify(next))
      } catch (e) {}
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Views & Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Saved Layout Views</DropdownMenuLabel>
        <DropdownMenuGroup>
          {savedViews.map((view) => (
            <DropdownMenuItem
              key={view.id}
              className="text-xs flex items-center justify-between cursor-pointer"
              onClick={() => {
                view.visibleColumnIds.forEach((id) => {
                  if (!visibleColumnIds.includes(id)) onToggleColumn(id)
                })
              }}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Bookmark className="h-3 w-3 text-primary" />
                <span className="truncate">{view.name}</span>
              </div>
              {!view.isDefault && (
                <Trash2
                  className="h-3 w-3 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e: React.MouseEvent<SVGSVGElement, MouseEvent>) => handleDeleteView(view.id, e)}
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        {isCreating ? (
          <div className="p-2 border-t space-y-1.5">
            <Input
              placeholder="View name..."
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-[10px] flex-1 px-2" onClick={handleSaveView}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-2"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            className="text-xs cursor-pointer text-primary"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Save Current View
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
        {columns
          .filter((col) => col.enableHiding !== false)
          .map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              className="text-xs capitalize"
              checked={visibleColumnIds.includes(col.id)}
              onCheckedChange={() => onToggleColumn(col.id)}
            >
              {col.header}
            </DropdownMenuCheckboxItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs cursor-pointer text-muted-foreground" onClick={onResetColumns}>
          <RotateCcw className="h-3 w-3 mr-1.5" /> Restore Default Columns
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
