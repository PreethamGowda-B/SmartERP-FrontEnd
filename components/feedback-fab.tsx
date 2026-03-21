"use client"

import { useState, useEffect } from "react"
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
import { cn } from "@/lib/utils"

export function FeedbackFAB({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Standardize token retrieval from AuthContext and handle mounting check
    const storedToken = localStorage.getItem("_at") || localStorage.getItem("accessToken")
    setToken(storedToken)
  }, [])

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please provide a description of your feedback")
      return
    }

    setLoading(true)
    try {
      await apiClient('/api/v1/feedback', {
        method: 'POST',
        body: JSON.stringify({
          type,
          subject,
          message,
          page_url: typeof window !== "undefined" ? window.location.href : "",
        })
      })
      toast.success("Thank you! Your feedback has been sent to our team.")
      setOpen(false)
      // Reset form
      setSubject('')
      setMessage('')
    } catch (err: any) {
      toast.error(err.message || "Failed to send feedback. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Not logged in -> don't show FAB (or could show a minimal version)
  if (!token) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl animate-bounce-subtle hover:scale-110 transition-transform duration-300 group bg-slate-900 border-2 border-white/20",
            className
          )}
          size="icon"
        >
          <MessageSquarePlus className="h-6 w-6 group-hover:rotate-12 transition-transform text-white" />
          <span className="sr-only">Provide Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="grid gap-4 py-4">
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
                value={type}
                onValueChange={setType}
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
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us more..."
                className="min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
