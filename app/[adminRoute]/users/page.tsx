"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Search, 
  Mail, 
  Shield, 
  Lock, 
  UserX, 
  Building,
  MoreVertical,
  Key,
  ChevronDown,
  Filter
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface User {
  id: number
  name: string
  email: string
  role: string
  company_id: number
  company_name: string
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiClient("/api/admin/users")
        // API returns { users: [], pagination: {} }
        setUsers(data?.users || [])
      } catch (err) {
        toast.error("Failed to load platform users")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    const matchesSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Directory</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Global account management across all tenants</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
               Platform Users: {users.length}
             </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text"
              placeholder="Search by name, email, or company..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative font-bold">
              <select 
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-slate-900 transition-all min-w-[160px]"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Any Identity</option>
                <option value="owner">Platform Owners</option>
                <option value="employee">Staff Members</option>
                <option value="admin">System Admins</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl border border-slate-200 bg-slate-50">
              <Filter className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                <th className="px-8 py-5">Full User Identity</th>
                <th className="px-8 py-5">Global Authorization</th>
                <th className="px-8 py-5">Corporate Context</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-8 py-8"><div className="h-12 bg-slate-50 rounded-2xl w-full" /></td>
                    </tr>
                  ))
                ) : filteredUsers.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="group hover:bg-slate-50 transition-all duration-200"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-slate-900/10">
                          {user.name?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-900 truncate tracking-tight">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-md ${user.role === 'owner' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                            <Shield className="h-3.5 w-3.5" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${user.role === 'owner' ? 'text-blue-600' : 'text-slate-600'}`}>
                            {user.role}
                          </span>
                       </div>
                       <p className="text-[10px] text-slate-300 font-bold mt-1.5 uppercase tracking-widest">SysID: {user.id}</p>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-black text-slate-700 tracking-tight">{user.company_name || 'Unassigned'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100">
                             <Key className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100">
                             <UserX className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400">
                             <MoreVertical className="h-5 w-5" />
                          </Button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
