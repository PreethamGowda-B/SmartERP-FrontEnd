"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plus, Loader2, Search, Calendar } from "lucide-react"
import { HRLayout } from "@/components/hr-layout"
import { apiClient } from "@/lib/apiClient"
import { ExportButton } from "@/components/export-button"
import { logger } from "@/lib/logger"
import { toast } from "sonner"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function HRPayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [monthFilter, setMonthFilter] = useState("all")
  
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState({
    employee_email: "",
    payroll_month: currentMonth,
    payroll_year: currentYear,
    base_salary: "",
    extra_amount: "0",
    salary_increment: "0",
    deduction: "0",
    remarks: ""
  })

  useEffect(() => {
    fetchPayrolls()
  }, [])

  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      const data = await apiClient("/api/payroll")
      setPayrolls(Array.isArray(data) ? data : [])
    } catch (err) {
      logger.error("Error fetching payrolls:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiClient("/api/payroll", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          base_salary: parseFloat(formData.base_salary),
          extra_amount: parseFloat(formData.extra_amount),
          salary_increment: parseFloat(formData.salary_increment),
          deduction: parseFloat(formData.deduction)
        })
      })
      toast.success("Payroll record created")
      setDialogOpen(false)
      fetchPayrolls()
    } catch (err: any) {
      toast.error(err.message || "Failed to create payroll")
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = payrolls.filter(p => 
    (p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.employee_email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (monthFilter === "all" || p.payroll_month === parseInt(monthFilter))
  )

  return (
    <HRLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payroll Processing</h1>
            <p className="text-muted-foreground mt-1">Manage employee salary disbursements and history.</p>
          </div>
          <div className="flex gap-3">
             <ExportButton 
               filename="Payroll_HR"
               title="HR Payroll Report"
               onExport={async () => payrolls}
               columns={[
                 { header: "Employee", dataKey: "employee_name" },
                 { header: "Total", dataKey: "total_salary" }
               ]}
             />
             <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
               <DialogTrigger asChild>
                 <Button className="gap-2">
                   <Plus className="h-4 w-4" />
                   Generate Payroll
                 </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-[500px]">
                 <DialogHeader>
                   <DialogTitle>New Payroll Entry</DialogTitle>
                 </DialogHeader>
                 <form onSubmit={handleSubmit} className="space-y-4 py-4">
                   <div className="space-y-2">
                     <Label>Employee Email</Label>
                     <Input 
                        value={formData.employee_email} 
                        onChange={e => setFormData({...formData, employee_email: e.target.value})}
                        placeholder="employee@example.com"
                        required
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Month</Label>
                       <Select value={formData.payroll_month.toString()} onValueChange={v => setFormData({...formData, payroll_month: parseInt(v)})}>
                         <SelectTrigger><SelectValue /></SelectTrigger>
                         <SelectContent>
                           {MONTHS.map((m, i) => <SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label>Year</Label>
                       <Input type="number" value={formData.payroll_year} onChange={e => setFormData({...formData, payroll_year: parseInt(e.target.value)})} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label>Base Salary (₹)</Label>
                       <Input type="number" value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: e.target.value})} required />
                     </div>
                     <div className="space-y-2">
                       <Label>Deductions (₹)</Label>
                       <Input type="number" value={formData.deduction} onChange={e => setFormData({...formData, deduction: e.target.value})} />
                     </div>
                   </div>
                   <Button type="submit" className="w-full" disabled={submitting}>
                     {submitting ? "Processing..." : "Generate Slip"}
                   </Button>
                 </form>
               </DialogContent>
             </Dialog>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search by employee..." 
               value={searchTerm} 
               onChange={e => setSearchTerm(e.target.value)} 
               className="pl-10"
             />
           </div>
           <Select value={monthFilter} onValueChange={setMonthFilter}>
             <SelectTrigger className="w-48"><SelectValue placeholder="Filter Month" /></SelectTrigger>
             <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {MONTHS.map((m, i) => <SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}
             </SelectContent>
           </Select>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Payroll History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {loading ? (
               <div className="p-8 text-center text-muted-foreground">Loading payroll records...</div>
             ) : (
               <div className="divide-y">
                 {filtered.map((p) => (
                   <div key={p.id} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className="p-2 bg-green-500/10 rounded-lg">
                         <DollarSign className="h-5 w-5 text-green-500" />
                       </div>
                       <div>
                         <p className="font-semibold">{p.employee_name}</p>
                         <p className="text-xs text-muted-foreground">{MONTHS[p.payroll_month-1]} {p.payroll_year}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-lg font-bold">₹{parseFloat(p.total_salary).toLocaleString()}</p>
                       <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">Processed</Badge>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  )
}
