"use client"

import { useState } from "react"
import { MessageSquarePlus, Send, Loader2, Bug, Lightbulb, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { apiClient } from "@/lib/apiClient"

export function FeedbackFAB() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "general",
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.message.trim()) {
      toast.error("Please enter a message")
      return
    }

    setLoading(true)
    try {
      await apiClient("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      })

      toast.success("✅ Feedback sent! Thank you for helping us improve SmartERP.")
      setFormData({ type: "general", subject: "", message: "" })
      setOpen(false)
    } catch (error: any) {
      console.error("Feedback error:", error)
      toast.error("Failed to send feedback. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 animate-bounce-subtle hover:scale-110 transition-transform duration-300 group"
          size="icon"
        >
          <MessageSquarePlus className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          <span className="sr-only">Provide Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Share your feedback
            </DialogTitle>
            <DialogDescription>
              Help us make SmartERP better. Report a bug, suggest a feature, or just say hi!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Feedback Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 h-4 text-blue-500" />
                      <span>General Feedback</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 h-4 text-red-500" />
                      <span>Report a Bug</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="feature_request">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 h-4 text-amber-500" />
                      <span>Feature Request</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="What is this about?"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us more..."
                className="min-h-[120px]"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
