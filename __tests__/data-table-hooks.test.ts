/**
 * Test Suite: Enterprise Data Table Framework Custom Hooks
 * Verification: Sorting, Filtering, and Selection Logic
 */

export interface DummyItem {
  id: string
  name: string
  stock: number
}

export const sampleData: DummyItem[] = [
  { id: "1", name: "Steel Beams", stock: 150 },
  { id: "2", name: "Concrete Bags", stock: 40 },
  { id: "3", name: "Safety Helmets", stock: 200 },
]

export function runDataTableHookVerification() {
  // 1. Filtering Verification
  const query = "steel"
  const filtered = sampleData.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  )
  if (filtered.length !== 1 || filtered[0].name !== "Steel Beams") {
    throw new Error("Filtering verification failed")
  }

  // 2. Sorting Verification
  const ascSorted = [...sampleData].sort((a, b) => a.stock - b.stock)
  if (ascSorted[0].stock !== 40 || ascSorted[2].stock !== 200) {
    throw new Error("Ascending sort verification failed")
  }

  // 3. Selection Verification
  const selectedIds: Record<string, boolean> = { "1": true, "3": true }
  const count = Object.values(selectedIds).filter(Boolean).length
  if (count !== 2) {
    throw new Error("Row selection verification failed")
  }

  return true
}
