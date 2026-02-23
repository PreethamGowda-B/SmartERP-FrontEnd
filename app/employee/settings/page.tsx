"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { User, Bell, Shield, Loader2, Eye, EyeOff } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"

const API = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function EmployeeSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: user?.name || "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, sms: false })
  const [savingNotif, setSavingNotif] = useState(false)

  // ── Password ──────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" })
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  // ── Load profile on mount ─────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/settings/profile`, { credentials: "include", headers: authHeaders() })
      if (res.ok) {
        const p = await res.json()
        setProfile({ name: p.name || "", phone: p.phone || "" })
        if (p.notification_prefs && Object.keys(p.notification_prefs).length) {
          setNotifPrefs((prev) => ({ ...prev, ...p.notification_prefs }))
        }
      }
    } catch (e) { console.error("Profile load error:", e) }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

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

  const handleSaveNotifPrefs = async (newPrefs: typeof notifPrefs) => {
    setSavingNotif(true)
    try {
      await fetch(`${API}/api/settings/notification-prefs`, {
        method: "PUT", credentials: "include", headers: authHeaders(),
        body: JSON.stringify(newPrefs),
      })
    } catch { /* silent */ } finally { setSavingNotif(false) }
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

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 99999 99999"
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={user?.position || "Employee"} disabled className="opacity-60" />
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
                <Bell className="h-5 w-5" />Notifications
                {savingNotif && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
                { key: "push", label: "Push Notifications", desc: "In-app push notifications" },
                { key: "sms", label: "SMS Notifications", desc: "Critical alerts via SMS" },
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

          {/* ── Security / Change Password ── */}
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

        </div>
      </div>
    </EmployeeLayout>
  )
}
