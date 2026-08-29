"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, setTokens } from "@/lib/apiClient"
import {
  Building2,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Loader2,
  AlertCircle,
  LogOut,
  Search,
  Lock,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// Animation variants for smooth step transitions
const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
}

const itemFade = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

type OnboardingStep = "profile" | "company" | "linking" | "success"

interface ValidatedCompanyData {
  id: string | number
  company_id: string
  company_name: string
}

export default function EmployeeOnboardingPage() {
  const router = useRouter()
  const { user, setUser, signOut } = useAuth()

  // Stepper State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile")

  // Form State
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [department, setDepartment] = useState("")
  const [companyCode, setCompanyCode] = useState("")

  // Company Verification Flow State
  const [verifyState, setVerifyState] = useState<"idle" | "searching" | "found" | "error" | "suspended">("idle")
  const [searchPhase, setSearchPhase] = useState<string>("Checking directory...")
  const [validatedCompany, setValidatedCompany] = useState<ValidatedCompanyData | null>(null)
  const [verificationErrorMessage, setVerificationErrorMessage] = useState("")

  // Final Linking Animation Progress State (0 to 4)
  const [linkingPhase, setLinkingPhase] = useState<number>(0)
  const [formError, setFormError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const codeInputRef = useRef<HTMLInputElement>(null)

  // Prefill initial user data from Google / Auth state
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      if (user.phone) setPhone(user.phone)
      if (user.position) setPosition(user.position)
      if (user.department) setDepartment(user.department)

      // If user is already part of a company, redirect to portal
      if (user.company_id || user.companyId) {
        router.push("/employee")
      }
    }
  }, [user, router])

  // Step 1: Submit Profile
  const handleProfileContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (!name.trim()) {
      setFormError("Please enter your full name.")
      return
    }
    setCurrentStep("company")
  }

  // Step 2: Live Verify Company Code with Real API & Micro-Sequences
  const handleVerifyCompanyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanCode = companyCode.trim().toUpperCase()
    if (!cleanCode) {
      setVerificationErrorMessage("Please enter your organization company code.")
      setVerifyState("error")
      return
    }

    setVerifyState("searching")
    setSearchPhase("Querying SmartERP organization directory...")
    setVerificationErrorMessage("")
    setValidatedCompany(null)

    try {
      const startTime = Date.now()
      const res = await apiClient.post("/api/auth/validate-company", { company_code: cleanCode })
      const elapsed = Date.now() - startTime

      // Ensure a smooth, non-jarring verification cadence (min 400ms)
      if (elapsed < 400) {
        await new Promise((r) => setTimeout(r, 400 - elapsed))
      }

      if (res.valid) {
        setSearchPhase("Workspace connection verified.")
        setValidatedCompany({
          id: res.company_id,
          company_id: cleanCode,
          company_name: res.company_name || "Company Workspace",
        })
        setVerifyState("found")
      } else {
        setVerifyState("error")
        setVerificationErrorMessage("We couldn't find that company code. Check with your employer and try again.")
      }
    } catch (err: any) {
      const errMsg = err.message || ""
      if (errMsg.toLowerCase().includes("suspended")) {
        setVerifyState("suspended")
        setVerificationErrorMessage("Workspace currently unavailable. Please contact your organization administrator.")
      } else {
        setVerifyState("error")
        setVerificationErrorMessage(errMsg || "We couldn't verify this company code. Please try again.")
      }
    }
  }

  // Step 2.5: Secure Account Linking Execution
  const handleJoinWorkspace = async () => {
    if (!companyCode.trim() || !validatedCompany) return
    setIsProcessing(true)
    setCurrentStep("linking")
    setLinkingPhase(1) // 01 Verifying account

    try {
      // Step 1: Call real onboarding mutation
      const responsePromise = apiClient.post("/api/auth/employee/onboarding", {
        name: name.trim(),
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
        department: department.trim() || undefined,
        company_code: companyCode.trim().toUpperCase(),
      })

      // Cadence updates for natural real-world linking feedback
      await new Promise((r) => setTimeout(r, 300))
      setLinkingPhase(2) // 02 Securing workspace connection

      await new Promise((r) => setTimeout(r, 350))
      setLinkingPhase(3) // 03 Linking employee profile

      const response = await responsePromise

      if (response.ok && response.user) {
        setLinkingPhase(4) // 04 Preparing workspace

        // Persist session tokens & user state
        if (response.accessToken) {
          setTokens(response.accessToken, response.refreshToken || "", false)
        }
        localStorage.setItem("smarterp_user", JSON.stringify(response.user))
        if (response.user.company_code) {
          localStorage.setItem("company_code", response.user.company_code)
        }
        setUser(response.user)

        await new Promise((r) => setTimeout(r, 350))
        setCurrentStep("success")

        // Smooth automatic transition into dashboard
        setTimeout(() => {
          window.location.href = "/employee"
        }, 2200)
      } else {
        throw new Error(response.message || "Failed to link company")
      }
    } catch (err: any) {
      setIsProcessing(false)
      setCurrentStep("company")
      setVerifyState("error")
      setVerificationErrorMessage(err.message || "Unable to link company. Please retry.")
    }
  }

  // Get initials for avatar
  const getInitials = (text: string) => {
    if (!text) return "EM"
    const parts = text.trim().split(" ")
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[#fafbfc] dark:bg-[#090d16] relative overflow-hidden selection:bg-primary/20">
      {/* Subtle Background Glow Elements (Apple/Linear aesthetic) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-gradient-to-b from-blue-500/8 to-indigo-500/0 blur-[120px] dark:from-blue-600/12" />
        <div className="absolute -bottom-[20%] right-[10%] w-[500px] h-[300px] rounded-full bg-gradient-to-t from-amber-500/6 to-transparent blur-[100px] dark:from-amber-600/8" />
      </div>

      {/* Top Header & Navigation Bar */}
      <header className="w-full max-w-xl flex items-center justify-between mb-5 z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[0.95rem] text-slate-900 dark:text-slate-100 tracking-tight">SmartERP</span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-0.5">
              Workspace Setup
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 gap-1.5 h-8 rounded-lg"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </Button>
      </header>

      {/* Progress Stepper Indicator */}
      <nav aria-label="Onboarding Progress" className="w-full max-w-xl mb-6 z-10 px-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          {/* Step 1: Profile */}
          <div className="flex items-center gap-2">
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                currentStep === "profile"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-4 ring-slate-900/10 dark:ring-white/15"
                  : "bg-emerald-500 text-white"
              }`}
            >
              {currentStep === "profile" ? "01" : <Check className="h-3 w-3 stroke-[3]" />}
            </div>
            <span
              className={`${
                currentStep === "profile"
                  ? "text-slate-900 dark:text-white font-bold"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Profile
            </span>
          </div>

          <div className="flex-1 mx-3 h-[1.5px] bg-slate-200 dark:bg-slate-800 relative overflow-hidden rounded-full">
            <div
              className={`h-full bg-slate-900 dark:bg-white transition-all duration-500 ease-out ${
                currentStep === "profile" ? "w-0" : "w-full"
              }`}
            />
          </div>

          {/* Step 2: Company */}
          <div className="flex items-center gap-2">
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                currentStep === "company" || currentStep === "linking"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-4 ring-slate-900/10 dark:ring-white/15"
                  : currentStep === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
              }`}
            >
              {currentStep === "success" ? <Check className="h-3 w-3 stroke-[3]" /> : "02"}
            </div>
            <span
              className={`${
                currentStep === "company" || currentStep === "linking"
                  ? "text-slate-900 dark:text-white font-bold"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Company
            </span>
          </div>

          <div className="flex-1 mx-3 h-[1.5px] bg-slate-200 dark:bg-slate-800 relative overflow-hidden rounded-full">
            <div
              className={`h-full bg-slate-900 dark:bg-white transition-all duration-500 ease-out ${
                currentStep === "success" ? "w-full" : "w-0"
              }`}
            />
          </div>

          {/* Step 3: Workspace */}
          <div className="flex items-center gap-2">
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                currentStep === "success"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-4 ring-slate-900/10 dark:ring-white/15"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
              }`}
            >
              03
            </div>
            <span
              className={`${
                currentStep === "success"
                  ? "text-slate-900 dark:text-white font-bold"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Workspace
            </span>
          </div>
        </div>
      </nav>

      {/* Main Experience Surface Container */}
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0d131f] shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl z-10 overflow-hidden">
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════════════
                SCREEN 1: WELCOME & PROFILE SETUP
            ══════════════════════════════════════════════════════════════ */}
            {currentStep === "profile" && (
              <motion.div
                key="step-profile"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <h1 className="text-[1.45rem] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Welcome to SmartERP
                  </h1>
                  <p className="text-[0.875rem] text-slate-500 dark:text-slate-400">
                    Let's get your employee workspace ready.
                  </p>
                </div>

                {/* Google Account Profile Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {getInitials(name)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                        {name || "Employee"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {email}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] gap-1 py-1 px-2.5 font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Google Verified
                  </Badge>
                </div>

                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </motion.div>
                )}

                {/* Form Inputs */}
                <form onSubmit={handleProfileContinue} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="emp-name"
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="emp-name"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-10 h-10 rounded-xl bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm font-medium focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="emp-phone"
                      className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                    >
                      Phone Number <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="emp-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm font-medium focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="emp-pos"
                        className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                      >
                        Position / Role <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="emp-pos"
                          type="text"
                          placeholder="e.g. CNC Technician"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className="pl-10 h-10 rounded-xl bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-medium focus:bg-white dark:focus:bg-slate-950"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="emp-dept"
                        className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                      >
                        Department <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="emp-dept"
                          type="text"
                          placeholder="e.g. Operations"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="pl-10 h-10 rounded-xl bg-slate-50/60 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-medium focus:bg-white dark:focus:bg-slate-950"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold text-sm shadow-sm transition-all gap-2"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SCREEN 2: COMPANY CODE VERIFICATION & DISCOVERY
            ══════════════════════════════════════════════════════════════ */}
            {currentStep === "company" && (
              <motion.div
                key="step-company"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <h2 className="text-[1.45rem] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Connect your workspace
                  </h2>
                  <p className="text-[0.875rem] text-slate-500 dark:text-slate-400">
                    Enter the company code provided by your organization.
                  </p>
                </div>

                {/* Verification Scanning Sequence */}
                {verifyState === "searching" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center space-y-3"
                  >
                    <div className="h-10 w-10 mx-auto rounded-full bg-blue-500/10 text-primary flex items-center justify-center">
                      <Search className="h-5 w-5 animate-pulse text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        Searching for your company code...
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {searchPhase}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Company Code Input Form (when not searching or found) */}
                {verifyState !== "searching" && verifyState !== "found" && (
                  <form onSubmit={handleVerifyCompanyCode} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="company-code-input"
                          className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                        >
                          Company Code
                        </Label>
                        <span className="text-[11px] text-slate-400 font-mono">e.g. PRO-4892</span>
                      </div>

                      <div className="relative">
                        <Input
                          id="company-code-input"
                          ref={codeInputRef}
                          type="text"
                          placeholder="PRO-XXXX"
                          value={companyCode}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/\s+/g, "")
                            setCompanyCode(val)
                            if (verifyState === "error") setVerifyState("idle")
                          }}
                          className="h-13 text-center text-lg font-mono font-bold tracking-[0.18em] rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase placeholder:tracking-normal placeholder:font-normal placeholder:text-sm placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:border-slate-900 dark:focus:border-white transition-all"
                          autoFocus
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed text-center pt-1">
                        Your company code connects your account to the correct SmartERP workspace.
                      </p>
                    </div>

                    {/* Error State Banner */}
                    {verifyState === "error" && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-center"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>We couldn't find that company code.</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {verificationErrorMessage || "Check the code provided by your employer and try again."}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVerifyState("idle")
                            codeInputRef.current?.focus()
                          }}
                          className="text-xs font-semibold text-slate-800 dark:text-slate-200 h-8 gap-1.5"
                        >
                          <RefreshCw className="h-3 w-3" /> Try Again
                        </Button>
                      </motion.div>
                    )}

                    {/* Suspended State Banner */}
                    {verifyState === "suspended" && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-1"
                      >
                        <p className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                          Workspace currently unavailable
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Please contact your organization administrator.
                        </p>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep("profile")}
                        className="h-10 rounded-xl text-slate-600 dark:text-slate-400 gap-1.5"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>

                      <Button
                        type="submit"
                        disabled={!companyCode.trim()}
                        className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold text-sm shadow-sm gap-2"
                      >
                        Verify Company <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}

                {/* Company Discovered Card */}
                {verifyState === "found" && validatedCompany && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Discovered Card Surface */}
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base flex items-center justify-center shadow-sm">
                          {getInitials(validatedCompany.company_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                              {validatedCompany.company_name}
                            </h3>
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0 font-semibold gap-1 shrink-0">
                              <Check className="h-3 w-3 stroke-[3]" /> Verified
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            SmartERP Workspace &middot; <span className="font-mono">{validatedCompany.company_id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Joining workspace as</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 tracking-wide">EMPLOYEE</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <Lock className="h-3 w-3 text-emerald-500" />
                      <span>Securely verified company association</span>
                    </div>

                    {/* Join Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setVerifyState("idle")
                          setValidatedCompany(null)
                        }}
                        className="h-10 rounded-xl text-slate-600 dark:text-slate-400 gap-1.5"
                      >
                        Change Code
                      </Button>

                      <Button
                        type="button"
                        onClick={handleJoinWorkspace}
                        className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm gap-2"
                      >
                        Join Workspace <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SCREEN 2.5: SYNCHRONIZED SECURE LINKING PROGRESS
            ══════════════════════════════════════════════════════════════ */}
            {currentStep === "linking" && (
              <motion.div
                key="step-linking"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="py-5 space-y-6 text-center"
              >
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Connecting your workspace
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Finalizing employee registration for {validatedCompany?.company_name}...
                  </p>
                </div>

                {/* Progress Status Steps */}
                <div className="max-w-xs mx-auto space-y-3 text-left">
                  {[
                    { id: 1, label: "Verifying account identity" },
                    { id: 2, label: "Securing workspace connection" },
                    { id: 3, label: "Linking employee profile" },
                    { id: 4, label: "Preparing your workspace" },
                  ].map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1">
                      <span
                        className={`font-medium ${
                          linkingPhase >= s.id
                            ? "text-slate-900 dark:text-slate-100"
                            : "text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        0{s.id} {s.label}
                      </span>
                      {linkingPhase > s.id ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : linkingPhase === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SCREEN 3: WORKSPACE READY & CELEBRATION
            ══════════════════════════════════════════════════════════════ */}
            {currentStep === "success" && (
              <motion.div
                key="step-success"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="py-6 flex flex-col items-center justify-center text-center space-y-5"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm"
                >
                  <Check className="h-8 w-8 stroke-[2.5]" />
                </motion.div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    You're all set.
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Welcome to <span className="font-bold text-slate-900 dark:text-white">{validatedCompany?.company_name || "your organization"}</span>.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Your SmartERP employee workspace is ready.
                  </p>
                </div>

                {/* Summary checklist */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 w-full max-w-sm text-xs space-y-1.5 text-left text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Profile completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Company verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Workspace connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Employee access activated</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Entering your workspace...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
