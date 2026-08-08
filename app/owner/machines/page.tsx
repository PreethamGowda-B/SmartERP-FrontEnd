"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Cpu, Wrench, ShieldCheck, Activity, Calendar, Clock, Plus, Search, CheckCircle2, AlertTriangle, Layers, ExternalLink, RefreshCw
} from "lucide-react"

export default function OwnerMachineRegistryPage() {
  const router = useRouter()
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Add Machine modal state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    machine_name: "",
    make: "Haas",
    model: "VMC-850",
    serial_number: "",
    controller_type: "Fanuc 0i-MF",
    spindle_hours: "0",
  })

  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; machines: any[] }>("/api/machines")
      setMachines(res.machines || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load CNC machine registry")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMachines()
  }, [fetchMachines])

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiClient.post("/api/machines", {
        ...formData,
        spindle_hours: parseInt(formData.spindle_hours) || 0,
      })
      toast.success("CNC Machine registered successfully!")
      setIsAddOpen(false)
      fetchMachines()
    } catch (err: any) {
      toast.error(err.message || "Failed to register CNC machine")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      (m.machine_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.serial_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.make || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "breakdown" && m.status === "breakdown") ||
      (statusFilter === "operational" && (m.status === "operational" || !m.status))

    return matchesSearch && matchesStatus
  })

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Cpu className="h-8 w-8 text-amber-500" /> Machine Registry & Telemetry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise fleet oversight: registered CNC machinery, controller specs, health scores, and active service histories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fetchMachines()} variant="outline" className="font-bold text-xs gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
            <Plus className="h-4 w-4" /> Register CNC Machine
          </Button>
        </div>
      </div>

      {/* Analytics Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Total Machinery</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{machines.length} Units</h3>
            </div>
            <Cpu className="h-8 w-8 text-amber-500/80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Fleet Health Index</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {machines.length > 0
                  ? Math.round(machines.reduce((sum, m) => sum + (m.health_score || 100), 0) / machines.length)
                  : 100}%
              </h3>
            </div>
            <Activity className="h-8 w-8 text-emerald-500/80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-400">Controllers Tracked</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {new Set(machines.map((m) => m.controller_type)).size} Types
              </h3>
            </div>
            <Layers className="h-8 w-8 text-blue-500/80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-400">Breakdown Alerts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {machines.filter((m) => m.status === "breakdown").length} Active
              </h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-rose-500/80" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search machine, serial #, controller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="text-xs font-bold"
          >
            All ({machines.length})
          </Button>
          <Button
            variant={statusFilter === "operational" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("operational")}
            className="text-xs font-bold"
          >
            Operational ({machines.filter((m) => m.status !== "breakdown").length})
          </Button>
          <Button
            variant={statusFilter === "breakdown" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("breakdown")}
            className="text-xs font-bold text-rose-600 border-rose-300"
          >
            Breakdowns ({machines.filter((m) => m.status === "breakdown").length})
          </Button>
        </div>
      </div>

      {/* Machine Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading CNC Machine Registry...</div>
      ) : filteredMachines.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Cpu className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold">No Machines Found</h3>
          <p className="text-xs text-slate-500">No CNC machinery matching search filters registered yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((machine) => (
            <Card key={machine.id} className="p-5 hover:shadow-lg transition-all border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      {machine.machine_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">S/N: {machine.serial_number}</p>
                    {machine.customer_name && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        Customer: {machine.customer_name}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={
                      machine.status === "breakdown"
                        ? "bg-rose-600 text-white font-bold"
                        : "bg-emerald-600 text-white font-bold"
                    }
                  >
                    {machine.status === "breakdown" ? "🚨 Breakdown" : "🟢 Operational"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Controller</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{machine.controller_type || "Fanuc"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Make / Model</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{machine.make} {machine.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Spindle Hours</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{machine.spindle_hours || 0} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Health Score</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{machine.health_score || 100}%</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push(`/owner/machines/${machine.id}`)}
                variant="outline"
                className="w-full text-xs font-bold gap-1.5 bg-slate-50 dark:bg-slate-900"
              >
                View Machine Dashboard <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Register Machine Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-amber-500" /> Register CNC Machine
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddMachine} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Machine Name / Tag *</Label>
              <Input
                required
                placeholder="e.g. VMC 850 Spindle Line #1"
                value={formData.machine_name}
                onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Make</Label>
                <Input
                  placeholder="e.g. Haas, BFW, Mazak"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  placeholder="e.g. VMC-850"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Serial Number *</Label>
              <Input
                required
                placeholder="e.g. SN-8849201"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Controller Type</Label>
                <Select
                  value={formData.controller_type}
                  onValueChange={(val) => setFormData({ ...formData, controller_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fanuc 0i-MF">Fanuc 0i-MF</SelectItem>
                    <SelectItem value="Siemens 828D">Siemens 828D</SelectItem>
                    <SelectItem value="Heidenhain TNC 640">Heidenhain TNC 640</SelectItem>
                    <SelectItem value="Mitsubishi M80">Mitsubishi M80</SelectItem>
                    <SelectItem value="Haas NGC">Haas NGC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Spindle Hours</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.spindle_hours}
                  onChange={(e) => setFormData({ ...formData, spindle_hours: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {submitting ? "Registering..." : "Register Machine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
