"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { User, Bell, Shield, Loader2, Eye, EyeOff, Building2 } from "lucide-react"
import { HRLayout } from "@/components/hr-layout"
import { DangerZoneAccountDeletion } from "@/components/danger-zone-account-deletion"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

export default function HRSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState({ name: user?.name || "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, sms: false })
  const [savingNotif, setSavingNotif] = useState(false)

  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" })
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      const p = await apiClient("/api/settings/profile")
      if (p) {
        setProfile({ name: p.name || "", phone: p.phone || "" })
        if (p.notification_prefs && Object.keys(p.notification_prefs).length) {
          setNotifPrefs((prev) => ({ ...prev, ...p.notification_prefs }))
        }
      }
    } catch (e) {
      logger.error("Profile load error:", e)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    try {
      await apiClient("/api/settings/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      })
      toast({ title: "Profile updated", description: "Your name and phone number have been updated." })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Could not update profile", variant: "destructive" })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdateNotifs = async () => {
    setSavingNotif(true)
    try {
      await apiClient("/api/settings/notifications", {
        method: "PUT",
        body: JSON.stringify(notifPrefs),
      })
      toast({ title: "Notification preferences saved" })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Could not update notifications", variant: "destructive" })
    } finally {
      setSavingNotif(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.newPw !== passwords.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" })
      return
    }
    if (passwords.newPw.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters required", variant: "destructive" })
      return
    }
    setSavingPw(true)
    try {
      await apiClient("/api/settings/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPw }),
      })
      toast({ title: "Password changed successfully" })
      setPasswords({ current: "", newPw: "", confirm: "" })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Could not change password", variant: "destructive" })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <HRLayout>
      <div className="space-y-6 max-w-4xl pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Account & Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal HR profile, notification preferences, security, and privacy data.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5 text-primary" /> Personal Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user?.email || ""} disabled className="opacity-70" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned Role</Label>
                  <Input value="Human Resources (HR)" disabled className="opacity-70 capitalize" />
                </div>
              </div>
              <Button onClick={handleUpdateProfile} disabled={savingProfile} size="sm">
                {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5 text-primary" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Email Alerts</Label>
                  <p className="text-xs text-muted-foreground">Receive leave requests, payroll alerts, and employee onboarding notices</p>
                </div>
                <Switch
                  checked={notifPrefs.email}
                  onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, email: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Real-time desktop alerts for attendance flags and overtime notices</p>
                </div>
                <Switch
                  checked={notifPrefs.push}
                  onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, push: v }))}
                />
              </div>
              <Button onClick={handleUpdateNotifs} disabled={savingNotif} size="sm">
                {savingNotif ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-primary" /> Security & Password
              </CardTitle>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              <Button onClick={handleChangePassword} disabled={savingPw || !passwords.current || !passwords.newPw} size="sm">
                {savingPw ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Changing...</> : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <DangerZoneAccountDeletion
            portalType="staff"
            userRole={user?.role || "hr"}
            userEmail={user?.email}
          />
        </div>
      </div>
    </HRLayout>
  )
}
