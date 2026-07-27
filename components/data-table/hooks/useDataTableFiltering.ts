import * as React from "react"

interface UseDataTableFilteringProps<TData> {
  data: TData[]
  searchableKey?: keyof TData | string
  externalSearchQuery?: string
  onSearchChange?: (query: string) => void
}

export function useDataTableFiltering<TData>({
  data,
  searchableKey,
  externalSearchQuery,
  onSearchChange,
}: UseDataTableFilteringProps<TData>) {
  const [internalSearchQuery, setInternalSearchQuery] = React.useState("")
  const searchQuery = externalSearchQuery ?? internalSearchQuery

  const handleSearchChange = React.useCallback(
    (query: string) => {
      if (onSearchChange) {
        onSearchChange(query)
      } else {
        setInternalSearchQuery(query)
      }
    },
    [onSearchChange]
  )

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase().trim()
    return data.filter((row: any) => {
      if (searchableKey && row[searchableKey] !== undefined) {
        return String(row[searchableKey]).toLowerCase().includes(query)
      }
      return Object.values(row).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(query)
      )
    })
  }, [data, searchQuery, searchableKey])

  return {
    searchQuery,
    handleSearchChange,
    filteredData,
  }
}
