"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  Package,
  Users,
  CreditCard,
  FileText,
  CalendarCheck,
  Minimize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRegisterCommand } from "@/hooks/useRegisterCommand"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  sender: "user" | "copilot"
  text: string
  timestamp: string
  actionSuggest?: { label: string; action: () => void }
}

export function AICopilot() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "Hello! I am SmartERP Copilot. How can I assist you with inventory, payroll, staff attendance, or executive insights today?",
      timestamp: "Just now",
    },
  ])
  const [isTyping, setIsTyping] = React.useState(false)
  const pathname = usePathname()

  // Register Command Palette Action
  useRegisterCommand({
    id: "action-open-copilot",
    title: "Open AI Enterprise Copilot",
    category: "AI & Intelligence",
    icon: Sparkles,
    shortcut: "⌘I",
    action: () => setIsOpen(true),
  })

  // Detect Current Page Context
  const getContextLabel = () => {
    if (pathname.includes("/inventory")) return "Inventory Management"
    if (pathname.includes("/employees")) return "Employee Directory"
    if (pathname.includes("/attendance")) return "Attendance Streams"
    if (pathname.includes("/payroll")) return "Payroll Disbursements"
    if (pathname.includes("/reports")) return "Analytics & Reports"
    if (pathname.includes("/jobs") || pathname.includes("/tasks")) return "Job Tracking"
    return "Executive Dashboard"
  }

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput("")
    setIsTyping(true)

    setTimeout(() => {
      let replyText = "Here is the insight based on your current organization data:"
      const q = query.toLowerCase()

      if (q.includes("inventory") || q.includes("stock")) {
        replyText =
          "Inventory Analysis: 3 items are currently below minimum safety stock levels (Raw Steel, Concrete Mix). Recommendation: Trigger a new supplier purchase request."
      } else if (q.includes("payroll") || q.includes("salary")) {
        replyText =
          "Payroll Summary: Net disbursement for this period totals ₹4,85,000 across 24 staff members. 0 pending approvals remaining."
      } else if (q.includes("attendance") || q.includes("clock")) {
        replyText =
          "Attendance Stream: 94% on-time arrival rate today. 2 staff members logged late check-ins."
      } else if (q.includes("employee") || q.includes("staff")) {
        replyText =
          "Employee Roster: Total active headcount is 28 members across Operations, Engineering, and Sales."
      } else {
        replyText = `SmartERP Copilot analyzed context for ${getContextLabel()}: All system metrics are functioning smoothly within standard parameters.`
      }

      const copilotMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "copilot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, copilotMsg])
      setIsTyping(false)
    }, 800)
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-20 right-6 z-[9990] h-12 w-12 rounded-full shadow-2xl transition-transform hover:scale-105 btn-premium flex items-center justify-center",
          isOpen && "rotate-90 bg-destructive hover:bg-destructive"
        )}
        aria-label="Toggle AI Copilot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>

      {/* Copilot Drawer Modal */}
      {isOpen && (
        <Card className="fixed bottom-36 right-6 z-[9990] w-96 max-w-[calc(100vw-3rem)] h-[520px] shadow-2xl border-border/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="bg-primary p-4 text-primary-foreground flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-foreground/10">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  SmartERP Copilot
                </CardTitle>
                <p className="text-[11px] text-primary-foreground/80 font-medium">
                  Context: <span className="font-semibold">{getContextLabel()}</span>
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Quick Action Badges */}
          <div className="p-2.5 bg-muted/40 border-b border-border/60 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 whitespace-nowrap gap-1 text-[10px]"
              onClick={() => handleSend("Audit Low Stock Inventory")}
            >
              <Package className="h-3 w-3" /> Low Stock
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 whitespace-nowrap gap-1 text-[10px]"
              onClick={() => handleSend("Payroll Disbursement Summary")}
            >
              <CreditCard className="h-3 w-3" /> Payroll
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 whitespace-nowrap gap-1 text-[10px]"
              onClick={() => handleSend("Check Attendance Stream")}
            >
              <CalendarCheck className="h-3 w-3" /> Attendance
            </Badge>
          </div>

          {/* Messages Stream */}
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 bg-background/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2.5 max-w-[85%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border"
                  )}
                >
                  {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-2xl text-xs leading-relaxed",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : "bg-card border border-border/70 text-foreground rounded-tl-xs shadow-xs"
                  )}
                >
                  <p>{msg.text}</p>
                  <span className="text-[9px] opacity-60 block mt-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 mr-auto items-center text-xs text-muted-foreground">
                <Bot className="h-4 w-4 animate-bounce" />
                <span>Copilot is analyzing organizational data...</span>
              </div>
            )}
          </CardContent>

          {/* Input Controls */}
          <div className="p-3 bg-background border-t border-border/70 flex items-center gap-2 shrink-0">
            <Input
              placeholder="Ask Copilot anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="h-9 text-xs"
            />
            <Button size="icon" className="h-9 w-9 btn-premium shrink-0" onClick={() => handleSend()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}
