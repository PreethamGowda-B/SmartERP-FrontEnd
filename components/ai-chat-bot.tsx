"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/apiClient"

/* ---------------- TYPES ---------------- */

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
}
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://smarterp-backendend.onrender.com";


/* ---------------- BACKEND CALL ---------------- */

async function askBackendAI(message: string, onFeatureLocked: (data: any) => void) {
  try {
    const data = await apiClient("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    })
    return data.reply || "No response from AI."
  } catch (err: any) {
    if (err.status === 403 && err.upgrade_required) {
      onFeatureLocked(err)
      throw new Error("PLAN_LOCKED")
    }
    throw err
  }
}

/* ---------------- COMPONENT ---------------- */

export function AIChatBot({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello 👋 I am SmartERP AI. How can I help you today?",
      sender: "bot",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userText = input
    setInput("")
    setLoading(true)

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: userText, sender: "user" },
    ])

    try {
      const { triggerFeatureLock } = await import("@/components/locked-feature-prompt")
      const reply = await askBackendAI(userText, (data) => {
        triggerFeatureLock(data)
      })
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: reply, sender: "bot" },
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
            text: err.message || "AI Assistant is temporarily unavailable. Please try again in a few moments.",
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
            {/* Hover Prompt Message */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              whileHover={{ opacity: 1, x: -10, scale: 1 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10"
            >
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                 Need help? Ask me!
              </div>
              <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-t border-white/10" />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center animate-bounce-subtle hover:rotate-12 transition-all duration-300 border-2 border-white/20"
              onClick={() => setIsOpen(true)}
            >
              <Bot className="h-7 w-7" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-4 right-4 z-[9999]"
          >
            <Card className="w-80 h-[480px] shadow-2xl flex flex-col overflow-hidden">

              {/* Header */}
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  SmartERP AI
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
              <CardContent className="p-0 flex flex-col flex-1 min-h-0">

                <ScrollArea className="flex-1 min-h-0 p-3">
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`mb-3 flex ${m.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                        }`}
                    >
                      {m.sender === "bot" && (
                        <Avatar className="h-7 w-7 mr-2">
                          <AvatarFallback>
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${m.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                          }`}
                      >
                        {m.text}
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
                    placeholder="Ask SmartERP AI..."
                    disabled={loading}
                    className="focus:ring-2 focus:ring-primary/50 transition-all"
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-primary text-primary-foreground px-3 rounded-md flex items-center"
                    onClick={sendMessage}
                    disabled={loading}
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
