import * as React from "react"

interface UseDataTableSelectionProps<TData> {
  data: TData[]
  paginatedData: TData[]
  getRowId: (row: TData) => string
  externalSelectedRowIds?: Record<string, boolean>
  onRowSelectionChange?: (selectedIds: Record<string, boolean>) => void
}

export function useDataTableSelection<TData>({
  data,
  paginatedData,
  getRowId,
  externalSelectedRowIds,
  onRowSelectionChange,
}: UseDataTableSelectionProps<TData>) {
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<Record<string, boolean>>({})
  const selectedIds = externalSelectedRowIds ?? internalSelectedIds

  const setSelectedIds = React.useCallback(
    (newSelected: Record<string, boolean>) => {
      if (onRowSelectionChange) {
        onRowSelectionChange(newSelected)
      } else {
        setInternalSelectedIds(newSelected)
      }
    },
    [onRowSelectionChange]
  )

  const selectedRows = React.useMemo(
    () => data.filter((row) => selectedIds[getRowId(row)]),
    [data, selectedIds, getRowId]
  )

  const selectedCount = React.useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  )

  const isAllPageSelected = React.useMemo(
    () =>
      paginatedData.length > 0 &&
      paginatedData.every((row) => selectedIds[getRowId(row)]),
    [paginatedData, selectedIds, getRowId]
  )

  const handleSelectAllPage = React.useCallback(() => {
    const next = { ...selectedIds }
    if (isAllPageSelected) {
      paginatedData.forEach((row) => {
        delete next[getRowId(row)]
      })
    } else {
      paginatedData.forEach((row) => {
        next[getRowId(row)] = true
      })
    }
    setSelectedIds(next)
  }, [selectedIds, isAllPageSelected, paginatedData, getRowId, setSelectedIds])

  const handleSelectRow = React.useCallback(
    (rowId: string) => {
      const next = { ...selectedIds }
      if (next[rowId]) {
        delete next[rowId]
      } else {
        next[rowId] = true
      }
      setSelectedIds(next)
    },
    [selectedIds, setSelectedIds]
  )

  const clearSelection = React.useCallback(() => {
    setSelectedIds({})
  }, [setSelectedIds])

  return {
    selectedIds,
    selectedRows,
    selectedCount,
    isAllPageSelected,
    handleSelectAllPage,
    handleSelectRow,
    clearSelection,
  }
}
