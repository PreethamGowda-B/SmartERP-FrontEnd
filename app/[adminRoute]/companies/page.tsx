"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  Mail,
  User,
  Calendar,
  CreditCard,
  ChevronDown
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Company {
  id: number
  company_id: string
  company_name: string
  owner_id: number
  owner_name: string
  owner_email: string
  plan_name: string
  status: string // 'active', 'suspended'
  created_at: string
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await apiClient("/api/admin/companies")
        setCompanies(data || [])
      } catch (err) {
        console.error("Failed to fetch companies:", err)
        toast.error("Failed to load platform companies")
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    try {
      await apiClient(`/api/admin/companies/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      toast.success(`Company ${newStatus === 'active' ? 're-activated' : 'suspended'}`)
    } catch (err) {
      toast.error("Action not supported or failed")
    }
  }

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = (c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.company_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterStatus === "all" || (c.status || 'active') === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Company Registry</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Manage business organizations on the platform</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
               Platform Total: {companies.length}
             </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text"
              placeholder="Search by company name, ID, or owner email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select 
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm text-slate-900 focus:outline-none focus:border-slate-900 font-bold min-w-[160px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Global Status</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl border border-slate-200 bg-slate-50">
              <Filter className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full rounded-2xl bg-white border border-slate-200 animate-pulse shadow-sm" />
              ))
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-3xl shadow-sm">
                <Building2 className="h-16 w-16 text-slate-200 mx-auto" />
                <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-xs">No matching organizations</p>
              </div>
            ) : (
              filteredCompanies.map((company, i) => (
                <motion.div
                  key={company.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 transition-all duration-300 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                         <Building2 className="h-7 w-7 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{company.company_name}</h3>
                          <span className="text-[10px] font-black px-2 py-1 rounded-md bg-slate-100 text-slate-500 uppercase tracking-tighter border border-slate-200">
                            {company.company_id}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 px-0.5">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                             <User className="h-3 w-3" />
                             <span className="truncate">{company.owner_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                             <Mail className="h-3 w-3" />
                             <span className="truncate">{company.owner_email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Plan & Stats */}
                    <div className="flex items-center gap-8 px-8 lg:border-x border-slate-100 flex-wrap">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Current Plan</span>
                        <div className="flex items-center gap-2">
                           <CreditCard className="h-4 w-4 text-blue-600" />
                           <span className="text-sm font-black text-slate-900 tracking-tight">{company.plan_name || 'Free'}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Member Since</span>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-slate-400" />
                           <span className="text-sm font-bold text-slate-600">{new Date(company.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1 min-w-[120px]">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Service Status</span>
                        <div className="flex items-center gap-1.5">
                           {company.status === 'suspended' ? (
                             <AlertCircle className="h-4 w-4 text-red-600" />
                           ) : (
                             <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                           )}
                           <span className={`text-xs font-black uppercase tracking-tighter ${company.status === 'suspended' ? 'text-red-600' : 'text-emerald-600'}`}>
                             {company.status || 'Active'}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Button 
                        variant="outline" 
                        className={`min-w-[120px] rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all duration-300
                          ${company.status === 'suspended' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' 
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600'}
                        `}
                        onClick={() => toggleStatus(company.id, company.status || 'active')}
                      >
                        {company.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl border border-slate-200">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  )
}
