"use client"

import { useState, useEffect } from "react"
import { Bell, ShieldCheck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window === "undefined" || !("Notification" in window)) return

    // Show prompt if permission is currently default (not yet asked)
    if (Notification.permission === "default") {
      // Delay prompt by 5 seconds to not annoy user immediately
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleEnable = async () => {
    const permission = await Notification.requestPermission()
    setShowPrompt(false)
    if (permission === "granted") {
      // The NotificationProvider will pick this up on next render/effect
      window.location.reload() 
    }
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Bell className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-center text-xl">Never Miss an Update</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Enable notifications to receive real-time alerts for:
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Instant Jobs</p>
              <p className="text-sm text-muted-foreground">Receive new job assignments on your lock screen.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Real-time Approvals</p>
              <p className="text-sm text-muted-foreground">Get notified instantly when your material requests are approved.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => setShowPrompt(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleEnable}>
            Enable Notifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
