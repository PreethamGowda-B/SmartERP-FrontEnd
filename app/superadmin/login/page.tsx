"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ShieldCheck, Lock, Mail, ArrowRight, AlertTriangle, Eye, EyeOff, CheckSquare, Square } from "lucide-react"
import { signIn } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal"

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  
  const router = useRouter()
  const { setUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const userDetails = await signIn(email, password)
      
      if (!userDetails || userDetails.role !== "super_admin") {
        const error = "Access Denied: Account lacks platform-level superadmin privileges."
        setErrorMsg(error)
        toast.error(error)
        setIsLoading(false)
        return
      }

      toast.success("Super Admin authenticated successfully")
      setUser(userDetails)
      
      // Redirect to Super Admin Portal overview
      router.push("/superadmin")
    } catch (err: any) {
      const message = err?.message || "Invalid platform administrator credentials"
      setErrorMsg(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-900 p-4 font-sans relative overflow-hidden">
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0,transparent_70%)] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 relative z-10 space-y-6"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 mb-4 border border-indigo-400/30">
            <ShieldCheck className="h-9 w-9 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold mb-3 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Prozync Innovations Platform Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Super Admin Portal</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Platform Control & Multi-Tenant Management</p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs font-semibold leading-relaxed"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@prozync.in"
                className="pl-10 bg-slate-50/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20 h-11 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="pl-10 pr-10 bg-slate-50/60 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20 h-11 rounded-xl text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium cursor-pointer"
            >
              {rememberMe ? (
                <CheckSquare className="h-4 w-4 text-indigo-600 fill-indigo-50" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>Remember session</span>
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group mt-2 text-xs"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Super Admin Console</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {/* Security Footer Note */}
        <div className="pt-2 text-center text-[10px] text-slate-400 font-mono">
          <p>Prozync Innovations • Enterprise Platform Security</p>
          <p className="mt-0.5 text-slate-400">Unauthorized access attempts are logged and monitored.</p>
        </div>
      </motion.div>

      {/* 🔐 Super Admin Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        portalType="staff"
        defaultEmail={email}
        roleHint="owner"
      />
    </div>
  )
}
