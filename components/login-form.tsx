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
import { apiClient } from "@/lib/apiClient"
import { useAuth } from "@/contexts/auth-context"
import { Building2, Loader2, HardHat, UserPlus, CheckCircle2, RefreshCw, Mail } from "lucide-react"
import { PremiumBackground } from "./premium-background"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

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
  const { setUser } = useAuth()
  const router = useRouter()

  // ── OTP Modal state ──────────────────────────────────────────────────────
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Hold pending signup data while waiting for OTP
  const pendingSignupRef = useRef<any>(null)

  // ── Handle Error from Redirect (e.g. Google Auth) ─────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const errorParam = urlParams.get("error")
      if (errorParam === "account_suspended") {
        router.push("/suspended")
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

  // ── Send OTP ─────────────────────────────────────────────────────────────
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

  // ── Verify OTP and complete signup ────────────────────────────────────────
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

      // 2. OTP verified — create the account
      const user = await signUp(pendingSignupRef.current)
      if (user) {
        setShowOtpModal(false)
        setOtp("")
        pendingSignupRef.current = null
        setSuccess("Account created successfully! You can now sign in.")
        setMode("login")
        setPassword(""); setName(""); setPhone(""); setPosition(""); setDepartment("")
      } else {
        setOtpError("Account creation failed. Email may already exist.")
      }
    } catch (err: any) {
      setOtpError(err.message || "Verification failed. Please try again.")
    } finally {
      setOtpVerifying(false)
    }
  }

  // ── Main form submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (mode === "login") {
        const user: any = await signIn(email, password)
        if (user) {
          if (user.accessToken) localStorage.setItem("accessToken", user.accessToken)
          if (user.refreshToken) localStorage.setItem("refreshToken", user.refreshToken)

          // ✅ Sync tokens with Android native bridge if available
          if (typeof window !== "undefined" && (window as any).Android?.saveToken) {
            (window as any).Android.saveToken(user.accessToken, user.refreshToken || null)
          }

          localStorage.setItem("user", JSON.stringify(user))
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
        // Signup — validate then show OTP modal
        if (!name.trim()) { setError("Full name is required"); setIsLoading(false); return }
        if (password.length < 6) { setError("Password must be at least 6 characters long"); setIsLoading(false); return }

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
      {/* ── OTP Verification Modal ───────────────────────────────────────── */}
      <Dialog open={showOtpModal} onOpenChange={(open) => { if (!open) { setShowOtpModal(false); setOtp(""); setOtpError("") } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-7 w-7 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center">Verify Your Email</DialogTitle>
            <DialogDescription className="text-center">
              We sent a 6-digit code to<br />
              <strong className="text-foreground">{pendingSignupRef.current?.email}</strong>
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
              className="text-center text-2xl font-mono tracking-[0.5em] focus:shadow-lg transition-all"
              autoFocus
            />

            {otpError && (
              <Alert variant="destructive">
                <AlertDescription>{otpError}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleVerifyAndSignup}
              disabled={otpVerifying || otp.length !== 6}
            >
              {otpVerifying
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</>
                : <><CheckCircle2 className="mr-2 h-4 w-4" />Verify &amp; Create Account</>
              }
            </Button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-muted-foreground">Resend code in {resendCooldown}s</p>
              ) : (
                <button
                  type="button"
                  onClick={() => sendOtp(pendingSignupRef.current?.email)}
                  disabled={otpSending}
                  className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  {otpSending ? "Sending…" : "Resend code"}
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Code expires in 10 minutes
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Main Login / Signup Form (unchanged from original) ────────────── */}
      <div className="min-h-screen flex items-center justify-center relative p-4 animate-fade-in-up">
        {/* The new premium animated background injected behind the card */}
        <PremiumBackground />

        <Card className="w-full max-w-md relative z-10 animate-fade-in-up stagger-2 hover-lift border-2 hover:border-primary/20 transition-all duration-500">
          <CardHeader className="text-center animate-fade-in-down stagger-1">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-full animate-scale-in stagger-2 hover-scale animate-float">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in-left stagger-3">
              SmartERP
            </CardTitle>
            <CardDescription className="animate-fade-in-up stagger-4">
              {mode === "login" ? "Sign in to your account" : "Create your crew management account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="animate-fade-in-up stagger-3">
            {/* Google Sign-In */}
            <div className="mb-6">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 hover:bg-slate-50 transition-all duration-300 hover-lift group"
                onClick={() => {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"
                  window.location.href = `${apiUrl}/api/auth/google?role=${activeTab}`
                }}
              >
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
            </div>

            {/* Owner / Employee Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger
                  value="owner"
                  className="flex items-center gap-2 transition-all duration-300 hover-scale data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg animate-press"
                >
                  <Building2 className="h-4 w-4" />Owner
                </TabsTrigger>
                <TabsTrigger
                  value="employee"
                  className="flex items-center gap-2 transition-all duration-300 hover-scale data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg animate-press"
                >
                  <HardHat className="h-4 w-4" />Employee
                </TabsTrigger>
              </TabsList>

              <div className={`mt-6 transition-all duration-300 ${isFlipping ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>

                {/* ── OWNER TAB ────────────────────────────────────────────── */}
                <TabsContent value="owner" className="animate-fade-in-right stagger-1">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-2 animate-slide-up stagger-1">
                        <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                        <Input id="name" type="text" placeholder="Enter your full name" value={name}
                          onChange={(e) => setName(e.target.value)} required
                          className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                      </div>
                    )}
                    <div className="space-y-2 animate-slide-up stagger-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                    </div>
                    <div className="space-y-2 animate-slide-up stagger-3">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <Input id="password" type="password" placeholder="Enter your password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                        className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                    </div>
                    {mode === "signup" && (
                      <div className="space-y-2 animate-slide-up stagger-4">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number (Optional)</Label>
                        <Input id="phone" type="tel" placeholder="Enter your phone number" value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                      </div>
                    )}
                    {error && <Alert variant="destructive" className="animate-fade-in-up"><AlertDescription>{error}</AlertDescription></Alert>}
                    {success && <Alert className="animate-fade-in-up border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}
                    <Button type="submit" className="w-full transition-all duration-300 hover-lift hover-scale animate-press" disabled={isLoading}>
                      {isLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === "login" ? "Signing in..." : "Sending OTP..."}</>
                        : mode === "login" ? "Sign In as Owner" : "Create Owner Account"
                      }
                    </Button>
                  </form>
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg animate-fade-in-up stagger-5 hover:bg-primary/20 transition-colors duration-300 hover-lift">
                    <p className="text-sm text-center text-foreground font-medium">
                      <Building2 className="h-4 w-4 inline mr-1 animate-float text-primary" />
                      Access full business management features
                    </p>
                  </div>
                </TabsContent>

                {/* ── EMPLOYEE TAB ──────────────────────────────────────────── */}
                <TabsContent value="employee" className="animate-fade-in-left stagger-1">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-2 animate-slide-up stagger-1">
                        <Label htmlFor="name-emp" className="text-sm font-medium">Full Name</Label>
                        <Input id="name-emp" type="text" placeholder="Enter your full name" value={name}
                          onChange={(e) => setName(e.target.value)} required
                          className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                      </div>
                    )}
                    <div className="space-y-2 animate-slide-up stagger-2">
                      <Label htmlFor="email-emp" className="text-sm font-medium">Email</Label>
                      <Input id="email-emp" type="email" placeholder="Enter your email" value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                    </div>
                    <div className="space-y-2 animate-slide-up stagger-3">
                      <Label htmlFor="password-emp" className="text-sm font-medium">Password</Label>
                      <Input id="password-emp" type="password" placeholder="Enter your password" value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                        className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                    </div>
                    {mode === "signup" && (
                      <>
                        <div className="space-y-2 animate-slide-up stagger-4">
                          <Label htmlFor="company_code" className="text-sm font-medium">
                            Company Code <span className="text-red-500">*</span>
                          </Label>
                          <Input id="company_code" type="text" placeholder="Enter the code from your employer"
                            value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} required
                            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift font-mono tracking-widest" />
                          <p className="text-xs text-muted-foreground">Ask your employer for the company code (e.g. SMR1001)</p>
                        </div>
                        <div className="space-y-2 animate-slide-up stagger-5">
                          <Label htmlFor="phone-emp" className="text-sm font-medium">Phone Number (Optional)</Label>
                          <Input id="phone-emp" type="tel" placeholder="Enter your phone number" value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                        </div>
                        <div className="space-y-2 animate-slide-up stagger-6">
                          <Label htmlFor="position" className="text-sm font-medium">Position (Optional)</Label>
                          <Input id="position" type="text" placeholder="e.g., Site Supervisor, Foreman"
                            value={position} onChange={(e) => setPosition(e.target.value)}
                            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                        </div>
                        <div className="space-y-2 animate-slide-up stagger-6">
                          <Label htmlFor="department" className="text-sm font-medium">Department (Optional)</Label>
                          <Input id="department" type="text" placeholder="e.g., Construction, Electrical"
                            value={department} onChange={(e) => setDepartment(e.target.value)}
                            className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg hover-lift" />
                        </div>
                      </>
                    )}
                    {error && <Alert variant="destructive" className="animate-fade-in-up"><AlertDescription>{error}</AlertDescription></Alert>}
                    {success && <Alert className="animate-fade-in-up border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}
                    <Button type="submit"
                      className="w-full bg-accent hover:bg-accent/90 transition-all duration-300 hover-lift hover-scale animate-press"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === "login" ? "Signing in..." : "Sending OTP..."}</>
                        : mode === "login" ? "Sign In as Employee" : "Create Employee Account"
                      }
                    </Button>
                  </form>
                  <div className="mt-4 p-3 bg-accent/10 rounded-lg animate-fade-in-up stagger-5 hover:bg-accent/20 transition-colors duration-300 hover-lift">
                    <p className="text-sm text-center text-foreground font-medium">
                      <HardHat className="h-4 w-4 inline mr-1 animate-float text-accent" />
                      Access your jobs, time tracking &amp; more
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <div className="mt-6 text-center animate-fade-in-up stagger-6">
              <Button variant="ghost" onClick={toggleMode}
                className="text-sm hover-scale transition-all duration-300 hover:bg-primary/10 animate-press">
                <UserPlus className="h-4 w-4 mr-2" />
                {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
