"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Edit3, 
  Search,
  Filter,
  ShieldCheck,
  AlertCircle
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CompanySubscription {
  id: number
  company_name: string
  plan_name: string
  plan_id: number
  subscription_expires_at: string
  is_on_trial: boolean
  is_first_login: boolean
}

export default function AdminSubscriptions() {
  const [companies, setCompanies] = useState<CompanySubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<{[key: number]: number}>({})

  const plans = [
    { id: 1, name: 'Free' },
    { id: 2, name: 'Basic' },
    { id: 3, name: 'Pro' }
  ]

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await apiClient("/api/admin/companies")
        setCompanies(data || [])
      } catch (err) {
        toast.error("Failed to load platform data")
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  const updatePlan = async (companyId: number) => {
    const planId = selectedPlan[companyId]
    if (!planId) return

    try {
      await apiClient(`/api/admin/subscriptions/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          plan_id: planId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days
        })
      })
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, plan_id: planId, plan_name: plans.find(p => p.id === planId)?.name || c.plan_name, is_on_trial: false } : c))
      toast.success("Subscription plan updated manually")
    } catch (err) {
      toast.error("Failed to update plan")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Subscription Overrides</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium opacity-60">Manually adjust company plans and billing status</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
           {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)
           ) : companies.map((company) => (
             <div key={company.id} className="p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all border-l-4 border-l-accent/20">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <Building2 className="h-5 w-5 text-white/40" />
                   </div>
                   <div>
                      <h4 className="font-bold text-white">{company.company_name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                         <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                            {company.plan_name}
                         </div>
                         {company.is_on_trial && (
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                               <Clock className="h-3 w-3" /> Trial Mode
                            </span>
                         )}
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                   <select 
                     className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none"
                     value={selectedPlan[company.id] || company.plan_id}
                     onChange={(e) => setSelectedPlan(prev => ({ ...prev, [company.id]: parseInt(e.target.value) }))}
                   >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} Plan</option>
                      ))}
                   </select>

                   <Button 
                     variant="outline"
                     size="sm"
                     className="rounded-xl border-accent/20 text-accent hover:bg-accent/10 font-bold text-[10px] uppercase tracking-widest gap-2"
                     onClick={() => updatePlan(company.id)}
                   >
                     <ShieldCheck className="h-3 w-3" /> Apply Override
                   </Button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </AdminLayout>
  )
}
