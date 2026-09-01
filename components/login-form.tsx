"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { signIn, signUp } from "@/lib/auth"
import { apiClient, clearTokens } from "@/lib/apiClient"
import { useAuth } from "@/contexts/auth-context"
import { Building2, Loader2, HardHat, UserPlus, CheckCircle2, RefreshCw, Mail, ArrowLeft, Eye, EyeOff, TrendingUp, Users, Clock, Calendar, Bell } from "lucide-react"
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal"
import "@/app/login-page.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("owner")
  const [mode, setMode] = useState<"login" | "signup">("signup")
  const [isFlipping, setIsFlipping] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const { setUser } = useAuth()
  const router = useRouter()

  // â”€â”€ OTP Modal state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Hold pending signup data while waiting for OTP
  const pendingSignupRef = useRef<any>(null)

  // â”€â”€ Handle URL query params (mode & error) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const errorParam = urlParams.get("error")
      const modeParam = urlParams.get("mode")
      if (errorParam === "account_suspended") {
        router.push("/suspended")
      }
      if (modeParam === "login") {
        setMode("login")
      } else if (modeParam === "signup") {
        setMode("signup")
      }
    }
  }, [router])

  const startCooldown = () => {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  // â”€â”€ Send OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sendOtp = async (targetEmail: string) => {
    setOtpSending(true)
    setOtpError("")
    try {
      const data = await apiClient("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail }),
      })
      startCooldown()
    } catch (err: any) {
      setOtpError(err.message || "Failed to send OTP. Please try again.")
    } finally {
      setOtpSending(false)
    }
  }

  // â”€â”€ Verify OTP and complete signup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleVerifyAndSignup = async () => {
    if (otp.length !== 6) { setOtpError("Please enter the 6-digit OTP"); return }
    setOtpVerifying(true)
    setOtpError("")
    try {
      // 1. Verify OTP
      const verifyData = await apiClient("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: pendingSignupRef.current.email, otp }),
      })

      // 2. OTP verified â€” create the account
      const user = await signUp(pendingSignupRef.current)
      if (user) {
        setShowOtpModal(false)
        setOtp("")
        pendingSignupRef.current = null
        setSuccess("Account created successfully! You can now sign in.")
        setMode("login")
        setPassword(""); setName(""); setPhone(""); setPosition(""); setDepartment("")
      } else {
        setOtpError("Account creation failed. This email may already be registered â€” try signing in instead.")
      }
    } catch (err: any) {
      const msg: string = err.message || ""
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("duplicate")) {
        setOtpError("This email is already registered. Please sign in instead.")
      } else if (msg.toLowerCase().includes("validation")) {
        setOtpError("Please check your details â€” make sure your password is at least 10 characters with uppercase, number, and special character.")
      } else {
        setOtpError(msg || "Verification failed. Please try again.")
      }
    } finally {
      setOtpVerifying(false)
    }
  }

  // â”€â”€ Main form submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (mode === "login") {
        const user: any = await signIn(email, password)
        if (user) {
          const isSuperAdmin = user.role === "super_admin"
          const userKey = isSuperAdmin ? "smarterp_admin_user" : "smarterp_user"
          localStorage.setItem(userKey, JSON.stringify(user))

          // Sync tokens with Android native bridge if available
          if (typeof window !== "undefined" && (window as any).Android?.saveToken && user.accessToken) {
            (window as any).Android.saveToken(user.accessToken, user.refreshToken || null)
          }

          setUser(user)
          if (user.role === "owner") {
            router.push("/owner")
          } else if (user.role === "hr") {
            router.push("/hr")
          } else {
            router.push("/employee")
          }
        } else {
          // If signIn returned null but didn't throw, it might have handled a redirect (suspension)
          // We only set the generic error if we are still on the page
          setError("Invalid email or password. Please check your credentials or create an account.")
        }
      } else {
        // Signup â€” validate then show OTP modal
        if (!name.trim()) { setError("Full name is required"); setIsLoading(false); return }
        if (password.length < 10) { setError("Password must be at least 10 characters long"); setIsLoading(false); return }
        if (!/[A-Z]/.test(password)) { setError("Password must contain at least one uppercase letter"); setIsLoading(false); return }
        if (!/[0-9]/.test(password)) { setError("Password must contain at least one number"); setIsLoading(false); return }
        if (!/[^A-Za-z0-9]/.test(password)) { setError("Password must contain at least one special character (e.g. !@#$%)"); setIsLoading(false); return }

        const userData = {
          email,
          password,
          name: name.trim(),
          role: activeTab as "owner" | "employee",
          phone: phone.trim() || undefined,
          position: activeTab === "employee" ? position.trim() || undefined : undefined,
          department: activeTab === "employee" ? department.trim() || undefined : undefined,
          company_code: activeTab === "employee" ? companyCode.trim() || undefined : undefined,
        }

        // Save pending signup data, send OTP, show modal
        pendingSignupRef.current = userData

        // Check if email is already registered before sending OTP
        try {
          const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"}/api/auth/check-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
          if (checkRes.ok) {
            const checkData = await checkRes.json()
            if (checkData.exists) {
              setError("This email is already registered. Please sign in instead.")
              setIsLoading(false)
              return
            }
          }
        } catch {
          // check-email endpoint may not exist â€” proceed anyway, signup will catch it
        }

        await sendOtp(email)
        setShowOtpModal(true)
        setOtp("")
        setOtpError("")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    if (value === activeTab) return
    setIsFlipping(true)
    setTimeout(() => {
      setActiveTab(value)
      setError(""); setSuccess(""); setEmail(""); setPassword("")
      if (mode === "signup") { setName(""); setPhone(""); setPosition(""); setDepartment(""); setCompanyCode("") }
      setTimeout(() => setIsFlipping(false), 50)
    }, 150)
  }

  const toggleMode = () => {
    setIsFlipping(true)
    setTimeout(() => {
      setMode(mode === "login" ? "signup" : "login")
      setError(""); setSuccess(""); setEmail(""); setPassword("")
      setName(""); setPhone(""); setPosition(""); setDepartment(""); setCompanyCode("")
      setTimeout(() => setIsFlipping(false), 50)
    }, 150)
  }

  return (
    <>
      {/* â”€â”€ OTP Verification Modal â€” UNTOUCHED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Dialog open={showOtpModal} onOpenChange={(open) => { if (!open) { setShowOtpModal(false); setOtp(""); setOtpError("") } }}>
        <DialogContent className="max-w-sm rounded-2xl border-0 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-primary/10 rounded-2xl lp-logo-pulse">
                <Mail className="h-7 w-7 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-lg font-bold">Verify Your Email</DialogTitle>
            <DialogDescription className="text-center text-sm text-slate-500">
              We sent a 6-digit code to<br />
              <strong className="text-slate-800 font-semibold">{pendingSignupRef.current?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="_ _ _ _ _ _"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-2xl font-mono tracking-[0.5em] h-14 rounded-xl border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />
            {otpError && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{otpError}</AlertDescription>
              </Alert>
            )}
            <Button
              className="w-full h-12 rounded-xl font-semibold lp-btn-primary"
              onClick={handleVerifyAndSignup}
              disabled={otpVerifying || otp.length !== 6}
            >
              {otpVerifying
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifyingâ€¦</>
                : <><CheckCircle2 className="mr-2 h-4 w-4" />Verify &amp; Create Account</>
              }
            </Button>
            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-slate-400">Resend code in <span className="font-semibold text-primary">{resendCooldown}s</span></p>
              ) : (
                <button
                  type="button"
                  onClick={() => sendOtp(pendingSignupRef.current?.email)}
                  disabled={otpSending}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 mx-auto disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  {otpSending ? "Sendingâ€¦" : "Resend code"}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 text-center">Code expires in 10 minutes</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ PREMIUM LOGIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="min-h-screen flex items-center justify-center lp-network-bg lp-enter" style={{ background: "linear-gradient(135deg, #f0ede8 0%, #ede8f5 40%, #e8eef8 100%)" }}>

        {/* â”€â”€ Floating Background Decorations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          {/* Large soft spheres */}
          <div className="lp-deco-glow absolute -top-32 -left-32 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, oklch(0.45 0.15 240 / 0.12) 0%, transparent 70%)" }} />
          <div className="lp-deco-glow absolute -bottom-40 -right-40 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, oklch(0.65 0.18 45 / 0.10) 0%, transparent 70%)", animationDelay: "2s" }} />
          <div className="lp-deco-glow absolute top-1/2 left-1/3 w-64 h-64 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ background: "radial-gradient(circle, oklch(0.55 0.12 280 / 0.07) 0%, transparent 70%)", animationDelay: "1s" }} />

          {/* Floating geometric shapes */}
          <div className="lp-deco-float-a absolute top-16 left-[8%] w-10 h-10 rounded-xl opacity-[0.12]"
            style={{ background: "oklch(0.45 0.15 240)", animationDuration: "8s" }} />
          <div className="lp-deco-float-b absolute top-28 right-[10%] w-7 h-7 rounded-lg opacity-[0.10]"
            style={{ background: "oklch(0.65 0.18 45)", animationDuration: "10s", animationDelay: "1s" }} />
          <div className="lp-deco-float-c absolute bottom-24 left-[12%] w-12 h-12 rounded-2xl opacity-[0.08]"
            style={{ background: "oklch(0.45 0.15 240)", animationDuration: "12s", animationDelay: "2.5s" }} />
          <div className="lp-deco-float-a absolute bottom-16 right-[8%] w-8 h-8 rounded-xl opacity-[0.10]"
            style={{ background: "oklch(0.55 0.12 280)", animationDuration: "9s", animationDelay: "0.5s" }} />
          <div className="lp-deco-drift absolute top-[40%] left-[3%] w-5 h-5 rounded-full opacity-[0.12]"
            style={{ background: "oklch(0.65 0.18 45)" }} />
          <div className="lp-deco-drift absolute top-[60%] right-[5%] w-4 h-4 rounded-full opacity-[0.10]"
            style={{ background: "oklch(0.45 0.15 240)", animationDelay: "3s" }} />

          {/* Spinning rings */}
          <div className="lp-deco-spin absolute top-[15%] right-[18%] w-24 h-24 rounded-full opacity-[0.07]"
            style={{ border: "2px solid oklch(0.45 0.15 240)" }} />
          <div className="lp-deco-spin-r absolute bottom-[20%] left-[20%] w-16 h-16 rounded-full opacity-[0.06]"
            style={{ border: "1.5px solid oklch(0.65 0.18 45)" }} />
          <div className="lp-deco-spin absolute top-[55%] left-[8%] w-10 h-10 rounded-full opacity-[0.08]"
            style={{ border: "1px solid oklch(0.45 0.15 240)", animationDuration: "30s" }} />

          {/* Small floating dots */}
          {[
            { top: "22%", left: "15%", size: 4, color: "oklch(0.45 0.15 240)", delay: "0s" },
            { top: "38%", left: "88%", size: 3, color: "oklch(0.65 0.18 45)", delay: "1.2s" },
            { top: "72%", left: "22%", size: 5, color: "oklch(0.45 0.15 240)", delay: "0.6s" },
            { top: "15%", left: "60%", size: 3, color: "oklch(0.55 0.12 280)", delay: "2s" },
            { top: "85%", left: "72%", size: 4, color: "oklch(0.65 0.18 45)", delay: "1.8s" },
          ].map((dot, i) => (
            <div key={i} className="lp-deco-float-b absolute rounded-full opacity-[0.18]"
              style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size, background: dot.color, animationDelay: dot.delay }} />
          ))}

          {/* Glass cards background decoration */}
          <div className="lp-deco-float-c absolute top-[10%] right-[2%] w-32 h-20 rounded-2xl opacity-[0.06] lp-glass" />
          <div className="lp-deco-float-a absolute bottom-[12%] left-[2%] w-24 h-16 rounded-xl opacity-[0.06] lp-glass" />
        </div>

        {/* â”€â”€ Main Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="lp-card-wrapper w-full max-w-[900px] mx-4 sm:mx-6 flex min-h-[540px] rounded-[24px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.13),0_0_0_1px_rgba(255,255,255,0.8)] lp-enter lp-enter-d1"
          style={{ background: "rgba(255,255,255,0.97)" }}>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              LEFT PANEL â€” FORM
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="lp-form-panel w-full lg:w-[46%] flex flex-col p-7 sm:p-9 overflow-y-auto">

            {/* Brand bar */}
            <div className="flex items-center gap-2.5 mb-6 lp-enter lp-enter-d1">
              <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center lp-logo-pulse shadow-[0_4px_12px_oklch(0.45_0.15_240/0.35)]">
                <Building2 className="h-5 w-5 text-white" aria-hidden />
              </div>
              <span className="font-extrabold text-[1.05rem] text-slate-900 tracking-tight">SmartERP</span>
              <button
                type="button"
                onClick={() => { window.location.href = "/" }}
                className="ml-auto flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors rounded-lg px-2 py-1 hover:bg-slate-100"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden />Home
              </button>
            </div>

            {/* Heading */}
            <div className="mb-5 lp-enter lp-enter-d2">
              <h1 className="text-[1.6rem] font-black text-slate-900 leading-[1.15] tracking-tight mb-1">
                {mode === "login" ? "Welcome back" : "Create an account"}
              </h1>
              <p className="text-[0.875rem] text-slate-500 font-medium">
                {mode === "login" ? "Sign in to your workspace" : "Sign up and get 30-day free trial"}
              </p>
            </div>

            {/* Role Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 lp-enter lp-enter-d3">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 mb-4 h-10">
                <TabsTrigger
                  value="owner"
                  className="rounded-lg text-[0.8rem] font-semibold gap-1.5 transition-all duration-200
                    data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_oklch(0.45_0.15_240/0.30)]
                    data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-800"
                >
                  <Building2 className="h-3.5 w-3.5" aria-hidden />Owner
                </TabsTrigger>
                <TabsTrigger
                  value="employee"
                  className="rounded-lg text-[0.8rem] font-semibold gap-1.5 transition-all duration-200
                    data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_oklch(0.65_0.18_45/0.30)]
                    data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-800"
                >
                  <HardHat className="h-3.5 w-3.5" aria-hidden />Employee
                </TabsTrigger>
              </TabsList>

              <div className={`transition-all duration-200 ${isFlipping ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}>

                {/* â”€â”€ OWNER TAB â”€â”€ */}
                <TabsContent value="owner">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Full Name</Label>
                        <Input id="name" type="text" placeholder="Your full name" value={name}
                          onChange={(e) => setName(e.target.value)} required
                          className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Email</Label>
                      <Input id="email" type="email" placeholder="you@company.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Password</Label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => setShowForgotPasswordModal(true)}
                            className="text-[0.78rem] text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password}
                          onChange={(e) => setPassword(e.target.value)} required
                          className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400 pr-11" />
                        <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Phone <span className="text-slate-400 normal-case font-normal">(Optional)</span></Label>
                        <Input id="phone" type="tel" placeholder="Your phone number" value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                      </div>
                    )}
                    {error && <Alert variant="destructive" className="rounded-xl py-2.5 text-sm"><AlertDescription>{error}</AlertDescription></Alert>}
                    {success && <Alert className="rounded-xl py-2.5 text-sm border-emerald-200 bg-emerald-50 text-emerald-800"><AlertDescription>{success}</AlertDescription></Alert>}
                    <Button type="submit" disabled={isLoading}
                      className="lp-btn-primary w-full h-10 rounded-xl bg-primary hover:bg-primary text-white font-semibold text-sm shadow-[0_4px_14px_oklch(0.45_0.15_240/0.30)]">
                      {isLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === "login" ? "Signing in..." : "Sending OTP..."}</>
                        : mode === "login" ? "Sign In as Owner" : "Create Owner Account"
                      }
                    </Button>
                    {mode === "login" && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
                        <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" aria-hidden />
                        <p className="text-[0.78rem] text-primary/80 font-medium">Access full business management features</p>
                      </div>
                    )}
                  </form>
                </TabsContent>

                {/* ──── EMPLOYEE TAB ──── */}
                <TabsContent value="employee">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="name-emp" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Full Name</Label>
                        <Input id="name-emp" type="text" placeholder="Your full name" value={name}
                          onChange={(e) => setName(e.target.value)} required
                          className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="email-emp" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Email</Label>
                      <Input id="email-emp" type="email" placeholder="you@company.com" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password-emp" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Password</Label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => setShowForgotPasswordModal(true)}
                            className="text-[0.78rem] text-accent hover:text-accent/80 font-medium transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input id="password-emp" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password}
                          onChange={(e) => setPassword(e.target.value)} required
                          className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400 pr-11" />
                        <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {mode === "signup" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="company_code" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Company Code <span className="text-red-500">*</span></Label>
                          <Input id="company_code" type="text" placeholder="Enter the code from your employer"
                            value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} required
                            className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] font-mono tracking-widest placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal" />
                          <p className="text-[0.74rem] text-slate-400">Ask your employer for the company code (e.g. SMR1001)</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone-emp" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Phone <span className="text-slate-400 normal-case font-normal">(Optional)</span></Label>
                          <Input id="phone-emp" type="tel" placeholder="Your phone number" value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="position" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Position <span className="text-slate-400 normal-case font-normal">(Optional)</span></Label>
                          <Input id="position" type="text" placeholder="e.g., Site Supervisor, Foreman"
                            value={position} onChange={(e) => setPosition(e.target.value)}
                            className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="department" className="text-[0.78rem] font-semibold text-slate-600 tracking-wide uppercase">Department <span className="text-slate-400 normal-case font-normal">(Optional)</span></Label>
                          <Input id="department" type="text" placeholder="e.g., Construction, Electrical"
                            value={department} onChange={(e) => setDepartment(e.target.value)}
                            className="lp-input h-10 rounded-xl border-slate-200 bg-slate-50 text-[0.875rem] placeholder:text-slate-400" />
                        </div>
                      </>
                    )}
                    {error && <Alert variant="destructive" className="rounded-xl py-2.5 text-sm"><AlertDescription>{error}</AlertDescription></Alert>}
                    {success && <Alert className="rounded-xl py-2.5 text-sm border-emerald-200 bg-emerald-50 text-emerald-800"><AlertDescription>{success}</AlertDescription></Alert>}
                    <Button type="submit" disabled={isLoading}
                      className="lp-btn-accent w-full h-10 rounded-xl bg-accent hover:bg-accent text-white font-semibold text-sm shadow-[0_4px_14px_oklch(0.65_0.18_45/0.30)]">
                      {isLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === "login" ? "Signing in..." : "Sending OTP..."}</>
                        : mode === "login" ? "Sign In as Employee" : "Create Employee Account"
                      }
                    </Button>
                    {mode === "login" && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/5 border border-accent/10">
                        <HardHat className="h-3.5 w-3.5 text-accent flex-shrink-0" aria-hidden />
                        <p className="text-[0.78rem] text-accent/80 font-medium">Access your jobs, time tracking &amp; more</p>
                      </div>
                    )}
                  </form>
                </TabsContent>
              </div>
            </Tabs>

            {/* Divider */}
            <div className="relative my-3 lp-enter lp-enter-d4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[0.72rem] uppercase tracking-[0.1em] text-slate-400 font-semibold">or continue with</span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => {
                clearTokens()
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"
                const codeParam = companyCode ? `&company_code=${encodeURIComponent(companyCode.trim())}` : ""
                window.location.href = `${apiUrl}/api/auth/google?role=${activeTab}${codeParam}`
              }}
              className="lp-btn-google w-full h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2.5 text-[0.875rem] font-semibold text-slate-700 lp-enter lp-enter-d5"
            >
              <svg className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>

            {/* Mode toggle */}
            <div className="mt-4 flex items-center justify-between lp-enter lp-enter-d6">
              <button type="button" onClick={toggleMode}
                className="flex items-center gap-1.5 text-[0.82rem] text-slate-500 hover:text-primary font-medium transition-colors">
                <UserPlus className="h-3.5 w-3.5" aria-hidden />
                {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
              </button>
              <a href="/privacy" className="text-[0.75rem] text-slate-400 hover:text-slate-600 transition-colors">Privacy</a>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT PANEL — HERO
          ═══════════════════════════════════════════════════════════ */}
          <div className="lp-hero-panel hidden lg:flex lg:w-[54%] relative overflow-hidden">
            {/* Hero photo */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/login-hero.jpg')" }} />

            {/* Multi-layer overlay for premium depth */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.40) 50%, rgba(15,23,42,0.55) 100%)"
            }} />
            {/* Blue tint overlay */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(to top, oklch(0.45 0.15 240 / 0.30) 0%, transparent 60%)"
            }} />

            {/* Content layer */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between p-7">

              {/* Brand tagline (top) */}
              <div className="lp-enter lp-enter-hero lp-enter-d2">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 lp-dot-pulse" />
                  <span className="text-white/90 text-[0.75rem] font-semibold tracking-wide">Enterprise ERP Platform</span>
                </div>
              </div>

              {/* Center: main hero message */}
              <div className="lp-enter lp-enter-hero lp-enter-d3 mb-4">
                <h2 className="text-white font-black text-2xl leading-tight mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  Manage your entire<br />business from one place
                </h2>
                <p className="text-white/70 text-[0.82rem] font-medium max-w-[260px]">
                  Jobs, payroll, attendance, HR, and AI-powered insights - all in SmartERP.
                </p>
              </div>

              {/* KPI widgets stack */}
              <div className="space-y-3 lp-enter lp-enter-hero lp-enter-d4">

                {/* Widget row 1: Active Job + Revenue */}
                <div className="flex gap-3">
                  {/* Active Job card */}
                  <div className="lp-widget-a bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.20)] flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 lp-dot-pulse" />
                      <span className="text-[0.7rem] font-bold text-slate-600 uppercase tracking-wide">Active Job</span>
                    </div>
                    <p className="text-[0.82rem] font-extrabold text-slate-900 leading-tight">Site Inspection</p>
                    <p className="text-[0.7rem] text-slate-500 mt-0.5">09:30 - 12:00pm</p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="h-1 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-1 w-[68%] rounded-full bg-amber-400" />
                      </div>
                      <span className="text-[0.65rem] text-slate-400 font-medium">68%</span>
                    </div>
                  </div>

                  {/* Revenue card */}
                  <div className="lp-widget-b bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.20)] flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[0.7rem] font-bold text-slate-600 uppercase tracking-wide">Revenue</span>
                      <TrendingUp className="h-3 w-3 text-emerald-500" aria-hidden />
                    </div>
                    <p className="text-[1.1rem] font-black text-slate-900">₹2.4L</p>
                    <p className="text-[0.7rem] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                      ↑ 18% this month
                    </p>
                  </div>
                </div>

                {/* Widget row 2: Team + Daily Standup */}
                <div className="flex gap-3">
                  {/* Team widget */}
                  <div className="lp-widget-c bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.20)] flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3 w-3 text-primary" aria-hidden />
                      <span className="text-[0.7rem] font-bold text-slate-600 uppercase tracking-wide">Team</span>
                    </div>
                    <div className="flex -space-x-1.5">
                      {["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6"].map((color, i) => (
                        <div key={i} className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }} />
                      ))}
                      <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-700 flex items-center justify-center text-white text-[8px] font-bold shadow-sm">+12</div>
                    </div>
                    <p className="text-[0.7rem] text-slate-400 mt-1.5">17 employees active</p>
                  </div>

                  {/* Standup card */}
                  <div className="lp-widget-a bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.20)] flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[0.7rem] font-bold text-slate-600 uppercase tracking-wide">Standup</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-primary lp-dot-pulse" />
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3 text-slate-400" aria-hidden />
                      <p className="text-[0.7rem] text-slate-500">12:00 - 01:00pm</p>
                    </div>
                    <div className="flex -space-x-1">
                      {["#3b82f6","#10b981","#f59e0b"].map((color, i) => (
                        <div key={i} className="h-5 w-5 rounded-full border-2 border-white"
                          style={{ backgroundColor: color }} />
                      ))}
                      <div className="h-5 w-5 rounded-full border-2 border-white bg-slate-700 flex items-center justify-center text-white text-[7px] font-bold">+5</div>
                    </div>
                  </div>
                </div>

                {/* KPI pills row */}
                <div className="flex gap-2 lp-widget-b">
                  {[
                    { label: "24 Jobs", color: "bg-primary/10 text-primary border-primary/20" },
                    { label: "98% On-Time", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                    { label: "₹2.4L Rev", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  ].map(({ label, color }) => (
                    <div key={label} className={`flex-1 text-center rounded-full border px-2 py-1 text-[0.7rem] font-bold backdrop-blur-sm ${color} bg-opacity-90`}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer credits */}
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.7rem] text-slate-400/60 whitespace-nowrap select-none">
          © {new Date().getFullYear()} SmartERP · Enterprise Workforce Management
        </p>
      </div>

      {/* 🔐 Password Recovery Modal (Owner, Employee, HR) */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        portalType="staff"
        defaultEmail={email}
        roleHint={activeTab as any}
        onSuccessRedirect={() => setMode("login")}
      />
    </>
  )
}
