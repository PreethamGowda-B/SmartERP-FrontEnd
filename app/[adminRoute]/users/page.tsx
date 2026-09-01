"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Mail,
  Shield,
  UserX,
  Building,
  Key,
  ChevronDown,
  Filter,
  RefreshCw,
  LogOut,
  UserCheck,
  Trash2,
  X,
  Check,
  Eye,
  Clock,
  Laptop,
  MoreVertical,
  Edit,
  User
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AdminLayout } from "@/components/admin-layout"
import { UserLoginHistoryDrawer } from "@/components/admin/UserLoginHistoryDrawer"
import { formatDistanceToNow } from "date-fns"

interface PlatformUser {
  id: string
  name: string
  email: string
  role: string
  user_type?: "staff" | "customer"
  company_id: number
  company_name: string
  created_at: string
  is_active: boolean
}

type ActionType = "reset_password" | "force_logout" | "change_role" | "deactivate" | "restore" | "delete" | null

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-indigo-50 text-indigo-700 border-indigo-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  hr: "bg-purple-50 text-purple-700 border-purple-200",
  employee: "bg-slate-100 text-slate-700 border-slate-200",
  customer: "bg-emerald-50 text-emerald-700 border-emerald-200"
}

function safeDistance(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return "Recently"
  }
}

export default function AdminUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")

  // Modal / Action states
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [newPassword, setNewPassword] = useState("")
  const [selectedNewRole, setSelectedNewRole] = useState("employee")
  const [actionLoading, setActionLoading] = useState(false)

  // Login History Drawer state
  const [historyUserId, setHistoryUserId] = useState<string | null>(null)
  const [historyUserName, setHistoryUserName] = useState<string | null>(null)
  const [historyUserEmail, setHistoryUserEmail] = useState<string | null>(null)

  const fetchUsers = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    try {
      const data = await apiClient<{ users: PlatformUser[] }>(`/api/admin/users?_t=${Date.now()}`)
      setUsers(data?.users || [])
    } catch {
      toast.error("Failed to load platform users")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openAction = (user: PlatformUser, action: ActionType) => {
    setSelectedUser(user)
    setActiveAction(action)
    setNewPassword("")
    setSelectedNewRole(user.role || "employee")
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
          if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long")
            return
          }
          await apiClient(`/api/admin/users/${selectedUser.id}/reset-password`, {
            method: "POST",
            body: JSON.stringify({ new_password: newPassword })
          })
          toast.success(`Password reset for ${selectedUser.name}`)
          break

        case "change_role":
          await apiClient(`/api/admin/users/${selectedUser.id}`, {
            method: "PATCH",
            body: JSON.stringify({ role: selectedNewRole })
          })
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: selectedNewRole } : u))
          toast.success(`Role updated to ${selectedNewRole.toUpperCase()} for ${selectedUser.name}`)
          break

        case "force_logout":
          const logoutRes = await apiClient<{ message?: string }>(`/api/admin/users/${selectedUser.id}/force-logout`, { method: "POST" })
          toast.success(logoutRes?.message || `${selectedUser.name} forcefully logged out`)
          break

        case "deactivate":
          await apiClient(`/api/admin/users/${selectedUser.id}`, {
            method: "DELETE",
            body: JSON.stringify({ hard_delete: false })
          })
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, is_active: false } : u))
          toast.success(`${selectedUser.name} deactivated`)
          break

        case "restore":
          await apiClient(`/api/admin/users/${selectedUser.id}/restore`, { method: "POST" })
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, is_active: true } : u))
          toast.success(`${selectedUser.name} restored to active status`)
          break

        case "delete":
          await apiClient(`/api/admin/users/${selectedUser.id}`, {
            method: "DELETE",
            body: JSON.stringify({ hard_delete: true })
          })
          setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
          toast.success(`${selectedUser.name} permanently deleted`)
          break
      }
      closeAction()
    } catch (err: any) {
      toast.error(err?.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    const matchesSearch =
      (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       u.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRole = roleFilter === "all" || u.role?.toLowerCase() === roleFilter.toLowerCase()
    const matchesType = userTypeFilter === "all" || (u.user_type || "staff") === userTypeFilter
    return matchesSearch && matchesRole && matchesType
  })

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              User & Identity Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Cross-company user directory, password overrides, role modifications, and active sessions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <span>Total: <strong className="text-slate-900">{users.length}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-700">{users.filter(u => u.is_active).length} Active</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(true)}
              disabled={isRefreshing}
              className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50/50 border-slate-200 text-xs font-medium focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by Role"
              className="h-10 px-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owners</option>
              <option value="admin">Admins</option>
              <option value="hr">HR</option>
              <option value="employee">Employees</option>
            </select>

            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              aria-label="Filter by User Type"
              className="h-10 px-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="staff">Staff Only</option>
              <option value="customer">Customers Only</option>
            </select>
          </div>
        </div>

        {/* ── Users Data Table ───────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6">User & Identity</th>
                  <th className="py-3.5">Organization</th>
                  <th className="py-3.5">Role</th>
                  <th className="py-3.5">Type</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Registered</th>
                  <th className="py-3.5 text-right pr-6">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 pl-6"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-14 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                      <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                      <td className="py-4 pr-6 text-right"><div className="h-4 w-24 bg-slate-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No user accounts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isActive = u.is_active !== false
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* User Identity */}
                        <td className="py-3.5 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">
                                {u.name}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="py-3.5 font-medium text-slate-700">
                          {u.company_name || "Platform Staff"}
                        </td>

                        {/* Role */}
                        <td className="py-3.5">
                          <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-700"}`}>
                            {u.role || "employee"}
                          </Badge>
                        </td>

                        {/* User Type */}
                        <td className="py-3.5">
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-medium capitalize">
                            {u.user_type || "staff"}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="py-3.5">
                          <Badge className={
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                              : "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold"
                          }>
                            {isActive ? "Active" : "Deactivated"}
                          </Badge>
                        </td>

                        {/* Registered */}
                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                          {safeDistance(u.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Sessions History Drawer Trigger */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setHistoryUserId(u.id)
                                setHistoryUserName(u.name)
                                setHistoryUserEmail(u.email)
                              }}
                              title="View Login Sessions"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </Button>

                            {/* Change Role Trigger */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAction(u, "change_role")}
                              title="Change Role"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            {/* Reset Password */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAction(u, "reset_password")}
                              title="Reset Password"
                              className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            >
                              <Key className="h-3.5 w-3.5" />
                            </Button>

                            {/* Force Logout */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAction(u, "force_logout")}
                              title="Force Session Logout"
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                            </Button>

                            {/* Deactivate / Restore */}
                            {isActive ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAction(u, "deactivate")}
                                title="Deactivate Account"
                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAction(u, "restore")}
                                title="Restore Account"
                                className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Hard Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAction(u, "delete")}
                              title="Hard Delete Account"
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Action Confirmation Dialog Modal ───────────────────────────────── */}
        <AnimatePresence>
          {activeAction && selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeAction}
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 capitalize">
                      {activeAction.replace('_', ' ')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target: <strong className="text-slate-800">{selectedUser.name}</strong> ({selectedUser.email})
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={closeAction} className="h-7 w-7 rounded-lg text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {activeAction === "reset_password" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">New Password (min 8 chars)</label>
                    <Input
                      type="password"
                      placeholder="Enter new strong password..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                )}

                {activeAction === "change_role" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Select Platform Role</label>
                    <select
                      value={selectedNewRole}
                      onChange={(e) => setSelectedNewRole(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="hr">HR</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>
                )}

                {activeAction === "force_logout" && (
                  <p className="text-xs text-slate-600">
                    This will invalidate all active JWT tokens and refresh tokens in Redis, forcing the user to log in again.
                  </p>
                )}

                {activeAction === "deactivate" && (
                  <p className="text-xs text-slate-600">
                    This will set <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">is_active = false</code> and immediately block login access.
                  </p>
                )}

                {activeAction === "delete" && (
                  <p className="text-xs text-rose-700 font-semibold">
                    Warning: This will permanently purge the user record from the database. This action is irreversible.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button variant="outline" size="sm" onClick={closeAction} className="h-9 px-4 rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={executeAction}
                    className={`h-9 px-4 rounded-xl text-xs font-bold text-white ${
                      activeAction === 'delete' ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {actionLoading ? "Processing..." : "Confirm Action"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── User Login Session History Drawer ──────────────────────────────── */}
        <UserLoginHistoryDrawer
          userId={historyUserId}
          userName={historyUserName}
          userEmail={historyUserEmail}
          isOpen={Boolean(historyUserId)}
          onClose={() => setHistoryUserId(null)}
        />
      </div>
    </AdminLayout>
  )
}
