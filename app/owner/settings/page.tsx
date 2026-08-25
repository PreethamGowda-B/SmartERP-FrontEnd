"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { Building2, User, Bell, Shield, Globe, SettingsIcon, Copy, Users, Loader2, Eye, EyeOff, Sparkles, Download, Database } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"
import { DangerZoneAccountDeletion } from "@/components/danger-zone-account-deletion"
import Link from "next/link"

import { getAuthToken, apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"

function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: user?.name || "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Company ───────────────────────────────────────────────────────────────
  const [company, setCompany] = useState({
    name: "",
    legal_name: "",
    address: "",
    phone: "",
    contact_email: "",
    website: "",
    company_id: "",
    gstin: "",
    pan: "",
    cin: "",
    logo_url: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    authorized_signatory_name: "",
    stamp_url: "",
    terms_and_conditions: "",
    default_notes: "",
  })
  const [bizSettings, setBizSettings] = useState({
    autoApproval: false, overtimeAlerts: true, budgetAlerts: true,
    defaultHourlyRate: "25", overtimeMultiplier: "1.5",
  })
  const [savingCompany, setSavingCompany] = useState(false)

  // Pre-fill company_id from localStorage on client mount (set at signup/previous load)
  useEffect(() => {
    const stored = localStorage.getItem("company_code")
    if (stored) {
      setCompany((prev) => ({ ...prev, company_id: prev.company_id || stored }))
    }
  }, [])

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    email: true, push: true, whatsapp: false, sms: false, safety: true, budget: true,
  })
  const [savingNotif, setSavingNotif] = useState(false)

  // ── Password ──────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" })
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  // ── Invite / Company ID ───────────────────────────────────────────────────
  const [inviteLink, setInviteLink] = useState("")
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [exportingBackup, setExportingBackup] = useState(false)

  const handleDownloadBackup = async () => {
    setExportingBackup(true)
    try {
      const token = getAuthToken()
      const res = await fetch(`${API}/api/export/company-backup`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      })
      if (!res.ok) throw new Error("Failed to generate backup archive.")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `SmartERP_Full_Backup_${company.company_id || 'COMPANY'}_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({ title: "Backup Complete 🎉", description: "All company tables, CSVs, and metadata downloaded successfully." })
    } catch (err: any) {
      toast({ title: "Export Error", description: err.message || "Failed to download backup.", variant: "destructive" })
    } finally {
      setExportingBackup(false)
    }
  }

  // ── Load profile + company on mount ──────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        apiClient("/api/settings/profile"),
        apiClient("/api/settings/company"),
      ])

      if (p) {
        setProfile({ name: p.name || "", phone: p.phone || "" })
        if (p.notification_prefs && Object.keys(p.notification_prefs).length) {
          setNotifPrefs((prev) => ({ ...prev, ...p.notification_prefs }))
        }
      }

      if (c) {
        const cid = c.company_id || ""
        const companyName = c.legal_name || c.name || ""
        if (companyName) {
          localStorage.setItem("company_info", JSON.stringify(c))
          localStorage.setItem("smarterp-company-profile", JSON.stringify(c))
          localStorage.setItem("company_name", companyName)
        }
        setCompany({
          name: c.name || "",
          legal_name: c.legal_name || c.name || "",
          address: c.address || "",
          phone: c.phone || "",
          contact_email: c.contact_email || "",
          website: c.website || "",
          company_id: cid,
          gstin: c.gstin || "",
          pan: c.pan || "",
          cin: c.cin || "",
          logo_url: c.logo_url || "",
          bank_name: c.bank_name || "",
          account_number: c.account_number || "",
          ifsc_code: c.ifsc_code || "",
          upi_id: c.upi_id || "",
          authorized_signatory_name: c.authorized_signatory_name || "",
          stamp_url: c.stamp_url || "",
          terms_and_conditions: c.terms_and_conditions || "",
          default_notes: c.default_notes || "",
        })
        // Persist for future loads
        if (cid) localStorage.setItem("company_code", cid)
        if (c.settings && Object.keys(c.settings).length) {
          setBizSettings((prev) => ({ ...prev, ...c.settings }))
        }
      } else {
        // API failed — keep whatever is already in state (pre-filled from localStorage)
        const fallback = localStorage.getItem("company_code")
        if (fallback) setCompany((prev) => ({ ...prev, company_id: prev.company_id || fallback }))
      }
    } catch (e) {
      logger.error("Settings load error:", e)
    }
  }, [])

  useEffect(() => { if (user?.role === "owner") loadData() }, [user?.role, loadData])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    try {
      await apiClient("/api/settings/profile", {
        method: "PUT",
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      })
      toast({ title: "Profile updated", description: "Your profile has been saved." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update profile", variant: "destructive" })
    } finally { setSavingProfile(false) }
  }

  const handleUpdateCompany = async () => {
    if (!company.name?.trim()) {
      return toast({ title: "Company name required", description: "Please enter a company name before saving.", variant: "destructive" })
    }
    setSavingCompany(true)
    try {
      const data = await apiClient("/api/settings/company", {
        method: "PUT",
        body: JSON.stringify({ ...company, settings: bizSettings }),
      })
      // Update local state with what the server returned (includes short company_id)
      if (data && data.company) {
        setCompany((prev) => ({
          ...prev,
          name: data.company.name || prev.name,
          company_id: data.company.company_id || prev.company_id,
        }))
        if (data.company.company_id) localStorage.setItem("company_code", data.company.company_id)
      }
      toast({
        title: "✅ Company information updated!",
        description: "Your changes are now visible to employees.",
      })
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "Failed to update company", variant: "destructive" })
    } finally { setSavingCompany(false) }
  }

  const handleSaveNotifPrefs = async (newPrefs: typeof notifPrefs) => {
    setSavingNotif(true)
    try {
      await apiClient("/api/settings/notification-prefs", {
        method: "PUT",
        body: JSON.stringify(newPrefs),
      })
    } catch (e) { /* silent */ } finally { setSavingNotif(false) }
  }

  const toggleNotif = (key: keyof typeof notifPrefs, val: boolean) => {
    const updated = { ...notifPrefs, [key]: val }
    setNotifPrefs(updated)
    handleSaveNotifPrefs(updated)
  }

  const handleChangePassword = async () => {
    if (passwords.newPw !== passwords.confirm) {
      return toast({ title: "Passwords don't match", variant: "destructive" })
    }
    if (passwords.newPw.length < 6) {
      return toast({ title: "Password too short", description: "At least 6 characters required", variant: "destructive" })
    }
    setSavingPw(true)
    try {
      await apiClient("/api/settings/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPw }),
      })
      toast({ title: "Password changed", description: "Your password has been updated." })
      setPasswords({ current: "", newPw: "", confirm: "" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to change password", variant: "destructive" })
    } finally { setSavingPw(false) }
  }

  const handleGenerateInviteLink = async () => {
    setLoadingInvite(true)
    try {
      const data = await apiClient("/api/auth/company/generate-invite", {
        method: "POST",
      })
      if (data && data.invite_link) {
        setInviteLink(data.invite_link)
        toast({ title: "Invite link generated" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate invite link", variant: "destructive" })
    } finally { setLoadingInvite(false) }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: `${label} copied to clipboard` })
  }

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md">
            <Link href="/owner/billing">
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Company Information ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Trade / Display Name</Label>
                <Input value={company.name} onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))} placeholder="Your Company Name" />
              </div>
              <div className="space-y-2">
                <Label>Legal Business Name (For Invoices)</Label>
                <Input value={company.legal_name} onChange={(e) => setCompany((p) => ({ ...p, legal_name: e.target.value }))} placeholder="e.g. Acme Innovations Pvt Ltd" />
              </div>
              <div className="space-y-2">
                <Label>Company Logo Image URL</Label>
                <Input value={company.logo_url} onChange={(e) => setCompany((p) => ({ ...p, logo_url: e.target.value }))} placeholder="https://example.com/logo.png" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>GSTIN Number</Label>
                  <Input value={company.gstin} onChange={(e) => setCompany((p) => ({ ...p, gstin: e.target.value }))} placeholder="27AAAAA0000A1Z5" className="font-mono uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input value={company.pan} onChange={(e) => setCompany((p) => ({ ...p, pan: e.target.value }))} placeholder="AAAAA0000A" className="font-mono uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Business Address</Label>
                <Textarea value={company.address} onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main St, City, State, Country, Pincode" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={company.phone} onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 99999 99999" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" value={company.contact_email} onChange={(e) => setCompany((p) => ({ ...p, contact_email: e.target.value }))} placeholder="info@company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={company.website} onChange={(e) => setCompany((p) => ({ ...p, website: e.target.value }))} placeholder="https://www.company.com" />
              </div>
              <Separator />
              <div className="space-y-2 font-bold text-sm text-foreground">Bank & UPI Payment Details (For Invoice Printing)</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={company.bank_name} onChange={(e) => setCompany((p) => ({ ...p, bank_name: e.target.value }))} placeholder="HDFC Bank / ICICI Bank" />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={company.account_number} onChange={(e) => setCompany((p) => ({ ...p, account_number: e.target.value }))} placeholder="50100012345678" className="font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={company.ifsc_code} onChange={(e) => setCompany((p) => ({ ...p, ifsc_code: e.target.value }))} placeholder="HDFC0001234" className="font-mono uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>UPI ID (Generates Dynamic QR Code)</Label>
                  <Input value={company.upi_id} onChange={(e) => setCompany((p) => ({ ...p, upi_id: e.target.value }))} placeholder="company@upi" className="font-mono" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2 font-bold text-sm text-foreground">Signatory & Legal Terms</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Authorized Signatory Name</Label>
                  <Input value={company.authorized_signatory_name} onChange={(e) => setCompany((p) => ({ ...p, authorized_signatory_name: e.target.value }))} placeholder="Managing Director / Owner" />
                </div>
                <div className="space-y-2">
                  <Label>Digital Stamp / Signature Image URL</Label>
                  <Input value={company.stamp_url} onChange={(e) => setCompany((p) => ({ ...p, stamp_url: e.target.value }))} placeholder="https://example.com/stamp.png" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Invoice Terms & Conditions</Label>
                <Textarea value={company.terms_and_conditions} onChange={(e) => setCompany((p) => ({ ...p, terms_and_conditions: e.target.value }))} placeholder="1. Payment due within 15 days..." />
              </div>
              <div className="space-y-2">
                <Label>Company ID (Permanent Code)</Label>
                <div className="flex gap-2">
                  <Input
                    value={company.company_id}
                    readOnly
                    placeholder="e.g. MYCO001"
                    className="font-mono bg-muted opacity-80 cursor-not-allowed"
                  />
                  {company.company_id && (
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(company.company_id, "Company ID")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                  Company ID is permanent and cannot be changed.
                </p>
              </div>
              <Button onClick={handleUpdateCompany} disabled={savingCompany}>
                {savingCompany ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Company & Invoice Settings"}
              </Button>

            </CardContent>
          </Card>

          {/* ── Profile Information ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={user?.email || ""} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 99999 99999" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value="Owner" disabled className="opacity-60" />
              </div>
              <Button onClick={handleUpdateProfile} disabled={savingProfile}>
                {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* ── Notification Preferences ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />Notification Preferences
                {savingNotif && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: "email", label: "Email Notifications", desc: "Receive notifications via email", configured: true },
                { key: "push", label: "Push Notifications", desc: "In-app push notifications", configured: true },
                { key: "whatsapp", label: "WhatsApp Notifications", desc: "Job assignment, OTP, & status updates via Meta WhatsApp Cloud API", configured: false },
                { key: "sms", label: "SMS Notifications", desc: "Critical alerts via SMS", configured: true },
                { key: "safety", label: "Safety Alerts", desc: "Immediate safety incident alerts", configured: true },
                { key: "budget", label: "Budget Alerts", desc: "Project budget threshold alerts", configured: true },
              ] as const).map(({ key, label, desc, configured }, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch checked={notifPrefs[key]} onCheckedChange={(v) => toggleNotif(key, v)} />
                  </div>
                  {i < arr.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Business Settings ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" />Business Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve Material Requests</Label>
                  <p className="text-sm text-muted-foreground">Automatically approve small requests</p>
                </div>
                <Switch
                  checked={bizSettings.autoApproval}
                  onCheckedChange={(v) => setBizSettings((p) => ({ ...p, autoApproval: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overtime Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alert when employees exceed hours</p>
                </div>
                <Switch
                  checked={bizSettings.overtimeAlerts}
                  onCheckedChange={(v) => setBizSettings((p) => ({ ...p, overtimeAlerts: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Budget Threshold Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alert at 80% of budget</p>
                </div>
                <Switch
                  checked={bizSettings.budgetAlerts}
                  onCheckedChange={(v) => setBizSettings((p) => ({ ...p, budgetAlerts: v }))}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Default Hourly Rate (₹)</Label>
                <Input
                  type="number"
                  value={bizSettings.defaultHourlyRate}
                  onChange={(e) => setBizSettings((p) => ({ ...p, defaultHourlyRate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Overtime Multiplier</Label>
                <Select value={bizSettings.overtimeMultiplier} onValueChange={(v) => setBizSettings((p) => ({ ...p, overtimeMultiplier: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.5">1.5×</SelectItem>
                    <SelectItem value="2.0">2.0×</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateCompany} disabled={savingCompany}>
                {savingCompany ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Business Settings"}
              </Button>
            </CardContent>
          </Card>

          {/* ── Security ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwords.newPw}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={savingPw || !passwords.current || !passwords.newPw}>
                {savingPw ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Changing…</> : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          {/* ── Company & Team Management ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Company & Team Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.company_id ? (
                <>
                  <div className="space-y-2">
                    <Label>Company ID</Label>
                    <div className="flex gap-2">
                      <Input value={company.company_id} readOnly className="font-mono text-lg font-semibold" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(company.company_id, "Company ID")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Share this ID with employees to join your company</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Employee Invite Link</Label>
                    {inviteLink ? (
                      <div className="flex gap-2">
                        <Input value={inviteLink} readOnly className="text-sm" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(inviteLink, "Invite link")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={handleGenerateInviteLink} disabled={loadingInvite} className="w-full">
                        {loadingInvite ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : "Generate Invite Link"}
                      </Button>
                    )}
                    <p className="text-sm text-muted-foreground">Generate a shareable link for employees to join</p>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  <p>Company ID not found.</p>
                  <p className="text-xs mt-1">If you just signed up, try refreshing the page.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── System Preferences ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />System Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select defaultValue="IST">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                    <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select defaultValue="INR">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select defaultValue="dd-mm-yyyy">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ── Enterprise Data Backup & Portability ── */}
          <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:from-indigo-950/20 dark:to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                <Database className="h-5 w-5 text-indigo-600" />
                Data Portability & Full Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download a complete, encrypted archive of all your business data (Jobs, Inventory Catalog, Machine Registry, Payroll, Attendance, and Invoices) packaged as organized CSV spreadsheets and JSON metadata.
              </p>
              <div className="pt-2">
                <Button
                  onClick={handleDownloadBackup}
                  disabled={exportingBackup}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-sm gap-2"
                >
                  {exportingBackup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Compressing & Archiving Data...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Full Company Backup (.ZIP)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Danger Zone: Permanent Account Deletion ── */}
          <DangerZoneAccountDeletion
            portalType="staff"
            userRole={user?.role || "owner"}
            userEmail={user?.email}
          />

        </div>
      </div>
    </OwnerLayout>
  )
}
