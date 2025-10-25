"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"

export interface Employee {
  id: string | number
  name: string
  position: string
  email: string
  phone: string
  status: "active" | "inactive"
  currentJob?: string | null
  hoursThisWeek?: number
  location?: string
  avatar?: string
}

interface EmployeeContextType {
  employees: Employee[]
  addEmployee: (employee: Employee) => Promise<void>
  updateEmployee: (id: string | number, updates: Partial<Employee>) => Promise<void>
  deleteEmployee: (id: string | number) => Promise<void>
  isLoading: boolean
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined)

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isSyncing } = useAuth()

  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smarterp-employees")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [isLoading, setIsLoading] = useState(true)
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function loadEmployees() {
      if (!user) return

      try {
        console.log("[v0] Fetching employees from backend...")
        const serverEmployees = await apiClient("/api/employees", { method: "GET" })
        console.log("[v0] Successfully fetched employees:", serverEmployees)

        if (mounted && Array.isArray(serverEmployees)) {
          const normalized = serverEmployees.map((emp: any) => ({
            id: emp.id?.toString?.() ?? String(emp._db_row?.id ?? emp.id ?? ""),
            name: emp.name ?? emp.fullName ?? "",
            position: emp.position ?? emp.role ?? "",
            email: emp.email ?? "",
            phone: emp.phone ?? "",
            status: emp.status ?? "active",
            currentJob: emp.currentJob ?? null,
            hoursThisWeek: emp.hoursThisWeek ?? 0,
            location: emp.location ?? "Unassigned",
            avatar: emp.avatar ?? "/placeholder.svg",
            ...emp,
          }))

          try {
            const current = JSON.stringify(employees)
            const incoming = JSON.stringify(normalized)
            if (current !== incoming) {
              setEmployees(normalized)
              localStorage.setItem("smarterp-employees", incoming)
            }
          } catch (err) {
            setEmployees(normalized)
            localStorage.setItem("smarterp-employees", JSON.stringify(normalized))
          }
        }
      } catch (err) {
        console.log(
          "[v0] Backend unavailable, using local employees. Error:",
          err instanceof Error ? err.message : String(err),
        )
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    if (!authLoading) {
      if (!hasSyncedRef.current) {
        loadEmployees()
        hasSyncedRef.current = true
      }
      intervalId = setInterval(loadEmployees, 5000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        localStorage.setItem("smarterp-employees", JSON.stringify(employees))
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [employees])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: StorageEvent) => {
      if (e.key === "smarterp-employees") {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue)
            if (Array.isArray(parsed)) {
              setEmployees(parsed)
            }
          }
        } catch (err) {
          console.warn("Failed to parse smarterp-employees from storage event", err)
        }
      }
    }

    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const addEmployee = async (employee: Employee) => {
    setEmployees((prev) => [employee, ...prev])

    try {
      await apiClient("/api/employees", {
        method: "POST",
        body: JSON.stringify(employee),
      })
      console.log("[v0] Employee created on backend")
    } catch (err) {
      console.warn("Failed to persist employee to server, saved locally", err)
    }
  }

  const updateEmployee = async (id: string | number, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp)))

    try {
      await apiClient(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      })
      console.log("[v0] Employee updated on backend")
    } catch (err) {
      console.warn("Failed to update employee on server, update applied locally", err)
    }
  }

  const deleteEmployee = async (id: string | number) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id))

    try {
      await apiClient(`/api/employees/${id}`, { method: "DELETE" })
      console.log("[v0] Employee deleted on backend")
    } catch (err) {
      console.warn("Failed to delete employee on server, deletion applied locally", err)
    }
  }

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        isLoading: authLoading || isSyncing,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  )
}

export function useEmployees() {
  const context = useContext(EmployeeContext)
  if (context === undefined) {
    throw new Error("useEmployees must be used within an EmployeeProvider")
  }
  return context
}
