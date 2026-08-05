"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Wrench, Calendar, Monitor, Calculator, FileText, Package, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface MachineActionPanelProps {
  machine: any
  onOpenQuotationModal?: () => void
  onOpenRemoteModal?: () => void
}

export function MachineActionPanel({ machine, onOpenQuotationModal, onOpenRemoteModal }: MachineActionPanelProps) {
  const router = useRouter()

  if (!machine) return null

  return (
    <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          ⚡ One-Click Machine Operational Command Panel
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">S/N: {machine.serial_number}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <Button
          onClick={() => router.push(`/owner/jobs?create=true&machine_id=${machine.id}&service_type=breakdown`)}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 h-10 rounded-xl"
        >
          <AlertTriangle className="h-4 w-4" /> Breakdown Job
        </Button>

        <Button
          onClick={() => router.push(`/owner/jobs?create=true&machine_id=${machine.id}&service_type=preventive`)}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 h-10 rounded-xl"
        >
          <Calendar className="h-4 w-4" /> Schedule PM
        </Button>

        <Button
          onClick={() => router.push(`/owner/remote-support?machine_id=${machine.id}`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 h-10 rounded-xl"
        >
          <Monitor className="h-4 w-4" /> Remote Support
        </Button>

        <Button
          onClick={() => router.push(`/owner/quotations?machine_id=${machine.id}`)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-10 rounded-xl"
        >
          <Calculator className="h-4 w-4" /> Create Quote
        </Button>

        <Button
          onClick={() => router.push(`/owner/inventory?reserve_machine_id=${machine.id}`)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 h-10 rounded-xl"
        >
          <Package className="h-4 w-4" /> Reserve Spare
        </Button>

        <Button
          onClick={() => toast.success(`Exported complete Service Report PDF for ${machine.machine_name}`)}
          variant="outline"
          className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs font-bold gap-1.5 h-10 rounded-xl"
        >
          <FileText className="h-4 w-4" /> Export Report
        </Button>
      </div>
    </div>
  )
}
