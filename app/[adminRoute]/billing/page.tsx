"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  RefreshCcw,
  Zap
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
  const [searchQuery, setSearchQuery] = useState("")

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

  const filteredCompanies = companies.filter(c => 
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Subscription Command</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Manual overrides for tenant billing & access tiers</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl text-white shadow-xl shadow-slate-900/10">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Active Overrides Enabled</span>
             </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
           <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
             <input 
               type="text"
               placeholder="Filter organizations by name..."
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all font-medium"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           <Button variant="ghost" className="h-11 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest gap-2">
             <Filter className="h-4 w-4" /> Advanced Filters
           </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
           <AnimatePresence mode="popLayout">
              {loading ? (
                <div key="loader" className="space-y-6">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-28 bg-white border border-slate-200 rounded-3xl animate-pulse shadow-sm" />
                  ))}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[2.5rem] shadow-sm"
                >
                   <CreditCard className="h-16 w-16 text-slate-200 mx-auto" />
                   <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-xs">No active subscriptions found</p>
                </motion.div>
              ) : (
                <div key="list" className="space-y-6">
                  {filteredCompanies.map((company, i) => (
                    <motion.div 
                      key={company.id} 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all group relative overflow-hidden"
                    >
                       {/* Decorative side accent */}
                       <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-100 group-hover:bg-slate-900 transition-colors duration-300" />

                       <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
                                <Building2 className="h-8 w-8 text-slate-300 group-hover:text-white transition-colors" />
                             </div>
                             <div className="min-w-0">
                                <h4 className="text-xl font-black text-slate-900 tracking-tight truncate">{company.company_name}</h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                      <Zap className="h-3 w-3" /> {company.plan_name}
                                   </div>
                                   {company.is_on_trial && (
                                      <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                                         <Clock className="h-3 w-3" /> In-Trial
                                      </div>
                                   )}
                                </div>
                             </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Override Plan</label>
                                <div className="relative">
                                   <select 
                                     className="appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-all min-w-[180px]"
                                     value={selectedPlan[company.id] || company.plan_id}
                                     onChange={(e) => setSelectedPlan(prev => ({ ...prev, [company.id]: parseInt(e.target.value) }))}
                                   >
                                      {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} Tier</option>
                                      ))}
                                   </select>
                                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                             </div>

                             <div className="flex items-center gap-3 pt-4 xl:pt-0 self-end">
                                <Button 
                                  variant="outline"
                                  onClick={() => updatePlan(company.id)}
                                  className="h-12 rounded-xl bg-slate-900 text-white border-transparent hover:bg-black font-black text-[11px] uppercase tracking-[0.2em] px-8 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/20"
                                >
                                  Apply Logic
                                </Button>
                                <Button variant="ghost" className="h-12 w-12 p-0 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-900">
                                   <RefreshCcw className="h-5 w-5" />
                                </Button>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  )
}
