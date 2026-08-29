"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import {
  AlertTriangle,
  Trash2,
  Lock,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  UserX,
  FileText,
  Clock
} from "lucide-react"

interface DangerZoneProps {
  portalType?: "staff" | "customer"
  userRole?: string
  userEmail?: string
}

export function DangerZoneAccountDeletion({
  portalType = "staff",
  userRole,
  userEmail
}: DangerZoneProps) {
  const { toast } = useToast()
  const router = useRouter()
  const auth = useAuth()
  const signOut = auth?.signOut

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<"challenge" | "confirm" | "success">("challenge")

  // Form states
  const [password, setPassword] = useState("")
  const [reason, setReason] = useState("")
  const [challengeToken, setChallengeToken] = useState("")
  const [confirmPhrase, setConfirmPhrase] = useState("")
  const [isOwnerBlocked, setIsOwnerBlocked] = useState(false)
  const [blockMessage, setBlockMessage] = useState("")

  // Loading states
  const [requesting, setRequesting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const isCustomer = portalType === "customer"
  const requestEndpoint = isCustomer
    ? "/api/customer/profile/deletion/request"
    : "/api/account/deletion/request"
  const confirmEndpoint = isCustomer
    ? "/api/customer/profile/deletion/confirm"
    : "/api/account/deletion/confirm"

  const [authMode, setAuthMode] = useState<"password" | "otp">("password")
  const [otpCode, setOtpCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState("")

  const activeEmail = userEmail || auth?.user?.email || ""

  const handleOpenModal = () => {
    setStep("challenge")
    setAuthMode("password")
    setPassword("")
    setOtpCode("")
    setNewPassword("")
    setReason("")
    setConfirmPhrase("")
    setChallengeToken("")
    setIsOwnerBlocked(false)
    setBlockMessage("")
    setOtpSent(false)
    setOtpError("")
    setIsOpen(true)
  }

  // Send OTP for Google / Passwordless users
  const handleSendOtp = async () => {
    if (!activeEmail) {
      toast({
        title: "Email Missing",
        description: "Could not find your registered email address.",
        variant: "destructive"
      })
      return
    }

    setIsSendingOtp(true)
    setOtpError("")
    try {
      const res = await apiClient("/api/auth/send-otp", { 
        method: "POST",
        body: JSON.stringify({ email: activeEmail, type: "account_deletion" }) 
      })
      setOtpSent(true)
      toast({
        title: "Verification Code Sent",
        description: `A 6-digit OTP code has been sent to ${activeEmail}.`
      })
    } catch (err: any) {
      setOtpError(err?.message || "Failed to send verification code.")
      toast({
        title: "Failed to Send OTP",
        description: err?.message || "Please check your network and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Step 1: Request Deletion Challenge (Password or OTP)
  const handleRequestChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequesting(true)
    setIsOwnerBlocked(false)
    setOtpError("")

    try {
      // If user provided a new password along with OTP, first set their password
      if (authMode === "otp" && otpCode.trim() && newPassword.trim()) {
        const resetRes = await apiClient("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            email: activeEmail,
            otp: otpCode.trim(),
            new_password: newPassword.trim()
          })
        })
        if (resetRes.ok || resetRes.success) {
          toast({
            title: "Password Set Successfully",
            description: "Your account password has been updated and verified."
          })
        }
      }

      const payload: any = {
        reason: reason.trim() || undefined
      }

      if (authMode === "password") {
        payload.password = password.trim() || undefined
      } else {
        payload.otp = otpCode.trim() || undefined
      }

      const res = await apiClient(requestEndpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res.success && res.challengeToken) {
        setChallengeToken(res.challengeToken)
        setStep("confirm")
      } else {
        toast({
          title: "Verification Failed",
          description: res.message || "Failed to initiate deletion request.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      if (err?.requiresOwnershipTransfer || err?.status === 403) {
        setIsOwnerBlocked(true)
        setBlockMessage(
          err?.message ||
          "You are the sole Owner of an active company. Please transfer ownership to another administrator before deleting your account."
        )
      } else {
        toast({
          title: "Deletion Request Rejected",
          description: err?.message || "Invalid credentials or authorization failure.",
          variant: "destructive"
        })
      }
    } finally {
      setRequesting(false)
    }
  }

  // Step 2: Final Confirmation
  const handleExecuteDeletion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmPhrase.trim() !== "DELETE MY ACCOUNT") {
      toast({
        title: "Phrase Mismatch",
        description: 'Please type "DELETE MY ACCOUNT" exactly as shown.',
        variant: "destructive"
      })
      return
    }

    setConfirming(true)
    try {
      const res = await apiClient(confirmEndpoint, {
        method: "POST",
        body: JSON.stringify({
          challenge_token: challengeToken,
          confirmation_phrase: confirmPhrase.trim(),
          reason: reason.trim() || undefined
        })
      })

      if (res.success) {
        setStep("success")
        toast({
          title: "Account Permanently Deleted",
          description: "Your personal data has been erased. Signing out..."
        })

        setTimeout(async () => {
          setIsOpen(false)
          try {
            if (signOut) await signOut()
          } catch (_) {}
          localStorage.clear()
          sessionStorage.clear()
          router.replace(isCustomer ? "/customer/login" : "/auth/login")
        }, 2200)
      }
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err?.message || "Could not complete account deletion. Please try again.",
        variant: "destructive"
      })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <>
      {/* ── Danger Zone Card ── */}
      <Card className="border-red-200 dark:border-red-950/70 bg-gradient-to-br from-red-50/40 via-white to-orange-50/20 dark:from-red-950/15 dark:to-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-red-950 dark:text-red-200">
                Danger Zone: Account Deletion & Data Erasure
              </CardTitle>
              <CardDescription className="text-xs text-red-800/80 dark:text-red-400/70">
                Permanently erase personal credentials, login sessions, and profile data in accordance with DPDP privacy rights.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-xl border border-red-200/80 dark:border-red-900/50 bg-white/70 dark:bg-black/30 text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Irreversible Action:</strong> Account deletion will permanently purge your user profile, active sessions, and access permissions.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Statutory Record Retention:</strong> In compliance with Indian tax & labor laws, business invoices, tax filings, and attendance records already submitted to your company will remain archived for 8 years as required by law.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <UserX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                <strong>Personal Data Erasure:</strong> Your contact number, hashed credentials, personal tokens, and session tokens will be permanently erased.
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-red-100 dark:border-red-950">
            <div className="text-xs text-slate-500 font-mono">
              Account: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeEmail || "Current User"}</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleOpenModal}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Multi-Step Confirmation Modal ── */}
      <Dialog open={isOpen} onOpenChange={(open) => !requesting && !confirming && setIsOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          {step === "challenge" && (
            <form onSubmit={handleRequestChallenge}>
              <DialogHeader>
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertTriangle className="h-5 w-5" />
                  <DialogTitle className="text-lg">Delete Account Verification</DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  Please verify your credentials to initialize the secure account deletion challenge.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                {isOwnerBlocked ? (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle className="text-xs font-bold">Ownership Transfer Required</AlertTitle>
                    <AlertDescription className="text-xs mt-1 leading-relaxed">
                      {blockMessage}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-900 dark:text-amber-200">
                      This action is permanent and cannot be undone. All active sessions across all devices will be immediately terminated.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Mode Selector Tabs */}
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode("password")}
                    className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                      authMode === "password"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Account Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp")
                      if (!otpSent) handleSendOtp()
                    }}
                    className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                      authMode === "otp"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Email OTP Verification (Google Users)
                  </button>
                </div>

                {/* Password Mode */}
                {authMode === "password" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Account Password</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                        className="text-xs pr-9"
                      />
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-0.5">
                      <span>Created account with Google or forgot password?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("otp")
                          if (!otpSent) handleSendOtp()
                        }}
                        className="text-primary hover:underline font-semibold"
                      >
                        Verify with Email OTP
                      </button>
                    </div>
                  </div>
                )}

                {/* Email OTP Mode (For Google OAuth or Passwordless Accounts) */}
                {authMode === "otp" && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">Email Verification Code</Label>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          {isSendingOtp ? "Sending code..." : otpSent ? "Resend OTP Code" : "Send OTP Code"}
                        </button>
                      </div>
                      <Input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        required
                        className="text-center font-mono font-bold tracking-widest text-base h-10"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Sent to <span className="font-mono font-medium">{activeEmail}</span>
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Set / Reset Account Password <span className="text-slate-400 font-normal">(Optional)</span>
                      </Label>
                      <Input
                        type="password"
                        placeholder="New password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="text-xs h-9"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Optional: Set a permanent password for your Google account to use for future logins.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Reason for Deletion (Optional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us why you are deleting your account..."
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={requesting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={requesting || (authMode === "password" ? !password.trim() : !otpCode.trim())}
                  className="text-xs bg-red-600 hover:bg-red-700 gap-1.5"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {step === "confirm" && (
            <form onSubmit={handleExecuteDeletion}>
              <DialogHeader>
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <ShieldAlert className="h-5 w-5" />
                  <DialogTitle className="text-lg">Final Confirmation</DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  To prevent accidental erasure, type the confirmation phrase below.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 text-xs space-y-1.5">
                  <div className="font-semibold text-red-950 dark:text-red-200">
                    Type exactly: <span className="font-mono text-red-600 dark:text-red-400 font-bold select-all">DELETE MY ACCOUNT</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    Challenge valid for 10 minutes.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Confirmation Phrase</Label>
                  <Input
                    type="text"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    autoFocus
                    required
                    className="text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("challenge")}
                  disabled={confirming}
                  className="text-xs"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={confirming || confirmPhrase.trim() !== "DELETE MY ACCOUNT"}
                  className="text-xs bg-red-600 hover:bg-red-700 gap-1.5 font-bold"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Erasing Account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Permanently Delete Account
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {step === "success" && (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Account Successfully Deleted
              </DialogTitle>
              <DialogDescription className="text-xs max-w-xs mx-auto">
                Your personal credentials and identifiable data have been permanently erased. Redirecting to home...
              </DialogDescription>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
