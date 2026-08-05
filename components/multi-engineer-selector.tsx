"use client"

import React, { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserCheck, Shield } from "lucide-react"

interface MultiEngineerSelectorProps {
  employees: any[]
  assignedTeam: { role: string; user_id: string; name: string }[]
  onChange: (team: { role: string; user_id: string; name: string }[]) => void
}

export function MultiEngineerSelector({ employees, assignedTeam = [], onChange }: MultiEngineerSelectorProps) {
  const ROLES = [
    { key: "lead", label: "👑 Lead Engineer" },
    { key: "assistant", label: "🔧 Assistant Engineer" },
    { key: "electrical", label: "⚡ Electrical Specialist" },
    { key: "plc", label: "💻 PLC & Software Engineer" },
    { key: "mechanical", label: "⚙️ Mechanical Specialist" },
  ]

  const handleSelect = (roleKey: string, userId: string) => {
    const selectedEmp = employees.find((e) => String(e.id) === userId)
    const existingFiltered = assignedTeam.filter((item) => item.role !== roleKey)

    if (!userId || userId === "none") {
      onChange(existingFiltered)
    } else {
      onChange([...existingFiltered, { role: roleKey, user_id: userId, name: selectedEmp?.name || "Engineer" }])
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
      <div className="font-semibold text-xs text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
        <Users className="h-4 w-4" /> Multi-Engineer Service Team Assignment (#34)
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ROLES.map((r) => {
          const currentAssignee = assignedTeam.find((item) => item.role === r.key)
          return (
            <div key={r.key} className="space-y-1">
              <Label className="text-xs">{r.label}</Label>
              <Select
                value={currentAssignee?.user_id || "none"}
                onValueChange={(val) => handleSelect(r.key, val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={`Select ${r.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name} ({emp.position || "Technician"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
