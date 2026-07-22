"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, X, ArrowUpRight, CheckCircle2, AlertTriangle, Building2, Users, HardHat, ExternalLink, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getAuthToken } from "@/lib/apiClient"

/* ---------------- TYPES ---------------- */

interface WidgetPayload {
  type: "KPI_SUMMARY" | "DATA_TABLE" | "ACTION_CONFIRMATION_REQUIRED" | string
  title?: string
  metrics?: Array<{ label: string; value: string | number; color?: string }>
  lowStockCount?: number
  items?: Array<any>
  totalCount?: number
  employees?: Array<any>
  delayedCount?: number
  delayedJobs?: Array<any>
  toolName?: string
  params?: any
  message?: string
}

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  widget?: WidgetPayload | null
  navigation?: { path: string; label: string } | null
  sources?: string[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

/* ---------------- BACKEND CALL ---------------- */

async function askSmartERPAgent(
  message: string,
  pathname: string,
  history: Message[],
  onFeatureLocked: (data: any) => void
) {
  const token = getAuthToken()

  const res = await fetch(`${API_URL}/api/ai/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      message,
      clientContext: { currentPage: pathname },
      history: history.map((m) => ({
        sender: m.sender,
        content: m.text,
      })),
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    if (res.status === 403 && errorData.upgrade_required) {
      onFeatureLocked(errorData)
      throw new Error("PLAN_LOCKED")
    }
    throw new Error(errorData.error || errorData.message || "SmartERP Agent request failed")
  }

  return await res.json()
}

async function confirmAgentAction(toolName: string, params: any) {
  const token = getAuthToken()
  const res = await fetch(`${API_URL}/api/ai/confirm-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ toolName, params }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Action execution failed")
  }

  return await res.json()
}

/* ---------------- COMPONENT ---------------- */

export function AIChatBot({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello 👋 I am SmartERP Enterprise Agent. I have access to live ERP data. How can I assist you?",
      sender: "bot",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleActionConfirm = async (toolName: string, params: any) => {
    setConfirmingAction(toolName)
    try {
      const result = await confirmAgentAction(toolName, params)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `✅ Action Executed: ${result.message || "Operation completed successfully."}`,
          sender: "bot",
        },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `❌ Action Failed: ${err.message || "Failed to execute action."}`,
          sender: "bot",
        },
      ])
    } finally {
      setConfirmingAction(null)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    if (input.trim().length > 1000) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Message is too long. Please keep it under 1000 characters.",
          sender: "bot",
        },
      ])
      return
    }

    const userText = input
    setInput("")
    setLoading(true)

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: userText, sender: "user" },
    ])

    try {
      const { triggerFeatureLock } = await import("@/components/locked-feature-prompt")
      const data = await askSmartERPAgent(userText, pathname, messages, (lockData) => {
        triggerFeatureLock(lockData)
      })

      // Auto-navigate frontend if navigation command is returned
      if (data.navigation?.path) {
        router.push(data.navigation.path)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: data.text || "Processed request.",
          sender: "bot",
          widget: data.widget || null,
          navigation: data.navigation || null,
          sources: data.sources || [],
        },
      ])
    } catch (err: any) {
      if (err.message === "PLAN_LOCKED") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "🔒 This feature requires a Pro subscription. I've opened the upgrade details for you.",
            sender: "bot",
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: err.message || "SmartERP Agent is temporarily unavailable. Please try again.",
            sender: "bot",
          },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 🤖 Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={cn("z-[9999] group relative", className)}
          >
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:rotate-6 transition-all duration-300 border-2 border-white/20"
              onClick={() => setIsOpen(true)}
            >
              <Bot className="h-7 w-7" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 Agent Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-4 right-4 z-[9999]"
          >
            <Card className="w-96 h-[560px] shadow-2xl flex flex-col overflow-hidden border-primary/20">
              {/* Header */}
              <CardHeader className="p-3.5 border-b bg-muted/40 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                  <span>SmartERP Agent</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    LIVE OPERATING SYSTEM
                  </span>
                </CardTitle>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </CardHeader>

              {/* Content */}
              <CardContent className="p-0 flex flex-col flex-1 min-h-0 bg-background">
                <ScrollArea className="flex-1 min-h-0 p-3.5 space-y-3">
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`mb-3.5 flex ${
                        m.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {m.sender === "bot" && (
                        <Avatar className="h-7 w-7 mr-2 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="max-w-[85%] space-y-2">
                        <div
                          className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed shadow-sm ${
                            m.sender === "user"
                              ? "bg-primary text-primary-foreground font-medium"
                              : "bg-muted border border-border/50 text-foreground"
                          }`}
                        >
                          {m.text}
                        </div>

                        {/* Navigation Trigger Button */}
                        {m.navigation && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(m.navigation!.path)}
                            className="w-full text-xs gap-1.5 justify-between font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            <span>{m.navigation.label || "Open Page"}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Action Confirmation Widget */}
                        {m.widget && m.widget.type === "ACTION_CONFIRMATION_REQUIRED" && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Confirmation Required</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{m.widget.message}</p>
                            <Button
                              size="sm"
                              disabled={confirmingAction === m.widget.toolName}
                              onClick={() => handleActionConfirm(m.widget!.toolName!, m.widget!.params)}
                              className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              {confirmingAction === m.widget.toolName ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              )}
                              Confirm Execution
                            </Button>
                          </div>
                        )}

                        {/* KPI Summary Widget */}
                        {m.widget && m.widget.type === "KPI_SUMMARY" && (
                          <div className="p-3 bg-muted/60 border rounded-xl space-y-2">
                            <p className="text-xs font-bold text-foreground">{m.widget.title || "ERP Metrics"}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {m.widget.metrics?.map((metric, i) => (
                                <div key={i} className="p-2 bg-background rounded-lg border text-center">
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{metric.label}</p>
                                  <p className="text-sm font-extrabold text-primary">{metric.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sources attribution */}
                        {m.sources && m.sources.length > 0 && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium pt-0.5">
                            <span>Data Sources:</span>
                            <span className="font-bold text-foreground">{m.sources.join(", ")}</span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t flex gap-2 bg-background">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask SmartERP Agent to analyze or act..."
                    disabled={loading}
                    className="focus:ring-2 focus:ring-primary/50 text-xs"
                  />

                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground px-3"
                    onClick={sendMessage}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
