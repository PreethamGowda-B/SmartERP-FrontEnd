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
  Key
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
        setUsers(data || [])
      } catch (err) {
        toast.error("Failed to load platform users")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Global User Registry</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium opacity-60">Monitor every account active across all tenant companies</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search by name, email, or company..."
              className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none min-w-[140px]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Any Role</option>
              <option value="owner">Owners</option>
              <option value="employee">Employees</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="border border-white/5 rounded-3xl bg-black/40 backdrop-blur-md overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Platform Identity</th>
                <th className="px-6 py-4">Company Context</th>
                <th className="px-6 py-4 text-right">Administrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredUsers.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 text-white font-bold">
                          {user.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Shield className={`h-3 w-3 ${user.role === 'owner' ? 'text-accent' : 'text-blue-400'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'owner' ? 'text-accent' : 'text-blue-400'}`}>
                            {user.role}
                          </span>
                       </div>
                       <p className="text-[10px] text-muted-foreground mt-1 tabular-nums italic">ID: #{user.id}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium text-white/80">{user.company_name || 'N/A'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 border border-transparent hover:border-accent/20">
                             <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                             <UserX className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                             <MoreVertical className="h-4 w-4" />
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
