"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LogIn,
  X,
  Clock,
  Globe,
  Shield,
  Laptop,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"

interface UserLoginHistoryDrawerProps {
  userId: string | null
  userName: string | null
  userEmail: string | null
  isOpen: boolean
  onClose: () => void
}

function safeFormat(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "Recently"
    return format(d, "MMM dd, yyyy • HH:mm:ss")
  } catch {
    return "Recently"
  }
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

export function UserLoginHistoryDrawer({
  userId,
  userName,
  userEmail,
  isOpen,
  onClose
}: UserLoginHistoryDrawerProps) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !userId) {
      setHistory([])
      return
    }

    let isMounted = true
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await apiClient<{ history: any[] }>(`/api/admin/users/${userId}/login-history`)
        if (isMounted) {
          setHistory(res?.history || [])
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load user login sessions")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchHistory()
    return () => {
      isMounted = false
    }
  }, [isOpen, userId])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="relative z-50 w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                <LogIn className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  Login & Session History
                </h2>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {userName || "User"} ({userEmail || userId})
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Recorded Authentication Events</span>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-[10px]">
                Last 20 Sessions
              </Badge>
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                No login history records found for this account.
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 capitalize">
                            {item.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            • IP: {item.ip_address || "Unknown"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {safeFormat(item.created_at)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {safeDistance(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
            <Button onClick={onClose} variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-semibold">
              Close History
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
