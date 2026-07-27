"use client"

import * as React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, RefreshCw, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { TableToolbar, type TableDensity } from "@/components/table-toolbar"
import { DataTableColumnToggle } from "./data-table-column-toggle"
import { DataTablePagination } from "./data-table-pagination"
import type { DataTableProps } from "./data-table-types"

// Refactored Modular Hooks
import { useDataTableSorting } from "./hooks/useDataTableSorting"
import { useDataTableFiltering } from "./hooks/useDataTableFiltering"
import { useDataTableSelection } from "./hooks/useDataTableSelection"
import { useDataTableColumns } from "./hooks/useDataTableColumns"

export function EnterpriseDataTable<TData>({
  data = [],
  columns = [],
  getRowId,
  mode = "client",
  searchPlaceholder = "Search records...",
  searchableKey,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  sortColumnId: externalSortColumnId,
  sortDirection: externalSortDirection,
  onSortChange: externalOnSortChange,
  enableRowSelection = false,
  selectedRowIds: externalSelectedRowIds,
  onRowSelectionChange,
  bulkActions,
  renderExpandedRow,
  onRowClick,
  onRowDoubleClick,
  getRowClassName,
  onCellEdit,
  onExportData,
  onExportCSV,
  onExportExcel,
  onExportPDF,
  onPrint,
  isLoading = false,
  isError = false,
  errorMessage = "Failed to load table data.",
  onRetry,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries to display at this time.",
  emptyIcon: EmptyIcon = Layers,
  emptyActionLabel,
  onEmptyAction,
  initialDensity = "normal",
  initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  stickyHeader = true,
  className,
  storageKey,
}: DataTableProps<TData>) {
  // Density State
  const [density, setDensity] = React.useState<TableDensity>(initialDensity)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  // 1. Column Management Hook
  const { visibleColumnIds, activeColumns, handleToggleColumn, handleResetColumns } =
    useDataTableColumns({ columns, storageKey })

  // 2. Search & Filtering Hook
  const { searchQuery, handleSearchChange, filteredData } = useDataTableFiltering({
    data,
    searchableKey,
    externalSearchQuery,
    onSearchChange: externalOnSearchChange,
  })

  // 3. Sorting Hook
  const { sortColumnId, sortDirection, handleSort, sortedData } = useDataTableSorting({
    data: filteredData,
    columns,
    externalSortColumnId,
    externalSortDirection,
    onSortChange: externalOnSortChange,
  })

  // Pagination Slice
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  // Reset to page 1 when search query or page size changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  // 4. Selection Hook
  const {
    selectedIds,
    selectedRows,
    selectedCount,
    isAllPageSelected,
    handleSelectAllPage,
    handleSelectRow,
    clearSelection,
  } = useDataTableSelection({
    data,
    paginatedData,
    getRowId,
    externalSelectedRowIds,
    onRowSelectionChange,
  })

  // Density Padding Classes
  const cellPaddingClass =
    density === "compact"
      ? "py-1.5 px-3 text-xs"
      : density === "comfortable"
      ? "py-4 px-3.5 text-sm"
      : "py-2.5 px-3 text-xs sm:text-sm"

  // Render Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-destructive/5 rounded-xl border border-destructive/20 my-4">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">Error Loading Table</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">{errorMessage}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {/* Top Toolbar */}
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
        density={density}
        onDensityChange={setDensity}
        selectedCount={selectedCount}
        totalCount={sortedData.length}
        onClearSelection={clearSelection}
        onExportCSV={
          onExportCSV
            ? () => onExportCSV(sortedData)
            : onExportData
            ? () => onExportData("csv", sortedData)
            : undefined
        }
        bulkActions={bulkActions ? bulkActions(selectedRows) : undefined}
      >
        <DataTableColumnToggle
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onToggleColumn={handleToggleColumn}
          onResetColumns={handleResetColumns}
        />
      </TableToolbar>

      {/* Main Table Container */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="relative w-full overflow-x-auto">
          <Table className="w-full caption-bottom">
            <TableHeader className={cn("bg-muted/50", stickyHeader && "sticky top-0 z-10")}>
              <TableRow className="hover:bg-transparent border-border/70">
                {enableRowSelection && (
                  <TableHead className="w-10 px-3 text-center">
                    <Checkbox
                      checked={isAllPageSelected}
                      onCheckedChange={handleSelectAllPage}
                      aria-label="Select all rows on page"
                    />
                  </TableHead>
                )}
                {activeColumns.map((col) => {
                  const isSorted = sortColumnId === col.id
                  const canSort = col.enableSorting !== false

                  return (
                    <TableHead
                      key={col.id}
                      className={cn(col.headerClassName)}
                      onClick={canSort ? () => handleSort(col.id) : undefined}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1.5",
                          canSort && "cursor-pointer select-none group hover:text-foreground"
                        )}
                      >
                        <span>{col.header}</span>
                        {canSort && (
                          <span className="text-muted-foreground group-hover:text-foreground">
                            {isSorted ? (
                              sortDirection === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    {enableRowSelection && (
                      <TableCell className="w-10 px-3 text-center">
                        <Skeleton className="h-4 w-4 rounded-sm mx-auto" />
                      </TableCell>
                    )}
                    {activeColumns.map((col) => (
                      <TableCell key={`skel-col-${col.id}`} className={cellPaddingClass}>
                        <Skeleton className="h-4 w-full rounded-xs" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeColumns.length + (enableRowSelection ? 1 : 0)}
                    className="p-0"
                  >
                    <EmptyState
                      icon={EmptyIcon}
                      title={emptyTitle}
                      description={emptyDescription}
                      actionLabel={emptyActionLabel}
                      onAction={onEmptyAction}
                      className="border-0 bg-transparent py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, idx) => {
                  const rowId = getRowId(row)
                  const isSelected = !!selectedIds[rowId]

                  return (
                    <TableRow
                      key={rowId}
                      data-state={isSelected ? "selected" : undefined}
                      className={cn(
                        "transition-colors duration-150",
                        isSelected && "bg-primary/5 dark:bg-primary/10",
                        getRowClassName ? getRowClassName(row, idx) : ""
                      )}
                      onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                      onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row, idx) : undefined}
                    >
                      {enableRowSelection && (
                        <TableCell className="w-10 px-3 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(rowId)}
                            aria-label={`Select row ${rowId}`}
                          />
                        </TableCell>
                      )}
                      {activeColumns.map((col) => {
                        let content: React.ReactNode = null

                        if (col.cell) {
                          content = col.cell(row, idx)
                        } else if (col.accessorKey) {
                          content = (row as any)[col.accessorKey]
                        } else {
                          content = (row as any)[col.id]
                        }

                        return (
                          <TableCell key={col.id} className={cn(cellPaddingClass, col.className)}>
                            {content}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && paginatedData.length > 0 && (
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedData.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={pageSizeOptions}
          />
        )}
      </div>
    </div>
  )
}
