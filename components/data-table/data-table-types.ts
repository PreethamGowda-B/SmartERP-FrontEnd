import type * as React from "react"
import type { TableDensity } from "@/components/table-toolbar"

export type SortDirection = "asc" | "desc" | null
export type ExportFormat = "csv" | "excel" | "pdf" | "print"

export interface ColumnDef<TData> {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof TData | string
  cell?: (row: TData, index: number) => React.ReactNode
  enableSorting?: boolean
  enableHiding?: boolean
  defaultVisible?: boolean
  pinned?: "left" | "right"
  width?: number | string
  minWidth?: number
  maxWidth?: number
  className?: string
  headerClassName?: string
}

export interface SavedView {
  id: string
  name: string
  density: TableDensity
  visibleColumnIds: string[]
  sortColumnId?: string
  sortDirection?: SortDirection
  pageSize: number
  isDefault?: boolean
}

export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  getRowId: (row: TData) => string
  mode?: "client" | "server"
  
  // Search & Filters
  searchPlaceholder?: string
  searchableKey?: keyof TData | string
  searchQuery?: string
  onSearchChange?: (query: string) => void
  
  // Sorting (Client / Server)
  sortColumnId?: string | null
  sortDirection?: SortDirection
  onSortChange?: (columnId: string | null, direction: SortDirection) => void

  // Selection & Bulk Actions
  enableRowSelection?: boolean
  selectedRowIds?: Record<string, boolean>
  onRowSelectionChange?: (selectedIds: Record<string, boolean>) => void
  bulkActions?: (selectedRows: TData[]) => React.ReactNode

  // Row Expansion & Row Actions
  renderExpandedRow?: (row: TData) => React.ReactNode
  onRowClick?: (row: TData, index: number) => void
  onRowDoubleClick?: (row: TData, index: number) => void
  getRowClassName?: (row: TData, index: number) => string
  onCellEdit?: (row: TData, columnId: string, newValue: any) => Promise<void> | void

  // Export Engine Hooks
  onExportData?: (format: ExportFormat, data: TData[]) => void
  onExportCSV?: (data: TData[]) => void
  onExportExcel?: (data: TData[]) => void
  onExportPDF?: (data: TData[]) => void
  onPrint?: (data: TData[]) => void

  // State Management
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  
  // Empty State
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ElementType
  emptyActionLabel?: string
  onEmptyAction?: () => void

  // Saved Views & Display
  initialDensity?: TableDensity
  initialPageSize?: number
  pageSizeOptions?: number[]
  savedViews?: SavedView[]
  activeViewId?: string
  onSelectView?: (viewId: string) => void
  onSaveView?: (view: SavedView) => void
  stickyHeader?: boolean
  className?: string
  storageKey?: string // for persisting column visibility & density in localStorage
}

// Developer Experience: Column Helper utility
export function createColumnHelper<TData>() {
  return {
    accessor: <K extends keyof TData>(
      accessorKey: K,
      column: Omit<ColumnDef<TData>, "id" | "accessorKey"> & { id?: string }
    ): ColumnDef<TData> => ({
      id: column.id || String(accessorKey),
      accessorKey,
      ...column,
    }),
    display: (
      column: ColumnDef<TData>
    ): ColumnDef<TData> => column,
  }
}
