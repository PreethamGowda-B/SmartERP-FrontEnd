"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

export interface InventoryItem {
  id: string
  employeeId: string
  employeeName: string
  itemName: string
  description: string
  quantity: number
  unit: string
  location: string
  dateAdded: Date
  lastUpdated: Date
}

interface InventoryContextType {
  items: InventoryItem[]
  addItem: (item: Omit<InventoryItem, "id" | "dateAdded" | "lastUpdated">) => void
  updateItem: (id: string, updates: Partial<InventoryItem>) => void
  deleteItem: (id: string) => void
  getEmployeeInventory: (employeeId: string) => InventoryItem[]
  isLoading: boolean
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: "inv-1",
      employeeId: "emp-1",
      employeeName: "John Doe",
      itemName: "Safety Helmets",
      description: "Yellow safety helmets for construction site",
      quantity: 15,
      unit: "pieces",
      location: "Office A - Storage Room",
      dateAdded: new Date("2024-01-15"),
      lastUpdated: new Date("2024-01-20"),
    },
    {
      id: "inv-2",
      employeeId: "emp-2",
      employeeName: "Jane Smith",
      itemName: "Cement Bags",
      description: "Portland cement 50kg bags",
      quantity: 45,
      unit: "bags",
      location: "Warehouse B",
      dateAdded: new Date("2024-01-10"),
      lastUpdated: new Date("2024-01-22"),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  // Sync inventory from backend
  useEffect(() => {
    const syncInventory = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        // In production, fetch from backend API
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory`)
        // const data = await response.json()
        // setItems(data)
      } catch (error) {
        console.log("[v0] Using local inventory data")
      } finally {
        setIsLoading(false)
      }
    }

    syncInventory()
  }, [user])

  const addItem = (item: Omit<InventoryItem, "id" | "dateAdded" | "lastUpdated">) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      dateAdded: new Date(),
      lastUpdated: new Date(),
    }
    setItems((prev) => [...prev, newItem])

    // Persist to backend
    ;(async () => {
      try {
        // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory`, {
        //   method: 'POST',
        //   body: JSON.stringify(newItem),
        //   credentials: 'include'
        // })
      } catch (error) {
        console.log("[v0] Failed to sync inventory to backend")
      }
    })()
  }

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates, lastUpdated: new Date() } : item)))

    // Persist to backend
    ;(async () => {
      try {
        // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify(updates),
        //   credentials: 'include'
        // })
      } catch (error) {
        console.log("[v0] Failed to sync inventory update to backend")
      }
    })()
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))

    // Persist to backend
    ;(async () => {
      try {
        // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${id}`, {
        //   method: 'DELETE',
        //   credentials: 'include'
        // })
      } catch (error) {
        console.log("[v0] Failed to sync inventory deletion to backend")
      }
    })()
  }

  const getEmployeeInventory = (employeeId: string) => {
    return items.filter((item) => item.employeeId === employeeId)
  }

  return (
    <InventoryContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        getEmployeeInventory,
        isLoading,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider")
  }
  return context
}
