"use client"

import * as React from "react"
import { Search, SlidersHorizontal, Download, X, Layers, CheckSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export type TableDensity = "compact" | "normal" | "comfortable"

interface TableToolbarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string
  density?: TableDensity
  onDensityChange?: (density: TableDensity) => void
  selectedCount?: number
  totalCount?: number
  onClearSelection?: () => void
  onExportCSV?: () => void
  bulkActions?: React.ReactNode
  children?: React.ReactNode
}

export function TableToolbar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  density = "normal",
  onDensityChange,
  selectedCount = 0,
  totalCount,
  onClearSelection,
  onExportCSV,
  bulkActions,
  children,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2 mb-3">
      {/* Left side: Search & Filters */}
      <div className="flex flex-1 items-center gap-2 max-w-md">
        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-background border-border/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>

      {/* Right side: Density & Export & Controls */}
      <div className="flex items-center gap-2 justify-end">
        {/* Selected Rows Counter Pill */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-md text-xs font-medium animate-in fade-in duration-200">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>{selectedCount} selected</span>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="ml-1 hover:opacity-80"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Bulk Action Slot */}
        {selectedCount > 0 && bulkActions}

        {/* Density Selector */}
        {onDensityChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Density</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Row Density</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={density}
                onValueChange={(val) => onDensityChange(val as TableDensity)}
              >
                <DropdownMenuRadioItem value="compact" className="text-xs">
                  Compact (36px)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="normal" className="text-xs">
                  Normal (48px)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="comfortable" className="text-xs">
                  Comfortable (60px)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Export CSV Button */}
        {onExportCSV && (
          <Button variant="outline" size="sm" onClick={onExportCSV} className="h-9 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </div>
    </div>
  )
}
