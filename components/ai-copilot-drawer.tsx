"use client"

import React, { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { apiClient } from "@/lib/apiClient"
import { toast } from "sonner"
import { Sparkles, Send, CheckCircle2, AlertTriangle, Bot, User, ArrowRight } from "lucide-react"

export function AiCopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "Hello! I am your SmartERP AI Operations Copilot. Ask me live ERP questions (e.g. 'Show pending jobs', 'Show revenue today') or request multi-step workflows ('Create breakdown job').",
    },
  ])

  // Confirmation modal state for Level 2 & 3 AI actions
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null)

  const handleSend = async (confirm = false) => {
    const textToSend = confirm ? pendingConfirmation.prompt : prompt
    if (!textToSend.trim()) return

    if (!confirm) {
      setMessages((prev) => [...prev, { sender: "user", text: textToSend }])
      setPrompt("")
    }

    setLoading(true)
    try {
      const res = await apiClient<any>("/api/ai/copilot", {
        method: "POST",
        body: JSON.stringify({
          prompt: textToSend,
          confirm_action: confirm,
        }),
      })

      if (res?.requires_confirmation) {
        setPendingConfirmation({
          prompt: textToSend,
          level: res.execution_level,
          interpretation: res.ai_interpretation,
          message: res.message,
        })
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res.message,
            requiresConfirmation: true,
            level: res.execution_level,
          },
        ])
      } else {
        setPendingConfirmation(null)
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: res?.response || "AI Workflow executed successfully.",
            isExecuted: res?.execution_level > 1,
          },
        ])
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute AI request")
      setMessages((prev) => [...prev, { sender: "ai", text: `⚠️ Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-2xl z-50 hover:scale-105 transition-all p-0 flex items-center justify-center border-2 border-amber-300"
        >
          <Sparkles className="h-7 w-7" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-slate-900 text-white border-slate-800">
        <SheetHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
          <SheetTitle className="text-base font-extrabold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-amber-400" /> SmartERP AI Operations Copilot
          </SheetTitle>
          <Badge className="bg-amber-400 text-slate-950 font-black text-[10px]">Pro Plan AI</Badge>
        </SheetHeader>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold h-8 w-8 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[82%] text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-amber-600 text-white rounded-br-none"
                    : "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none"
                }`}
              >
                <p>{m.text}</p>

                {m.isExecuted && (
                  <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px]">
                    ✓ Created by SmartERP AI
                  </Badge>
                )}

                {m.requiresConfirmation && pendingConfirmation && (
                  <div className="mt-3 pt-2 border-t border-slate-700 space-y-2">
                    <p className="text-[11px] font-bold text-amber-300">{pendingConfirmation.interpretation}</p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleSend(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] h-7 flex-1"
                      >
                        Confirm Action
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingConfirmation(null)}
                        className="border-slate-700 text-white text-[10px] h-7 flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 flex items-center gap-2">
          <Input
            placeholder="Ask live ERP data or request AI workflow..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(false)}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-xs"
          />
          <Button
            disabled={loading}
            onClick={() => handleSend(false)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-9 w-9 p-0 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
