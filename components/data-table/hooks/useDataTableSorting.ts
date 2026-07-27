import * as React from "react"
import type { ColumnDef, SortDirection } from "../data-table-types"

interface UseDataTableSortingProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  externalSortColumnId?: string | null
  externalSortDirection?: SortDirection
  onSortChange?: (columnId: string | null, direction: SortDirection) => void
}

export function useDataTableSorting<TData>({
  data,
  columns,
  externalSortColumnId,
  externalSortDirection,
  onSortChange,
}: UseDataTableSortingProps<TData>) {
  const [internalSortColumnId, setInternalSortColumnId] = React.useState<string | null>(null)
  const [internalSortDirection, setInternalSortDirection] = React.useState<SortDirection>(null)

  const sortColumnId = externalSortColumnId ?? internalSortColumnId
  const sortDirection = externalSortDirection ?? internalSortDirection

  const handleSort = React.useCallback(
    (columnId: string) => {
      let newCol: string | null = columnId
      let newDir: SortDirection = "asc"

      if (sortColumnId === columnId) {
        if (sortDirection === "asc") {
          newDir = "desc"
        } else {
          newCol = null
          newDir = null
        }
      }

      if (onSortChange) {
        onSortChange(newCol, newDir)
      } else {
        setInternalSortColumnId(newCol)
        setInternalSortDirection(newDir)
      }
    },
    [sortColumnId, sortDirection, onSortChange]
  )

  const sortedData = React.useMemo(() => {
    if (!sortColumnId || !sortDirection) return data

    const targetCol = columns.find((c) => c.id === sortColumnId)
    if (!targetCol) return data

    return [...data].sort((a: any, b: any) => {
      const valA = targetCol.accessorKey ? a[targetCol.accessorKey] : a[sortColumnId]
      const valB = targetCol.accessorKey ? b[targetCol.accessorKey] : b[sortColumnId]

      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      const comp = valA < valB ? -1 : 1
      return sortDirection === "asc" ? comp : -comp
    })
  }, [data, sortColumnId, sortDirection, columns])

  return {
    sortColumnId,
    sortDirection,
    handleSort,
    sortedData,
  }
}
