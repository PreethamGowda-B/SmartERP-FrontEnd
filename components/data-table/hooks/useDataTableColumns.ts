import * as React from "react"
import type { ColumnDef } from "../data-table-types"

interface UseDataTableColumnsProps<TData> {
  columns: ColumnDef<TData>[]
  storageKey?: string
}

export function useDataTableColumns<TData>({
  columns,
  storageKey,
}: UseDataTableColumnsProps<TData>) {
  const [visibleColumnIds, setVisibleColumnIds] = React.useState<string[]>(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        const saved = localStorage.getItem(`dt_cols_${storageKey}`)
        if (saved) return JSON.parse(saved)
      } catch (e) {
        // Fallback to default
      }
    }
    return columns.filter((c) => c.defaultVisible !== false).map((c) => c.id)
  })

  React.useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        localStorage.setItem(`dt_cols_${storageKey}`, JSON.stringify(visibleColumnIds))
      } catch (e) {
        // Ignore write errors
      }
    }
  }, [visibleColumnIds, storageKey])

  const handleToggleColumn = React.useCallback((columnId: string) => {
    setVisibleColumnIds((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    )
  }, [])

  const handleResetColumns = React.useCallback(() => {
    setVisibleColumnIds(columns.filter((c) => c.defaultVisible !== false).map((c) => c.id))
  }, [columns])

  const activeColumns = React.useMemo(
    () => columns.filter((col) => visibleColumnIds.includes(col.id)),
    [columns, visibleColumnIds]
  )

  return {
    visibleColumnIds,
    activeColumns,
    handleToggleColumn,
    handleResetColumns,
  }
}
