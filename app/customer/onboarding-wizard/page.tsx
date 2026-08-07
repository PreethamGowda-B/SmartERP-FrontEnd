"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CustomerNavbar } from "@/components/customer/layout/CustomerNavbar"
import { Cpu, CheckCircle2, ArrowRight } from "lucide-react"

export default function CustomerOnboardingWizardPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    machine_name: "",
    serial_number: "",
    make: "Ace Micromatic",
    model: "VMC 850",
    controller_type: "Fanuc 0i-MF",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiClient("/api/machines", {
        method: "POST",
        body: JSON.stringify(formData),
      })
      toast.success("CNC Fleet Machine registered successfully!")
      router.push("/customer/machines")
    } catch (err: any) {
      toast.error(err.message || "Failed to register machine")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <div className="container max-w-3xl mx-auto p-6 space-y-6">
      <div className="border-b pb-5">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Cpu className="h-8 w-8 text-emerald-500" /> Customer CNC Fleet Self-Service Onboarding
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register your CNC machinery fleet into the SmartERP Customer Portal in under 2 minutes
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Machine Identifier / Name</Label>
            <Input
              placeholder="e.g. VMC Unit 1 - Shop Floor A"
              value={formData.machine_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, machine_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input
                placeholder="e.g. AM-2024-8842"
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
                  <SelectValue placeholder="Controller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fanuc 0i-MF">Fanuc 0i-MF</SelectItem>
                  <SelectItem value="Siemens 828D">Siemens 828D</SelectItem>
                  <SelectItem value="Mitsubishi M80">Mitsubishi M80</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 mt-4">
            {submitting ? "Registering Machine..." : "Register CNC Machine Fleet Unit"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
    </div>
  )
}
