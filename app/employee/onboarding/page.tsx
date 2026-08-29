"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, setTokens } from "@/lib/apiClient"
import {
  Building2,
  HardHat,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Loader2,
  AlertCircle,
  LogOut,
} from "lucide-react"
import confetti from "canvas-confetti"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function EmployeeOnboardingPage() {
  const router = useRouter()
  const { user, setUser, signOut } = useAuth()

  // Stepper state: 1 = Profile details, 2 = Company code & link, 3 = Completed celebration
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [companyCode, setCompanyCode] = useState("")

  // Company Validation State
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [validatedCompany, setValidatedCompany] = useState<{ id: string | number; company_id: string; company_name: string } | null>(null)
  const [validationError, setValidationError] = useState("")

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Prefill initial user data from Google / Auth context
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      if (user.phone) setPhone(user.phone)
      if (user.position) setPosition(user.position)
      if (user.department) setDepartment(user.department)

      // If user already has a company_id linked, redirect directly to employee portal
      if (user.company_id || user.companyId) {
        router.push("/employee")
      }
    }
  }, [user, router])

  // Live Company Code Validator
  const handleValidateCompany = async (codeToVerify?: string) => {
    const code = (codeToVerify || companyCode).trim().toUpperCase()
    if (!code) {
      setValidationError("Please enter a company code")
      setValidatedCompany(null)
      return
    }

    setIsValidatingCode(true)
    setValidationError("")
    try {
      const res = await apiClient.post("/api/auth/validate-company", { company_code: code })
      if (res.valid) {
        setValidatedCompany({
          id: res.company_id,
          company_id: code,
          company_name: res.company_name,
        })
        setValidationError("")
      } else {
        setValidatedCompany(null)
        setValidationError("Company code not found. Please verify with your employer.")
      }
    } catch (err: any) {
      setValidatedCompany(null)
      setValidationError(err.message || "Failed to verify company code. Try again.")
    } finally {
      setIsValidatingCode(false)
    }
  }

  // Handle Step 1 Next
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (!name.trim()) {
      setFormError("Full name is required")
      return
    }
    setStep(2)
  }

  // Handle Complete Onboarding & Link Account
  const handleCompleteOnboarding = async () => {
    if (!companyCode.trim()) {
      setValidationError("Company code is required to complete onboarding")
      return
    }

    setIsSubmitting(true)
    setFormError("")
    try {
      const response = await apiClient.post("/api/auth/employee/onboarding", {
        name: name.trim(),
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
        department: department.trim() || undefined,
        company_code: companyCode.trim().toUpperCase(),
      })

      if (response.ok && response.user) {
        // 1. Update JWT tokens in storage & context
        if (response.accessToken) {
          setTokens(response.accessToken, response.refreshToken || "", false)
        }

        // 2. Persist fresh user profile
        localStorage.setItem("smarterp_user", JSON.stringify(response.user))
        if (response.user.company_code) {
          localStorage.setItem("company_code", response.user.company_code)
        }
        setUser(response.user)

        // 3. Move to celebration step & trigger confetti
        setStep(3)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        // 4. Smooth auto-transition into employee dashboard after 2.5s
        setTimeout(() => {
          window.location.href = "/employee"
        }, 2500)
      } else {
        throw new Error(response.message || "Failed to complete onboarding")
      }
    } catch (err: any) {
      setFormError(err.message || "Unable to link company. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      {/* Top Header & Sign Out Action */}
      <header className="w-full max-w-xl flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">SmartERP</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              Staff Setup
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </Button>
      </header>

      {/* Main Glass Card */}
      <Card className="w-full max-w-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl z-10 overflow-hidden">
        {/* Progress Bar / Stepper Header */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 1
                    ? "bg-primary text-white shadow-[0_2px_8px_rgba(59,130,246,0.4)]"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                1
              </div>
              <span className={`text-xs font-semibold ${step >= 1 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                Staff Profile
              </span>
            </div>

            <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700 mx-2" />

            <div className="flex items-center gap-3">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= 2
                    ? "bg-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold ${step >= 2 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                Connect Company
              </span>
            </div>

            <div className="h-0.5 w-12 bg-slate-200 dark:bg-slate-700 mx-2" />

            <div className="flex items-center gap-3">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3
                    ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                }`}
              >
                3
              </div>
              <span className={`text-xs font-semibold ${step === 3 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                Ready
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          {/* ═══════════════════════════════════════════════════════════
              STEP 1: PROFILE DETAILS
          ═══════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md mb-1">
                  <User className="h-3.5 w-3.5" /> Step 1 of 2
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome! Confirm Your Details
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your Google identity has been authenticated. Please verify your contact information for the team directory.
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4 pt-1">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-name" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="onboard-name"
                      type="text"
                      placeholder="e.g. Alex Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Email (Read-Only / Verified from Google) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="onboard-email" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Google Account Email
                    </Label>
                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[11px] gap-1 py-0.5">
                      <ShieldCheck className="h-3 w-3" /> Verified by Google
                    </Badge>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="onboard-email"
                      type="email"
                      value={email}
                      disabled
                      className="pl-10 h-11 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Contact Phone Number <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="onboard-phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Role / Designation & Department Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="onboard-pos" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Position / Role <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="onboard-pos"
                        type="text"
                        placeholder="e.g. CNC Operator"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="onboard-dept" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Department <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="onboard-dept"
                        type="text"
                        placeholder="e.g. Maintenance"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-[0_4px_16px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  Continue to Organization Link <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 2: CONNECT COMPANY CODE
          ═══════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md mb-1">
                  <HardHat className="h-3.5 w-3.5" /> Step 2 of 2
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Enter Your Company Code
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter the unique Company ID provided by your business owner or HR manager to link your staff portal.
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Company Code Input & Live Check */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-code" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Company Code <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="onboard-code"
                        type="text"
                        placeholder="e.g. SMR1001 or CMP-4892"
                        value={companyCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase()
                          setCompanyCode(val)
                          if (val.length >= 4) {
                            handleValidateCompany(val)
                          } else {
                            setValidatedCompany(null)
                            setValidationError("")
                          }
                        }}
                        className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-base tracking-widest uppercase placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleValidateCompany()}
                      disabled={isValidatingCode || !companyCode.trim()}
                      className="h-12 px-4 rounded-xl font-semibold text-xs border-slate-200 dark:border-slate-700"
                    >
                      {isValidatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    If you do not have a code, ask your employer for their SmartERP Company Code.
                  </p>
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Validated Company Preview Card */}
                {validatedCompany && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {validatedCompany.company_name}
                          </span>
                          <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">Verified</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          ID: {validatedCompany.company_id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl text-slate-600 dark:text-slate-400 gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>

                <Button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={isSubmitting || !companyCode.trim()}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Linking Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Join Company &amp; Enter Portal
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 3: CELEBRATION & REDIRECT
          ═══════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-400">
              <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome to the Team, {name}!
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm">
                  You have successfully joined <span className="font-bold text-slate-900 dark:text-white">{validatedCompany?.company_name || "your organization"}</span>.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-primary pt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting you to your employee dashboard...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
