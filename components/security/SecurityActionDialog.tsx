"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  UserX,
  Building,
  Ban,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SecurityAction } from "@/services/securityApi"

interface SecurityActionDialogProps {
  isOpen: boolean
  action: SecurityAction | null
  mode: 'approve' | 'reject' | 'revert'
  onClose: () => void
  onConfirm: (actionId: string) => Promise<void>
}

export function SecurityActionDialog({
  isOpen,
  action,
  mode,
  onClose,
  onConfirm
}: SecurityActionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !action) return null

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      await onConfirm(action.id)
      onClose()
    } catch (err: any) {
      setError(err?.message || "Operation failed. Please verify platform admin authorization.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'USER_SUSPEND':
        return <UserX className="h-6 w-6 text-red-600" />
      case 'COMPANY_SUSPEND':
        return <Building className="h-6 w-6 text-rose-600" />
      case 'IP_BLOCK_PERMANENT':
        return <Ban className="h-6 w-6 text-amber-600" />
      case 'IP_THROTTLE_TEMPORARY':
        return <Clock className="h-6 w-6 text-amber-500" />
      default:
        return <ShieldAlert className="h-6 w-6 text-red-500" />
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans"
        >
          {/* Header Banner */}
          <div className={`p-6 border-b ${
            mode === 'revert' 
              ? 'bg-blue-50/70 border-blue-100'
              : mode === 'reject'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-red-50/70 border-red-100'
          }`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-200 shrink-0">
                {mode === 'revert' ? (
                  <RotateCcw className="h-6 w-6 text-blue-600" />
                ) : mode === 'reject' ? (
                  <XCircle className="h-6 w-6 text-slate-600" />
                ) : (
                  getActionIcon(action.action_type)
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {mode === 'approve' && 'Confirm Security Remediation'}
                  {mode === 'reject' && 'Reject Proposed Remediation'}
                  {mode === 'revert' && 'Rollback / Revert Security Action'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'approve' && 'Super Admin authorization required to execute sensitive account changes.'}
                  {mode === 'reject' && 'This proposed action will be cancelled and archived without executing.'}
                  {mode === 'revert' && 'Restores target entity access and clears applied security quarantines.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Details Body */}
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Action Type</span>
                <Badge variant="outline" className="font-mono bg-white font-semibold">
                  {action.action_type}
                </Badge>
              </div>
              
              {action.details?.reason && (
                <div className="text-xs">
                  <span className="text-slate-500 font-medium block mb-1">Trigger Reason</span>
                  <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 font-sans">
                    {action.details.reason}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {action.details?.ipAddress && (
                  <div>
                    <span className="text-slate-500 block">Target IP</span>
                    <span className="font-mono font-semibold text-slate-800">{action.details.ipAddress}</span>
                  </div>
                )}
                {action.details?.userId && (
                  <div>
                    <span className="text-slate-500 block">Target User ID</span>
                    <span className="font-mono text-slate-800 text-[11px] truncate block">{action.details.userId}</span>
                  </div>
                )}
                {action.details?.companyId && (
                  <div>
                    <span className="text-slate-500 block">Company ID</span>
                    <span className="font-mono text-slate-800 text-[11px] truncate block">{action.details.companyId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Caution Warning for Sensitive Executions */}
            {mode === 'approve' && !action.is_automated && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Administrative Enforcement Warning</strong>
                  This action modifies user status or platform routing immediately upon confirmation.
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer CTA Buttons */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className={`text-xs h-9 px-4 font-semibold text-white ${
                mode === 'revert'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : mode === 'reject'
                  ? 'bg-slate-700 hover:bg-slate-800'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : mode === 'approve' ? (
                'Confirm & Execute Action'
              ) : mode === 'reject' ? (
                'Confirm Rejection'
              ) : (
                'Confirm Rollback'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
