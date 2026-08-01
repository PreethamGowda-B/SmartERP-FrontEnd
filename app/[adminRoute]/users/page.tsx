"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Mail, Shield, UserX, Building, Key, ChevronDown,
  Filter, RefreshCw, LogOut, UserCheck, Trash2, X, Check, Eye
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  company_id: number
  company_name: string
  created_at: string
  is_active: boolean
}

type ActionType = "reset_password" | "force_logout" | "deactivate" | "restore" | "delete" | null

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Action state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [newPassword, setNewPassword] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true)
    else setIsRefreshing(true)
    try {
      const data = await apiClient(`/api/admin/users?_t=${Date.now()}`)
      setUsers(data?.users || [])
      setLastUpdated(new Date())
    } catch {
      toast.error("Failed to load platform users")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchUsers(true)
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [])

  const openAction = (user: User, action: ActionType) => {
    setSelectedUser(user)
    setActiveAction(action)
    setNewPassword("")
  }

  const closeAction = () => {
    setSelectedUser(null)
    setActiveAction(null)
    setNewPassword("")
  }

  const executeAction = async () => {
    if (!selectedUser || !activeAction) return
    setActionLoading(true)
    try {
      switch (activeAction) {
        case "reset_password":
          if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return }
          await apiClient(`/api/admin/users/${selectedUser.id}/reset-password`, {
            method: "POST",
            body: JSON.stringify({ new_password: newPassword })
          })
          toast.success(`Password reset for ${selectedUser.name}`)
          break
        case "force_logout":
          const logoutRes = await apiClient(`/api/admin/users/${selectedUser.id}/force-logout`, { method: "POST" })
          toast.success(logoutRes?.message || `${selectedUser.name} forcefully logged out`)
          break
        case "deactivate":
          await apiClient(`/api/admin/users/${selectedUser.id}`, {
            method: "DELETE",
            body: JSON.stringify({ hard_delete: false })
          })
          toast.success(`${selectedUser.name} account deactivated`)
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, is_active: false } : u))
          break
        case "restore":
          await apiClient(`/api/admin/users/${selectedUser.id}/restore`, { method: "POST" })
          toast.success(`${selectedUser.name} account restored`)
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, is_active: true } : u))
          break
        case "delete":
          await apiClient(`/api/admin/users/${selectedUser.id}`, {
            method: "DELETE",
            body: JSON.stringify({ hard_delete: true })
          })
          toast.success(`User ${selectedUser.name} permanently deleted`)
          setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
          break
      }
      closeAction()
      fetchUsers(true)
    } catch (err: any) {
      toast.error(err?.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    const matchesSearch = (
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const ACTION_CONFIGS = {
    reset_password: { title: "Reset Password", desc: "Set a new password for this user.", danger: false, confirmLabel: "Reset Password" },
    force_logout: { title: "Force Logout", desc: "This will revoke all active sessions and refresh tokens for this user.", danger: true, confirmLabel: "Force Logout" },
    deactivate: { title: "Deactivate Account", desc: "User won't be able to log in. Data is preserved. This can be undone.", danger: true, confirmLabel: "Deactivate" },
    restore: { title: "Restore Account", desc: "Re-enable this user's access to their account.", danger: false, confirmLabel: "Restore Access" },
    delete: { title: "Permanently Delete", desc: "⚠️ This CANNOT be undone. All user data will be removed.", danger: true, confirmLabel: "Delete Forever" },
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Directory</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Global account management across all tenants</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                Platform Users: {users.length}
              </div>
              {lastUpdated && (
                <span className="text-[9px] text-slate-400 mt-1 font-medium">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => fetchUsers(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border-slate-200 h-10"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
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
                <option value="hr">HR Managers</option>
                <option value="admin">System Admins</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                <th className="px-8 py-5">Full User Identity</th>
                <th className="px-8 py-5">Role & Status</th>
                <th className="px-8 py-5">Company</th>
                <th className="px-8 py-5 text-right">Actions</th>
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
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-slate-400 font-bold text-sm">
                      No users match your filters
                    </td>
                  </tr>
                ) : filteredUsers.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`group hover:bg-slate-50 transition-all duration-200 ${!user.is_active ? 'opacity-60' : ''}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${user.is_active !== false ? 'bg-slate-900' : 'bg-slate-400'}`}>
                          {user.name?.[0] || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-black text-slate-900 truncate tracking-tight">{user.name}</p>
                            {user.is_active === false && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                                Deactivated
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${user.role === 'owner' ? 'bg-blue-50 text-blue-600' : user.role === 'super_admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Shield className="h-3.5 w-3.5" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${user.role === 'owner' ? 'text-blue-600' : user.role === 'super_admin' ? 'text-purple-600' : 'text-slate-600'}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-bold mt-1.5 uppercase tracking-widest font-mono">
                        {user.id?.slice?.(0, 8) || user.id}...
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-black text-slate-700 tracking-tight">{user.company_name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Reset Password */}
                        <button
                          onClick={() => openAction(user, "reset_password")}
                          title="Reset Password"
                          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 transition-colors"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        {/* Force Logout */}
                        <button
                          onClick={() => openAction(user, "force_logout")}
                          title="Force Logout"
                          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-100 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                        {/* Deactivate / Restore */}
                        {user.is_active !== false ? (
                          <button
                            onClick={() => openAction(user, "deactivate")}
                            title="Deactivate"
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 border border-slate-100 transition-colors"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openAction(user, "restore")}
                            title="Restore Account"
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-100 transition-colors"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        {/* Permanent Delete */}
                        <button
                          onClick={() => openAction(user, "delete")}
                          title="Delete User"
                          className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {activeAction && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeAction}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {ACTION_CONFIGS[activeAction]?.title}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {selectedUser.name} ({selectedUser.email})
                  </p>
                </div>
                <button onClick={closeAction} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Description */}
              <div className={`p-4 rounded-2xl text-sm font-medium ${ACTION_CONFIGS[activeAction]?.danger ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                {ACTION_CONFIGS[activeAction]?.desc}
              </div>

              {/* Password Input for reset */}
              {activeAction === "reset_password" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    New Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={closeAction}
                  className="flex-1 rounded-xl h-11 font-bold border-slate-200"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`flex-1 rounded-xl h-11 font-black text-sm gap-2 ${
                    ACTION_CONFIGS[activeAction]?.danger
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                      : 'bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/20'
                  }`}
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {actionLoading ? "Processing..." : ACTION_CONFIGS[activeAction]?.confirmLabel}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
