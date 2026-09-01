"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { apiClient } from "@/lib/apiClient"
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Building2,
  HardHat,
  UserCheck
} from "lucide-react"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  portalType?: "staff" | "customer"
  defaultEmail?: string
  roleHint?: "owner" | "employee" | "hr" | "customer"
  onSuccessRedirect?: () => void
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  portalType = "staff",
  defaultEmail = "",
  roleHint = "owner",
  onSuccessRedirect
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "otp" | "password" | "success">("email")
  const [email, setEmail] = useState(defaultEmail)
  const [otp, setOtp] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail || "")
      setStep("email")
      setOtp("")
      setResetToken("")
      setNewPassword("")
      setConfirmPassword("")
      setError("")
      setIsLoading(false)
    }
  }, [isOpen, defaultEmail])

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const startCooldown = () => {
    setResendCooldown(60)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // ── Step 1: Submit Email
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const endpoint = portalType === "customer"
        ? "/api/customer/auth/forgot-password"
        : "/api/auth/forgot-password"

      await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      })

      startCooldown()
      setStep("otp")
    } catch (err: any) {
      setError(err?.message || "Unable to send verification instructions. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const endpoint = portalType === "customer"
        ? "/api/customer/auth/verify-reset-otp"
        : "/api/auth/verify-reset-otp"

      const res = await apiClient<{ ok: boolean; verified: boolean; reset_token: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      })

      if (res?.verified && res?.reset_token) {
        setResetToken(res.reset_token)
        setStep("password")
      } else {
        throw new Error("Verification failed. Please try again.")
      }
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter (A-Z).")
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter (a-z).")
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number (0-9).")
      return
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setError("Password must contain at least one special character (!@#$).")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.")
      return
    }

    setIsLoading(true)

    try {
      const endpoint = portalType === "customer"
        ? "/api/customer/auth/reset-password"
        : "/api/auth/reset-password"

      await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          reset_token: resetToken,
          new_password: newPassword,
        }),
      })

      setStep("success")
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try requesting a new code.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPortalBadge = () => {
    if (portalType === "customer") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
          <UserCheck className="h-3 w-3" /> Customer Portal
        </span>
      )
    }
    if (roleHint === "owner") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
          <Building2 className="h-3 w-3" /> Owner Account
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
        <HardHat className="h-3 w-3" /> Employee Account
      </span>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md w-full rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.12)] font-sans">
        <DialogHeader className="space-y-2 text-center pb-2">
          <div className="flex justify-center mb-1">
            {step === "success" ? (
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs animate-bounce">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                {step === "email" && <KeyRound className="h-6 w-6" />}
                {step === "otp" && <Mail className="h-6 w-6" />}
                {step === "password" && <Lock className="h-6 w-6" />}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {getPortalBadge()}
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            {step === "email" && "Forgot your password?"}
            {step === "otp" && "Check your email"}
            {step === "password" && "Create New Password"}
            {step === "success" && "Password reset successful"}
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {step === "email" && "Enter the email address associated with your SmartERP account and we'll send a 6-digit verification code."}
            {step === "otp" && (
              <>
                We sent a 6-digit code to <strong className="text-slate-800 font-semibold">{email}</strong>. Enter it below to proceed.
              </>
            )}
            {step === "password" && "Set a strong, secure new password for your workspace account."}
            {step === "success" && "Your SmartERP password has been updated successfully. You can now sign in with your new password."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="rounded-xl py-2 text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {/* ──── STEP 1: EMAIL ──── */}
          {step === "email" && (
            <motion.form
              key="step-email"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleRequestOtp}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-xs transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </motion.form>
          )}

          {/* ──── STEP 2: OTP ──── */}
          {step === "otp" && (
            <motion.form
              key="step-otp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="reset-otp" className="text-xs font-semibold text-slate-700 tracking-wide uppercase text-center block">
                  6-Digit Verification Code
                </Label>
                <Input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                  className="text-center text-2xl font-mono tracking-[0.4em] h-13 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-xs transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError("") }}
                  className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-slate-400">
                    Resend in <strong className="text-primary font-semibold">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={isLoading}
                    className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Resend code
                  </button>
                )}
              </div>
            </motion.form>
          )}

          {/* ──── STEP 3: NEW PASSWORD ──── */}
          {step === "password" && (
            <motion.form
              key="step-password"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleResetPassword}
              className="space-y-4 pt-1"
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-pw" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    className="pr-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pw" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-pw"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10 h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-xs transition-all mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update & Save Password"
                )}
              </Button>
            </motion.form>
          )}

          {/* ──── STEP 4: SUCCESS ──── */}
          {step === "success" && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5 pt-2 text-center"
            >
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm text-left flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>All active sessions and refresh tokens on other devices have been revoked for your security.</p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  onClose()
                  if (onSuccessRedirect) onSuccessRedirect()
                }}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-all"
              >
                Continue to Sign In
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
