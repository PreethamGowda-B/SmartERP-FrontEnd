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
  Trash2,
  Mail,
  User,
  Calendar,
  CreditCard,
  ExternalLink,
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
    const matchesSearch = c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.company_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.owner_email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || c.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Company Registry</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium opacity-60">Manage all business organizations on SmartERP</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-accent uppercase tracking-widest leading-none">
               Total: {companies.length}
             </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search by company name, ID, or owner email..."
              className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all placeholder:text-muted-foreground/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none min-w-[140px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full rounded-2xl bg-white/5 animate-pulse border border-white/5" />
              ))
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-muted-foreground mt-4 italic">No companies matching your criteria.</p>
              </div>
            ) : (
              filteredCompanies.map((company, i) => (
                <motion.div
                  key={company.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md hover:border-accent/20 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                         <Building2 className="h-6 w-6 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-white truncate">{company.company_name}</h3>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/5 text-muted-foreground uppercase tracking-tighter">
                            {company.company_id}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                             <User className="h-3 w-3" />
                             <span className="truncate">{company.owner_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                             <Mail className="h-3 w-3" />
                             <span className="truncate">{company.owner_email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Plan & Stats */}
                    <div className="flex items-center gap-8 px-6 lg:border-x border-white/5 flex-wrap">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Current Plan</span>
                        <div className="flex items-center gap-2">
                           <CreditCard className="h-4 w-4 text-accent" />
                           <span className="text-sm font-bold text-white">{company.plan_name || 'Free'}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Registered</span>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-muted-foreground/60" />
                           <span className="text-sm text-white">{new Date(company.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1 min-w-[100px]">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Account Status</span>
                        <div className="flex items-center gap-1.5">
                           {company.status === 'suspended' ? (
                             <AlertCircle className="h-4 w-4 text-red-500" />
                           ) : (
                             <CheckCircle2 className="h-4 w-4 text-green-500" />
                           )}
                           <span className={`text-xs font-bold uppercase ${company.status === 'suspended' ? 'text-red-500' : 'text-green-500'}`}>
                             {company.status || 'Active'}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={`font-bold text-[10px] uppercase tracking-widest rounded-lg border border-white/5
                          ${company.status === 'suspended' ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}
                        `}
                        onClick={() => toggleStatus(company.id, company.status || 'active')}
                      >
                        {company.status === 'suspended' ? 'Re-activate' : 'Suspend'}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white rounded-lg border border-white/5">
                        <MoreVertical className="h-4 w-4" />
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
