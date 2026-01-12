"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/* ---------------- TYPES ---------------- */

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
}

/* ---------------- BACKEND CALL ---------------- */

async function askBackendAI(message: string) {
  const token = localStorage.getItem("token")

  const res = await fetch("http://localhost:4000/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ message }),
  })

  if (!res.ok) {
    throw new Error("AI request failed")
  }

  const data = await res.json()
  return data.reply || "No response from AI."
}

/* ---------------- COMPONENT ---------------- */

export function AIChatBot() {
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
      const reply = await askBackendAI(userText)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: reply, sender: "bot" },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "AI backend is not available right now.",
          sender: "bot",
        },
      ])
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
            className="fixed bottom-4 right-4 z-[9999]"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
              onClick={() => setIsOpen(true)}
            >
              <Bot className="h-5 w-5" />
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
                      className={`mb-3 flex ${
                        m.sender === "user"
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
                        className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                          m.sender === "user"
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
