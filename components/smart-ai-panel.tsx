"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, X, Send, Bot, User, Minimize2, Maximize2, ChevronDown, ChevronUp,
  Copy, RotateCcw, ExternalLink, Loader2,
  MessageSquarePlus, Bug, AlertTriangle, Lock, Zap,
  History, Plus, Trash2, Edit3, Search, Check, Brain, TrendingUp, Package,
  CalendarCheck, CreditCard, Users, FileSpreadsheet, Globe, BarChart3,
  ShieldCheck, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/contexts/subscription-context"
import { getAuthToken } from "@/lib/apiClient"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────

interface WidgetPayload {
  type: "KPI_SUMMARY" | "DATA_TABLE" | "ACTION_CONFIRMATION_REQUIRED" | "UPGRADE_PROMPT" | string
  title?: string
  metrics?: Array<{ label: string; value: string | number; color?: string }>
  items?: Array<any>
  message?: string
  features?: string[]
}

interface AIMessage {
  id: string
  sender: "user" | "ai"
  text: string
  timestamp: Date
  widget?: WidgetPayload | null
  navigation?: { path: string; label: string } | null
  sources?: string[]
  confidenceScore?: number
  autoSelectedModel?: string | null
  activeModelScope?: string | null
  suggestedFollowUps?: string[]
  latencyMs?: number
  intercepted?: boolean
  multiAgent?: boolean
  scopesUsed?: string[]
  isTyping?: boolean
}

interface Conversation {
  id: string
  title: string
  messages: AIMessage[]
  createdAt: Date
  updatedAt: Date
  portal: string
}

interface FeedbackDetection {
  detected: boolean
  type: string
  severity: string
  aiSummary: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

const MODEL_SPECS = [
  { key: "auto", label: "Auto", description: "AI picks the best specialist", icon: Sparkles, plan: "all", color: "from-violet-500 to-purple-600" },
  { key: "general", label: "General Assistant", description: "Broad ERP guidance", icon: Bot, plan: "free", color: "from-slate-500 to-slate-600" },
  { key: "finance", label: "Finance AI", description: "Revenue, expenses, invoicing", icon: TrendingUp, plan: "pro", color: "from-emerald-500 to-green-600" },
  { key: "inventory", label: "Inventory Expert", description: "Stock, warehouse, suppliers", icon: Package, plan: "basic", color: "from-blue-500 to-blue-600" },
  { key: "attendance", label: "Attendance AI", description: "Shifts, leaves, tracking", icon: CalendarCheck, plan: "basic", color: "from-orange-500 to-amber-600" },
  { key: "payroll", label: "Payroll AI", description: "Salaries, payslips, deductions", icon: CreditCard, plan: "pro", color: "from-pink-500 to-rose-600" },
  { key: "hr", label: "HR Assistant", description: "Employees, hiring, performance", icon: Users, plan: "basic", color: "from-cyan-500 to-teal-600" },
  { key: "gst", label: "GST Intelligence", description: "Tax reconciliation, GSTR", icon: FileSpreadsheet, plan: "pro", color: "from-yellow-500 to-orange-600" },
  { key: "executive", label: "Executive AI", description: "KPIs, forecasts, analytics", icon: BarChart3, plan: "pro", color: "from-indigo-500 to-blue-700" },
  { key: "crm", label: "CRM AI", description: "Sales pipeline, leads, deals", icon: Globe, plan: "basic", color: "from-red-500 to-pink-600" },
]

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  auto: "SmartERP Intelligence", general: "General Assistant", finance: "Finance AI",
  inventory: "Inventory Expert", attendance: "Attendance AI", payroll: "Payroll AI",
  hr: "HR Assistant", gst: "GST Intelligence", executive: "Executive AI", crm: "CRM AI",
}

const FEEDBACK_PATTERNS = [
  { regex: /\b(bug|broken|not working|doesn'?t work|error|crash|fail|wrong)\b/i, type: "bug", severity: "high" },
  { regex: /\b(feature request|please add|can you add|would be great|suggestion|idea)\b/i, type: "feature_request", severity: "low" },
  { regex: /\b(slow|performance|loading|lag|timeout|takes too long)\b/i, type: "performance", severity: "medium" },
  { regex: /\b(ui|design|looks|interface|display|layout|ugly|confusing)\b/i, type: "ui_ux", severity: "low" },
  { regex: /\b(security|vulnerability|unsafe|breach|hack|exposed)\b/i, type: "security", severity: "critical" },
  { regex: /\b(billing|charge|payment|invoice|subscription|refund)\b/i, type: "billing", severity: "high" },
]


// ─── Storage Helpers ──────────────────────────────────────────────────────────

function getStorageKey(userId: string) {
  return `smarterp_ai_convs_${userId}`
}

function loadConversations(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return parsed.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }))
  } catch { return [] }
}

function saveConversations(userId: string, convs: Conversation[]) {
  try {
    // Keep last 50 conversations
    const toSave = convs.slice(0, 50)
    localStorage.setItem(getStorageKey(userId), JSON.stringify(toSave))
  } catch { /* storage full */ }
}

function getPreferencesKey(userId: string) {
  return `smarterp_ai_prefs_${userId}`
}

function getTopActions(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getPreferencesKey(userId))
    if (!raw) return []
    const prefs: Record<string, number> = JSON.parse(raw)
    return Object.entries(prefs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k]) => k)
  } catch { return [] }
}

function recordPrompt(userId: string, scope: string, followUp?: string) {
  try {
    const key = getPreferencesKey(userId)
    const raw = localStorage.getItem(key)
    const prefs: Record<string, number> = raw ? JSON.parse(raw) : {}
    const action = followUp || MODEL_DISPLAY_NAMES[scope] || scope
    prefs[action] = (prefs[action] || 0) + 1
    localStorage.setItem(key, JSON.stringify(prefs))
  } catch { /* ignore */ }
}

// ─── Feedback Detector ────────────────────────────────────────────────────────

function detectFeedback(text: string): FeedbackDetection {
  for (const { regex, type, severity } of FEEDBACK_PATTERNS) {
    if (regex.test(text)) {
      return {
        detected: true,
        type,
        severity,
        aiSummary: `User reported a ${type.replace(/_/g, " ")} issue: "${text.slice(0, 120)}${text.length > 120 ? "..." : ""}"`,
      }
    }
  }
  return { detected: false, type: "general", severity: "medium", aiSummary: "" }
}

// ─── Widget Renderer ──────────────────────────────────────────────────────────

function WidgetRenderer({ widget }: { widget: WidgetPayload }) {
  if (!widget) return null

  if (widget.type === "KPI_SUMMARY" && widget.metrics) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {widget.metrics.map((m, i) => (
          <div key={i} className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{m.label}</div>
            <div className="text-sm font-bold text-foreground mt-0.5">{m.value}</div>
          </div>
        ))}
      </div>
    )
  }

  if (widget.type === "DATA_TABLE" && widget.items && widget.items.length > 0) {
    const keys = Object.keys(widget.items[0]).slice(0, 4)
    return (
      <div className="mt-3 overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60">
              {keys.map(k => <th key={k} className="text-left px-3 py-2 text-muted-foreground font-semibold capitalize">{k.replace(/_/g, " ")}</th>)}
            </tr>
          </thead>
          <tbody>
            {widget.items.slice(0, 6).map((row, i) => (
              <tr key={i} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                {keys.map(k => <td key={k} className="px-3 py-2 text-foreground">{String(row[k] ?? "-")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {widget.items.length > 6 && (
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/40 border-t border-border/40">
            + {widget.items.length - 6} more records
          </div>
        )}
      </div>
    )
  }

  if (widget.type === "UPGRADE_PROMPT") {
    return (
      <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Upgrade Required</span>
        </div>
        <p className="text-xs text-muted-foreground">{widget.message}</p>
      </div>
    )
  }

  return null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SmartAIPanel() {
  const { user } = useAuth()
  const { isPro, isBasic } = useSubscription()

  function isModelLocked(modelPlan: string) {
    if (isPro) return false // ALL 9 MODELS UNLOCKED FOR PRO! 0 LOCK ICONS!
    if (isBasic && modelPlan !== "pro") return false
    return modelPlan !== "all" && modelPlan !== "free"
  }
  const pathname = usePathname()

  const isPublicPage =
    !pathname ||
    pathname === "/" ||
    pathname === "/customer/landing" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/customer") ||
    pathname === "/privacy" ||
    pathname === "/terms"

  if (isPublicPage || !user) return null
  return <SmartAIPanelInner user={user} pathname={pathname} />
}

function SmartAIPanelInner({ user, pathname }: { user: any; pathname: string }) {
  const router = useRouter()

  // ── Panel state
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const [showModelSelector, setShowModelSelector] = React.useState(false)
  const [isMultiAgent, setIsMultiAgent] = React.useState(false)

  const { isPro, isBasic } = useSubscription()

  function isModelLocked(modelPlan: string) {
    if (isPro) return false // ALL 9 MODELS UNLOCKED FOR PRO! 0 LOCK ICONS!
    if (isBasic && modelPlan !== "pro") return false
    return modelPlan !== "all" && modelPlan !== "free"
  }

  // ── Model selection
  const [selectedModel, setSelectedModel] = React.useState<string>("auto")
  const [multiAgentScopes, setMultiAgentScopes] = React.useState<string[]>([])

  // ── Conversation state
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<AIMessage[]>([])
  const [historySearch, setHistorySearch] = React.useState("")

  // ── Input state
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  // ── Feedback state
  const [feedbackDetected, setFeedbackDetected] = React.useState<FeedbackDetection | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = React.useState(false)
  const [feedbackSubject, setFeedbackSubject] = React.useState("")
  const [feedbackSubmitting, setFeedbackSubmitting] = React.useState(false)

  // ── Display state
  const [autoModelBadge, setAutoModelBadge] = React.useState<string | null>(null)
  const [topActions, setTopActions] = React.useState<string[]>([])
  const [renamingConvId, setRenamingConvId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState("")

  // ── Refs
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // ── Load conversations from localStorage
  React.useEffect(() => {
    if (user?.id) {
      const convs = loadConversations(String(user.id))
      setConversations(convs)
      setTopActions(getTopActions(String(user.id)))
    }
  }, [user?.id])

  // ── Auto-scroll to latest message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Get current portal
  const currentPortal = React.useMemo(() => {
    if (pathname.startsWith("/employee")) return "employee"
    if (pathname.startsWith("/hr")) return "hr"
    if (pathname.startsWith("/superadmin") || pathname.startsWith("/admin")) return "superadmin"
    return "owner"
  }, [pathname])

  // ── Create new conversation
  function startNewConversation() {
    const id = `conv_${Date.now()}`
    const newConv: Conversation = {
      id,
      title: "New Conversation",
      messages: [welcomeMessage()],
      createdAt: new Date(),
      updatedAt: new Date(),
      portal: currentPortal,
    }
    setActiveConvId(id)
    setMessages(newConv.messages)
    setConversations(prev => {
      const updated = [newConv, ...prev]
      saveConversations(String(user.id), updated)
      return updated
    })
    setAutoModelBadge(null)
    setShowHistory(false)
  }

  function welcomeMessage(): AIMessage {
    return {
      id: "welcome",
      sender: "ai",
      text: `Hello ${user?.name?.split(" ")[0] || ""}! I'm **SmartERP Intelligence**, your enterprise AI assistant. I can help you with attendance, payroll, inventory, GST, financials, HR, and more — all from your company's live data.\n\nWhat would you like to know today?`,
      timestamp: new Date(),
      suggestedFollowUps: ["Today's attendance summary", "Inventory status", "Payroll overview", "GST report"],
    }
  }

  // ── Open panel: restore or start conversation
  function handleOpen() {
    setIsOpen(true)
    setIsMinimized(false)
    if (!activeConvId) {
      startNewConversation()
    }
  }

  // ── Save messages to active conversation
  function persistMessages(msgs: AIMessage[]) {
    if (!activeConvId) return
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== activeConvId) return c
        const firstUserMsg = msgs.find(m => m.sender === "user")
        const title = firstUserMsg
          ? firstUserMsg.text.slice(0, 40) + (firstUserMsg.text.length > 40 ? "..." : "")
          : c.title
        return { ...c, messages: msgs, updatedAt: new Date(), title }
      })
      saveConversations(String(user.id), updated)
      return updated
    })
  }

  // ── Delete conversation
  function deleteConversation(id: string) {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveConversations(String(user.id), updated)
      return updated
    })
    if (activeConvId === id) {
      startNewConversation()
    }
  }

  // ── Rename conversation
  function startRename(conv: Conversation, e: React.MouseEvent) {
    e.stopPropagation()
    setRenamingConvId(conv.id)
    setRenameValue(conv.title)
  }

  function commitRename(id: string) {
    if (!renameValue.trim()) { setRenamingConvId(null); return }
    setConversations(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, title: renameValue.trim() } : c)
      saveConversations(String(user.id), updated)
      return updated
    })
    setRenamingConvId(null)
  }

  // ── Load conversation
  function loadConversation(conv: Conversation) {
    setActiveConvId(conv.id)
    setMessages(conv.messages)
    setShowHistory(false)
    setAutoModelBadge(null)
  }

  // ── Detect feedback in input
  React.useEffect(() => {
    if (input.length > 10) {
      const detection = detectFeedback(input)
      if (detection.detected) {
        setFeedbackDetected(detection)
        setFeedbackSubject(detection.aiSummary.slice(0, 80))
      } else {
        setFeedbackDetected(null)
      }
    } else {
      setFeedbackDetected(null)
    }
  }, [input])

  // ── Submit feedback to API
  async function submitFeedback() {
    if (!feedbackDetected) return
    setFeedbackSubmitting(true)
    try {
      const token = getAuthToken()
      const pathSegments = pathname.split("/").filter(Boolean)
      const pageModule = pathSegments.length > 1 ? pathSegments[1] : "overview"
      await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({
          type: feedbackDetected.type,
          subject: feedbackSubject || feedbackDetected.aiSummary.slice(0, 80),
          message: input,
          portal: currentPortal,
          module: pageModule,
          page_path: pathname,
          page_url: typeof window !== "undefined" ? window.location.href : "",
          severity: feedbackDetected.severity,
          category: feedbackDetected.type,
          ai_summary: feedbackDetected.aiSummary,
          browser: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
          device: typeof navigator !== "undefined" ? (navigator.maxTouchPoints > 0 ? "Mobile/Tablet" : "Desktop") : "",
        }),
      })
      toast.success("Support ticket created! Our team will respond shortly.")
      setShowFeedbackForm(false)
      setFeedbackDetected(null)
      setInput("")
    } catch (err) {
      toast.error("Failed to submit ticket. Please try again.")
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // ── Send message to AI
  async function sendMessage(promptText?: string) {
    const text = (promptText || input).trim()
    if (!text || isLoading) return

    const userMsg: AIMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
    }

    const typingMsg: AIMessage = {
      id: `typing_${Date.now()}`,
      sender: "ai",
      text: "",
      timestamp: new Date(),
      isTyping: true,
    }

    const newMessages = [...messages, userMsg, typingMsg]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    setShowFeedbackForm(false)

    // Record for personalized quick actions
    recordPrompt(String(user.id), selectedModel)

    try {
      const token = getAuthToken()
      const pathSegments = pathname.split("/").filter(Boolean)
      const pageModule = pathSegments.length > 1 ? pathSegments[1] : "overview"

      // Determine scopes to send
      const scopesToSend = isMultiAgent && multiAgentScopes.length > 0
        ? multiAgentScopes
        : selectedModel !== "auto" ? [selectedModel] : []

      const body: any = {
        message: text,
        currentPortal,
        currentModule: pageModule,
        currentPagePath: pathname,
        clientContext: { currentPage: pathname, portal: currentPortal, module: pageModule },
        history: messages
          .filter(m => !m.isTyping)
          .slice(-10)
          .map(m => ({ sender: m.sender === "user" ? "user" : "assistant", content: m.text })),
        autoMode: selectedModel === "auto",
      }

      if (scopesToSend.length > 0) body.modelScopes = scopesToSend

      const res = await fetch(`${API_URL}/api/ai/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.message || "AI request failed")
      }

      const data = await res.json()

      // Update auto-badge if AI auto-selected a model
      if (data.autoSelectedModel) {
        setAutoModelBadge(data.autoSelectedModel)
        recordPrompt(String(user.id), data.autoSelectedModel)
      }

      const aiMsg: AIMessage = {
        id: `a_${Date.now()}`,
        sender: "ai",
        text: data.text || "I've processed your request.",
        timestamp: new Date(),
        widget: data.widget || null,
        navigation: data.navigation || null,
        sources: data.sources || [],
        confidenceScore: data.confidenceScore,
        autoSelectedModel: data.autoSelectedModel,
        activeModelScope: data.activeModelScope,
        suggestedFollowUps: data.suggestedFollowUps || [],
        latencyMs: data.telemetry?.latencyMs,
        intercepted: data.intercepted || false,
        multiAgent: data.multiAgent || false,
        scopesUsed: data.scopesUsed || [],
      }

      const finalMessages = [...messages, userMsg, aiMsg]
      setMessages(finalMessages)
      persistMessages(finalMessages)
      setTopActions(getTopActions(String(user.id)))
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: `err_${Date.now()}`,
        sender: "ai",
        text: err.message === "PLAN_LOCKED"
          ? "This feature requires a higher plan. Upgrade to unlock full AI capabilities."
          : `I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date(),
        suggestedFollowUps: ["Try again", "Contact support"],
      }
      const errMessages = [...messages, userMsg, errorMsg]
      setMessages(errMessages)
      persistMessages(errMessages)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Copy response
  function copyMessage(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  // ── Regenerate last AI response
  async function regenerateLastResponse() {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === "user")
    if (!lastUserMsg) return
    // Remove last AI response then resend
    const withoutLast = messages.filter((m, i) => !(m.sender === "ai" && i === messages.length - 1))
    setMessages(withoutLast)
    await sendMessage(lastUserMsg.text)
  }

  // ── Toggle multi-agent scope
  function toggleScope(scope: string) {
    setMultiAgentScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    )
  }

  const filteredConversations = React.useMemo(() => {
    if (!historySearch.trim()) return conversations
    const q = historySearch.toLowerCase()
    return conversations.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some(m => m.text.toLowerCase().includes(q))
    )
  }, [conversations, historySearch])

  const activeModel = MODEL_SPECS.find(m => m.key === selectedModel) || MODEL_SPECS[0]

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating Trigger Button ─────────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[9999] flex flex-col items-center gap-1"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpen}
              id="smart-ai-panel-trigger"
              className={cn(
                "relative w-14 h-14 rounded-2xl",
                "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700",
                "shadow-[0_8px_32px_rgba(124,58,237,0.5)]",
                "flex items-center justify-center",
                "transition-all duration-300",
                "hover:shadow-[0_12px_40px_rgba(124,58,237,0.7)]",
                "ring-2 ring-violet-500/30 hover:ring-violet-400/60"
              )}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-violet-500" />
              <Sparkles className="h-6 w-6 text-white drop-shadow" />
            </motion.button>
            <span className="text-[10px] font-bold text-muted-foreground/80 tracking-wide whitespace-nowrap">
              SmartERP AI
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Panel ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="smart-ai-panel"
            initial={{ x: 440, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 440, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 z-[9998] h-screen",
              "w-full sm:w-[440px]",
              "flex flex-col",
              "bg-background/95 backdrop-blur-2xl",
              "border-l border-border/80",
              "shadow-[-20px_0_80px_rgba(0,0,0,0.2)]",
              isMinimized && "h-16 top-auto bottom-6 right-6 w-80 rounded-2xl border shadow-2xl"
            )}
          >
            {/* ── Panel Header ───────────────────────────────────────────────── */}
            <div className={cn(
              "flex items-center justify-between px-4 py-3 border-b border-border/80",
              "bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-indigo-600/10",
              "backdrop-blur-md shrink-0",
              isMinimized && "rounded-2xl"
            )}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-foreground tracking-tight">SmartERP Intelligence</h2>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  {!isMinimized && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {autoModelBadge ? (
                        <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold">
                          <Check className="h-2.5 w-2.5 mr-1" />
                          {MODEL_DISPLAY_NAMES[autoModelBadge] || autoModelBadge} (Auto)
                        </Badge>
                      ) : (
                        <Badge className="text-[9px] h-4 px-1.5 bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20 font-semibold">
                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                          {isMultiAgent ? `Multi-Agent (${multiAgentScopes.length > 0 ? multiAgentScopes.length : "select models"})` : (selectedModel === "auto" ? "AUTO MODE" : MODEL_DISPLAY_NAMES[selectedModel])}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted/60"
                  onClick={() => setShowHistory(s => !s)}>
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted/60"
                  onClick={startNewConversation}>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted/60"
                  onClick={() => setIsMinimized(s => !s)}>
                  {isMinimized ? <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" /> : <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => { setIsOpen(false); setIsMinimized(false) }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-1 overflow-hidden">
                {/* ── History Sidebar ───────────────────────────────────────── */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col border-r border-border/60 bg-muted/20 shrink-0 overflow-hidden"
                    >
                      <div className="p-2 border-b border-border/40">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            value={historySearch}
                            onChange={e => setHistorySearch(e.target.value)}
                            placeholder="Search..."
                            className="h-7 pl-6 text-[11px] bg-background/60"
                          />
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-1.5 space-y-1">
                          {filteredConversations.map(conv => (
                            <div
                              key={conv.id}
                              className={cn(
                                "group flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer text-[11px] font-medium transition-all",
                                conv.id === activeConvId
                                  ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                                  : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => renamingConvId !== conv.id && loadConversation(conv)}
                            >
                              <MessageSquarePlus className="h-3 w-3 shrink-0" />
                              {renamingConvId === conv.id ? (
                                <input
                                  autoFocus
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  onBlur={() => commitRename(conv.id)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") commitRename(conv.id)
                                    if (e.key === "Escape") setRenamingConvId(null)
                                  }}
                                  onClick={e => e.stopPropagation()}
                                  className="flex-1 bg-transparent border-b border-violet-500 outline-none text-[11px] text-foreground"
                                />
                              ) : (
                                <span className="flex-1 truncate">{conv.title}</span>
                              )}
                              <Button
                                variant="ghost" size="icon"
                                className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:text-violet-500 shrink-0"
                                onClick={e => startRename(conv, e)}
                              >
                                <Edit3 className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-4 w-4 opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0"
                                onClick={e => { e.stopPropagation(); deleteConversation(conv.id) }}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          ))}
                          {filteredConversations.length === 0 && (
                            <p className="text-[10px] text-muted-foreground px-2 py-3 text-center">No conversations yet</p>
                          )}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Main Chat Area ─────────────────────────────────────────── */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Model Selector Bar */}
                  <div className="px-3 py-2 border-b border-border/40 bg-muted/10 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowModelSelector(s => !s)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted/80 border border-border/50 transition-all text-xs font-semibold text-foreground"
                      >
                        <activeModel.icon className="h-3.5 w-3.5" />
                        {selectedModel === "auto" ? "AUTO" : activeModel.label}
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </button>

                      <button
                        onClick={() => { setIsMultiAgent(s => !s); if (!isMultiAgent) setMultiAgentScopes([]) }}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                          isMultiAgent
                            ? "bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-400"
                            : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        <Brain className="h-3.5 w-3.5" />
                        Multi-Agent
                      </button>
                    </div>

                    {/* Model Selector Dropdown */}
                    <AnimatePresence>
                      {showModelSelector && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden mt-2"
                        >
                          <div className="grid grid-cols-2 gap-1.5">
                            {MODEL_SPECS.map(model => {
                              const isSelected = isMultiAgent
                                ? multiAgentScopes.includes(model.key)
                                : selectedModel === model.key
                              return (
                                <button
                                  key={model.key}
                                  onClick={() => {
                                    if (isMultiAgent && model.key !== "auto") {
                                      toggleScope(model.key)
                                    } else {
                                      setSelectedModel(model.key)
                                      setShowModelSelector(false)
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all group",
                                    isSelected
                                      ? "border-violet-500/50 bg-violet-500/10"
                                      : "border-border/40 bg-muted/20 hover:bg-muted/50"
                                  )}
                                >
                                  <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", model.color)}>
                                    <model.icon className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-bold text-foreground truncate flex items-center gap-1">
                                      {model.label}
                                      {isModelLocked(model.plan) && <Lock className="h-2.5 w-2.5 text-amber-500" />}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground truncate">{model.description}</div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 px-4 py-3">
                    <div className="space-y-4">
                      {messages.map(msg => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          onCopy={copyMessage}
                          onRegenerate={regenerateLastResponse}
                          onFollowUp={text => { setInput(""); sendMessage(text); recordPrompt(String(user.id), autoModelBadge || selectedModel, text) }}
                          onNavigate={path => { router.push(path); setIsOpen(false) }}
                          isLastAI={msg.sender === "ai" && msg === [...messages].reverse().find(m => m.sender === "ai")}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Personalized Quick Actions */}
                  {topActions.length > 0 && messages.length <= 1 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                      {topActions.map(action => (
                        <button
                          key={action}
                          onClick={() => sendMessage(action)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-muted/60 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/90 transition-all font-medium"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback Detection Banner */}
                  <AnimatePresence>
                    {feedbackDetected && !showFeedbackForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden shrink-0"
                      >
                        <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                          <Bug className="h-4 w-4 text-amber-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              Issue detected — create a support ticket?
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{feedbackDetected.type.replace(/_/g, " ")} • {feedbackDetected.severity} severity</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm" className="h-6 text-[10px] px-2 bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() => setShowFeedbackForm(true)}>
                              Create Ticket
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => setFeedbackDetected(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Feedback Form */}
                  <AnimatePresence>
                    {showFeedbackForm && feedbackDetected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden shrink-0"
                      >
                        <div className="mx-4 mb-2 p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Bug className="h-3.5 w-3.5 text-amber-500" />
                              Support Ticket
                              <Badge className="text-[9px] h-4 px-1.5 capitalize bg-red-500/15 text-red-600 border-red-500/30">
                                {feedbackDetected.severity}
                              </Badge>
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFeedbackForm(false)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <Input
                            value={feedbackSubject}
                            onChange={e => setFeedbackSubject(e.target.value)}
                            placeholder="Subject"
                            className="h-8 text-xs"
                          />
                          <Button
                            onClick={submitFeedback}
                            disabled={feedbackSubmitting}
                            size="sm"
                            className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            {feedbackSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                              <><Send className="h-3.5 w-3.5 mr-1.5" />Submit Ticket</>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input Area */}
                  <div className="p-4 border-t border-border/60 bg-background/50 backdrop-blur shrink-0">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={textareaRef}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          placeholder={isMultiAgent
                            ? "Ask across multiple AI specialists..."
                            : selectedModel === "auto"
                              ? "Ask SmartERP Intelligence anything..."
                              : `Ask ${MODEL_DISPLAY_NAMES[selectedModel] || "AI"}...`
                          }
                          rows={1}
                          className="resize-none text-sm pr-2 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-all min-h-[44px] max-h-[120px] overflow-y-auto"
                          style={{ height: "auto" }}
                        />
                      </div>
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shrink-0"
                      >
                        {isLoading
                          ? <Loader2 className="h-4 w-4 animate-spin text-white" />
                          : <Send className="h-4 w-4 text-white" />
                        }
                      </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-1.5 text-center">
                      SmartERP Intelligence · Enterprise AI · Tenant Isolated · {currentPortal} portal
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg, onCopy, onRegenerate, onFollowUp, onNavigate, isLastAI
}: {
  msg: AIMessage
  onCopy: (text: string) => void
  onRegenerate: () => void
  onFollowUp: (text: string) => void
  onNavigate: (path: string) => void
  isLastAI: boolean
}) {
  const [showActions, setShowActions] = React.useState(false)
  const [showSources, setShowSources] = React.useState(false)

  if (msg.isTyping) {
    return (
      <div className="flex gap-2.5 items-start">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="bg-muted/60 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex gap-1.5 items-center">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    )
  }

  const isUser = msg.sender === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2.5 items-start", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
        isUser
          ? "bg-gradient-to-br from-blue-500 to-blue-700"
          : "bg-gradient-to-br from-violet-500 to-indigo-600"
      )}>
        {isUser ? <User className="h-3.5 w-3.5 text-white" /> : <Sparkles className="h-3.5 w-3.5 text-white" />}
      </div>

      <div className={cn("flex-1 max-w-[85%]", isUser && "flex flex-col items-end")}>
        {/* Bubble */}
        <div
          onMouseEnter={() => !isUser && setShowActions(true)}
          onMouseLeave={() => !isUser && setShowActions(false)}
          className={cn(
            "relative rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-sm"
              : "bg-muted/60 border border-border/40 text-foreground rounded-tl-sm"
          )}
        >
          {/* Auto-selected model badge */}
          {!isUser && msg.autoSelectedModel && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border/40">
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {MODEL_DISPLAY_NAMES[msg.autoSelectedModel] || msg.autoSelectedModel} (Auto Selected)
              </span>
            </div>
          )}

          {/* Multi-agent scopes badge */}
          {!isUser && msg.multiAgent && msg.scopesUsed && msg.scopesUsed.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border/40 flex-wrap">
              <Brain className="h-3 w-3 text-violet-500" />
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">Multi-Agent:</span>
              {msg.scopesUsed.map(s => (
                <Badge key={s} className="text-[9px] h-3.5 px-1 bg-violet-500/15 text-violet-600 border-violet-500/20">
                  {MODEL_DISPLAY_NAMES[s] || s}
                </Badge>
              ))}
            </div>
          )}

          {/* Message text — simple markdown-ish rendering */}
          <div className="whitespace-pre-wrap">
            {msg.text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
            )}
          </div>

          {/* Widget */}
          {msg.widget && <WidgetRenderer widget={msg.widget} />}

          {/* Confidence + Sources strip */}
          {!isUser && (msg.confidenceScore !== undefined || (msg.sources && msg.sources.length > 0)) && (
            <div className="mt-3 pt-2 border-t border-border/30 flex items-center gap-2 flex-wrap">
              {msg.confidenceScore !== undefined && (
                <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                  {Math.round((msg.confidenceScore || 0) * 100)}% confidence
                </span>
              )}
              {msg.latencyMs && (
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {(msg.latencyMs / 1000).toFixed(1)}s
                </span>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <button
                  onClick={() => setShowSources(s => !s)}
                  className="text-[9px] font-semibold text-violet-500 hover:text-violet-600 flex items-center gap-0.5"
                >
                  {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""}
                  {showSources ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                </button>
              )}
            </div>
          )}

          {/* Sources expanded */}
          <AnimatePresence>
            {showSources && msg.sources && msg.sources.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="flex flex-wrap gap-1">
                  {msg.sources.map(src => (
                    <span key={src} className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-medium">
                      {src}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Response Actions */}
        <AnimatePresence>
          {!isUser && showActions && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 mt-1 px-1"
            >
              {[
                { icon: Copy, label: "Copy", onClick: () => onCopy(msg.text) },
                { icon: RotateCcw, label: "Regenerate", onClick: onRegenerate },
                ...(msg.navigation ? [{ icon: ExternalLink, label: msg.navigation.label, onClick: () => onNavigate(msg.navigation!.path) }] : []),
              ].map(action => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  title={action.label}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/60 border border-border/40 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/90 transition-all font-medium"
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Follow-up suggestions */}
        {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && isLastAI && !msg.isTyping && (
          <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {msg.suggestedFollowUps.map(sug => (
              <button
                key={sug}
                onClick={() => onFollowUp(sug)}
                className="text-[10px] px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-600 dark:text-violet-400 hover:bg-violet-500/15 transition-all font-medium"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Navigation action */}
        {!isUser && msg.navigation && !showActions && (
          <button
            onClick={() => onNavigate(msg.navigation!.path)}
            className="mt-2 mx-1 flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-all font-semibold"
          >
            <ExternalLink className="h-3 w-3" />
            {msg.navigation.label}
          </button>
        )}

        {/* Timestamp */}
        <div className={cn("text-[9px] text-muted-foreground/50 mt-1 px-1", isUser && "text-right")}>
          {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </motion.div>
  )
}
