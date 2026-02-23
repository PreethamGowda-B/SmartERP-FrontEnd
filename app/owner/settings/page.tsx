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
import { Building2, User, Bell, Shield, Globe, SettingsIcon, Copy, Users, Loader2, Eye, EyeOff } from "lucide-react"
import { OwnerLayout } from "@/components/owner-layout"

const API = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: user?.name || "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Company ───────────────────────────────────────────────────────────────
  const [company, setCompany] = useState({ name: "", address: "", phone: "", contact_email: "", company_id: "" })
  const [bizSettings, setBizSettings] = useState({
    autoApproval: false, overtimeAlerts: true, budgetAlerts: true,
    defaultHourlyRate: "25", overtimeMultiplier: "1.5",
  })
  const [savingCompany, setSavingCompany] = useState(false)

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    email: true, push: true, sms: false, safety: true, budget: true,
  })
  const [savingNotif, setSavingNotif] = useState(false)

  // ── Password ──────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" })
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  // ── Invite / Company ID ───────────────────────────────────────────────────
  const [inviteLink, setInviteLink] = useState("")
  const [loadingInvite, setLoadingInvite] = useState(false)

  // ── Load profile + company on mount ──────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [profileRes, companyRes] = await Promise.all([
        fetch(`${API}/api/settings/profile`, { credentials: "include", headers: authHeaders() }),
        fetch(`${API}/api/settings/company`, { credentials: "include", headers: authHeaders() }),
      ])

      if (profileRes.ok) {
        const p = await profileRes.json()
        setProfile({ name: p.name || "", phone: p.phone || "" })
        if (p.notification_prefs && Object.keys(p.notification_prefs).length) {
          setNotifPrefs((prev) => ({ ...prev, ...p.notification_prefs }))
        }
      }

      if (companyRes.ok) {
        const c = await companyRes.json()
        setCompany({
          name: c.name || "",
          address: c.address || "",
          phone: c.phone || "",
          contact_email: c.contact_email || "",
          company_id: c.company_id || "",
        })
        if (c.settings && Object.keys(c.settings).length) {
          setBizSettings((prev) => ({ ...prev, ...c.settings }))
        }
      }
    } catch (e) {
      console.error("Settings load error:", e)
    }
  }, [])

  useEffect(() => { if (user?.role === "owner") loadData() }, [user, loadData])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch(`${API}/api/settings/profile`, {
        method: "PUT", credentials: "include", headers: authHeaders(),
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast({ title: "Profile updated", description: "Your profile has been saved." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update profile", variant: "destructive" })
    } finally { setSavingProfile(false) }
  }

  const handleUpdateCompany = async () => {
    setSavingCompany(true)
    try {
      const res = await fetch(`${API}/api/settings/company`, {
        method: "PUT", credentials: "include", headers: authHeaders(),
        body: JSON.stringify({ ...company, settings: bizSettings }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast({ title: "Company settings updated", description: "Changes have been saved." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update company", variant: "destructive" })
    } finally { setSavingCompany(false) }
  }

  const handleSaveNotifPrefs = async (newPrefs: typeof notifPrefs) => {
    setSavingNotif(true)
    try {
      await fetch(`${API}/api/settings/notification-prefs`, {
        method: "PUT", credentials: "include", headers: authHeaders(),
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
      const res = await fetch(`${API}/api/settings/change-password`, {
        method: "PUT", credentials: "include", headers: authHeaders(),
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast({ title: "Password changed", description: "Your password has been updated." })
      setPasswords({ current: "", newPw: "", confirm: "" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to change password", variant: "destructive" })
    } finally { setSavingPw(false) }
  }

  const handleGenerateInviteLink = async () => {
    setLoadingInvite(true)
    try {
      const res = await fetch(`${API}/api/auth/company/generate-invite`, {
        method: "POST", credentials: "include", headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
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
        <h1 className="text-3xl font-bold">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Company Information ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={company.name} onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))} placeholder="Your Company Name" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={company.address} onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main St, City, Country" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={company.phone} onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 99999 99999" />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={company.contact_email} onChange={(e) => setCompany((p) => ({ ...p, contact_email: e.target.value }))} placeholder="info@company.com" />
              </div>
              <Button onClick={handleUpdateCompany} disabled={savingCompany}>
                {savingCompany ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Update Company Info"}
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
                { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
                { key: "push", label: "Push Notifications", desc: "In-app push notifications" },
                { key: "sms", label: "SMS Notifications", desc: "Critical alerts via SMS" },
                { key: "safety", label: "Safety Alerts", desc: "Immediate safety incident alerts" },
                { key: "budget", label: "Budget Alerts", desc: "Project budget threshold alerts" },
              ] as const).map(({ key, label, desc }, i, arr) => (
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
                <p className="text-sm text-muted-foreground py-4 text-center">Loading company info…</p>
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

        </div>
      </div>
    </OwnerLayout>
  )
}
