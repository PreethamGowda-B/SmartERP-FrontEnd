"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import customerApi from "@/lib/customerApi"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CustomerNavbar } from "@/components/customer/layout/CustomerNavbar"
import { Cpu, ArrowRight } from "lucide-react"

export default function CustomerOnboardingWizardPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    machine_name: "",
    serial_number: "",
    make: "",
    model: "",
    controller_type: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await customerApi.post("/api/customer/machines", {
        machine_name: formData.machine_name.trim(),
        serial_number: formData.serial_number.trim(),
        make: formData.make.trim() || undefined,
        model: formData.model.trim() || undefined,
        controller_type: formData.controller_type.trim() || undefined,
      })
      toast.success("CNC Fleet Machine registered successfully!")
      router.push("/customer/machines")
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to register machine")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-7 sm:px-6 lg:py-9">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.11em] text-blue-700 dark:text-blue-300"><Cpu className="h-4 w-4" />Machine setup</div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Register a CNC machine</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Save the machine details your service team needs to identify equipment on future requests.</p>
      </div>

      <Card className="rounded-2xl border-slate-200 p-5 shadow-sm dark:border-slate-800 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
              <Label htmlFor="machine_name">Machine name <span className="text-rose-600">*</span></Label>
            <Input
                id="machine_name"
              placeholder="e.g. VMC Unit 1 - Shop Floor A"
              value={formData.machine_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, machine_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial number <span className="text-rose-600">*</span></Label>
              <Input
                id="serial_number"
                placeholder="e.g. AM-2024-8842"
                value={formData.serial_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, serial_number: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="controller_type">Controller type</Label>
              <Select
                value={formData.controller_type}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, controller_type: val }))}
              >
                <SelectTrigger id="controller_type">
                  <SelectValue placeholder="Select if known" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fanuc 0i-MF">Fanuc 0i-MF</SelectItem>
                  <SelectItem value="Siemens 828D">Siemens 828D</SelectItem>
                  <SelectItem value="Mitsubishi M80">Mitsubishi M80</SelectItem>
                  <SelectItem value="Other">Other / custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="machine_make">Make / brand</Label>
              <Input id="machine_make" placeholder="Enter manufacturer" value={formData.make} onChange={(e) => setFormData((prev) => ({ ...prev, make: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="machine_model">Model</Label>
              <Input id="machine_model" placeholder="Enter model" value={formData.model} onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))} />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="mt-4 w-full gap-2 bg-blue-600 font-bold text-white hover:bg-blue-700">
            {submitting ? "Registering machine…" : "Save machine"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </Card>
      </main>
    </div>
  )
}
