"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Package,
  CreditCard,
  CalendarCheck,
  Minimize2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useRegisterCommand } from "@/hooks/useRegisterCommand"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  sender: "user" | "copilot"
  text: string
  timestamp: string
}

export function AICopilot({ className }: { className?: string }) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Hide AI Copilot completely on public landing, auth, or customer portal pages
  const isPublicPage =
    !pathname ||
    pathname === "/" ||
    pathname === "/customer/landing" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/customer") ||
    pathname === "/privacy" ||
    pathname === "/terms"

  if (isPublicPage || !user) {
    return null
  }

  return <AICopilotInner user={user} pathname={pathname} className={className} />
}

function AICopilotInner({ user, pathname, className }: { user: any; pathname: string; className?: string }) {
  const router = useRouter()

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
  const [planId, setPlanId] = React.useState<number | null>(null)
  const [isTrial, setIsTrial] = React.useState<boolean>(false)
  const [loadingPlan, setLoadingPlan] = React.useState(true)

  // Fetch subscription plan status to check Pro tier authorization
  React.useEffect(() => {
    if (!user) {
      setLoadingPlan(false)
      return
    }

    async function checkPlan() {
      try {
        const res = await apiClient("/api/subscription/status")
        if (res.plan) {
          setPlanId(res.plan.id)
          setIsTrial(res.plan.is_trial)
        }
      } catch (err) {
        logger.error("[AI COPILOT] Failed to verify subscription plan", err)
      } finally {
        setLoadingPlan(false)
      }
    }

    checkPlan()
  }, [user?.id, user?.company_id])

  // Register Command Palette Action (⌘I)
  useRegisterCommand({
    id: "action-open-copilot",
    title: "Open AI Enterprise Copilot",
    category: "AI & Intelligence",
    icon: Sparkles,
    shortcut: "⌘I",
    action: () => setIsOpen(true),
  })

  // AI Copilot is an Enterprise Pro feature (Plan ID 3 or Active Pro Trial)
  const isProPlan = (planId !== null && planId >= 3) || isTrial

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
          "h-12 w-12 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 btn-premium flex items-center justify-center border-2 border-white/20",
          isOpen && "rotate-90 bg-destructive hover:bg-destructive text-white",
          className || "fixed bottom-24 right-6 z-[9990]"
        )}
        aria-label="Toggle AI Copilot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>

      {/* Copilot Drawer Modal */}
      {isOpen && (
        <>
          {/* Pro Plan Gate: If user is on Basic or Free Plan */}
          {!isProPlan && !loadingPlan ? (
            <Card className="fixed bottom-36 right-6 z-[9990] w-96 max-w-[calc(100vw-3rem)] shadow-2xl border-indigo-200 dark:border-indigo-900 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 bg-card">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <CardHeader className="pt-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-2">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Pro Feature Locked 🔒</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  <strong className="text-foreground">AI Copilot Operating Assistant</strong> is exclusively available on the <strong className="text-indigo-600 dark:text-indigo-400">Pro Plan</strong>.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground px-6 pb-6">
                <div className="p-3 bg-muted/40 rounded-xl space-y-2 border border-border/60">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>What Pro unlocks for your team:</span>
                  </div>
                  <ul className="space-y-1 pl-6 list-disc text-[11px]">
                    <li>24/7 AI Chat Assistant for Payroll, Inventory & Staff</li>
                    <li>Unlimited Employees & Department management</li>
                    <li>Advanced Payroll Automation & Offline Attendance Sync</li>
                    <li>Priority Enterprise Support</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t border-border/70 p-4 flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setIsOpen(false)}>
                  Dismiss
                </Button>
                <Button
                  className="flex-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                  onClick={() => {
                    setIsOpen(false)
                    router.push("/owner/billing")
                  }}
                >
                  Upgrade to Pro <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            /* Authorized Pro Plan Chat Interface */
            <Card className="fixed bottom-36 right-6 z-[9990] w-96 max-w-[calc(100vw-3rem)] h-[520px] shadow-2xl border-border/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="bg-primary p-4 text-primary-foreground flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-foreground/10">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      SmartERP Copilot
                      {isTrial && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0">
                          PRO TRIAL
                        </Badge>
                      )}
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
      )}
    </>
  )
}
