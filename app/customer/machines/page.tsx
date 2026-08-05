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
import {
  Cpu, Wrench, ShieldCheck, Activity, Calendar, Clock, Plus, Search, CheckCircle2, AlertTriangle, Layers, FileText
} from "lucide-react"
import { CustomerNavbar } from "@/components/customer/layout/CustomerNavbar"

export default function CustomerMachinesPage() {
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Add Machine modal state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    machine_name: "",
    make: "Haas",
    model: "",
    serial_number: "",
    controller_type: "Fanuc 0i-MF",
    spindle_hours: "0",
  })

  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient<{ success: boolean; machines: any[] }>("/api/machines")
      if (res?.machines) {
        setMachines(res.machines)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load registered machines")
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
      // For customer self-registration, user id is customer_id
      const res = await apiClient<{ success: boolean; machine: any }>("/api/machines", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          customer_id: "self",
          spindle_hours: parseInt(formData.spindle_hours) || 0,
        }),
      })
      toast.success("CNC Machine registered successfully!")
      setIsAddOpen(false)
      fetchMachines()
    } catch (err: any) {
      toast.error(err.message || "Failed to register machine")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMachines = machines.filter(
    (m) =>
      m.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Cpu className="h-8 w-8 text-amber-500" /> Customer Machine Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage registered CNC machinery, controller specs, AMC status, and service history
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Register New CNC Machine
        </Button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Total Registered</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{machines.length}</h3>
            </div>
            <Cpu className="h-8 w-8 text-amber-500/80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Operational Health</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {machines.length > 0
                  ? Math.round(machines.reduce((sum, m) => sum + (m.health_score || 100), 0) / machines.length)
                  : 100}
                %
              </h3>
            </div>
            <Activity className="h-8 w-8 text-emerald-500/80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-400">Active Controllers</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {new Set(machines.map((m) => m.controller_type)).size}
              </h3>
            </div>
            <Layers className="h-8 w-8 text-blue-500/80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-400">Under Breakdown</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {machines.filter((m) => m.status === "breakdown").length}
              </h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-rose-500/80" />
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by Machine Name, Serial Number, Make, or Controller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Machine Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading registered machines...</div>
      ) : filteredMachines.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Cpu className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No CNC Machines Found</h3>
          <p className="text-xs text-slate-500">Register your CNC machinery to track maintenance timelines & breakdown history.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((m) => (
            <Card key={m.id} className="hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{m.machine_name}</h3>
                    <p className="text-xs text-slate-500 font-mono">S/N: {m.serial_number}</p>
                  </div>
                  <Badge
                    className={
                      m.status === "breakdown"
                        ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                    }
                  >
                    {m.status === "breakdown" ? "🚨 Breakdown" : "🟢 Operational"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400">Make & Model:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{m.make} {m.model}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Controller:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{m.controller_type}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Health Score:</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{m.health_score || 100}%</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Spindle Hours:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{m.spindle_hours || 0} hrs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> AMC Active
                  </div>
                  <Button variant="ghost" size="sm" className="text-amber-600 font-bold text-xs hover:text-amber-700">
                    View Machine Dashboard →
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Register Machine Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-amber-500" /> Register CNC Machine
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddMachine} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label>Machine Name</Label>
              <Input
                placeholder="e.g. VMC Unit 1 - Spindle 12k"
                value={formData.machine_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, machine_name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Make / Brand</Label>
                <Input
                  placeholder="e.g. Haas, Mazak, Jyoti"
                  value={formData.make}
                  onChange={(e) => setFormData((prev) => ({ ...prev, make: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  placeholder="e.g. VF-2, VMC 850"
                  value={formData.model}
                  onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input
                  placeholder="e.g. SN-2024-8849"
                  value={formData.serial_number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serial_number: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Controller Type</Label>
                <Select
                  value={formData.controller_type}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, controller_type: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Controller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fanuc 0i-MF">Fanuc 0i-MF / 0i-TF</SelectItem>
                    <SelectItem value="Siemens 828D">Siemens 828D / 840D</SelectItem>
                    <SelectItem value="Mitsubishi M80">Mitsubishi M80 / M800</SelectItem>
                    <SelectItem value="Heidenhain TNC 640">Heidenhain TNC 640</SelectItem>
                    <SelectItem value="Other">Other / Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Spindle Working Hours (Approx)</Label>
              <Input
                type="number"
                value={formData.spindle_hours}
                onChange={(e) => setFormData((prev) => ({ ...prev, spindle_hours: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {submitting ? "Registering..." : "Save Machine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}
