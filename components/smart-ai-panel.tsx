"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  Sparkles, X, Send, Bot, User, Minimize2, Maximize2, ChevronDown, ChevronUp, ChevronLeft,
  Copy, RotateCcw, ExternalLink, Loader2,
  MessageSquarePlus, Bug, AlertTriangle, Lock, Zap,
  History, Plus, Trash2, Edit3, Search, Check, Brain, TrendingUp, Package,
  CalendarCheck, CreditCard, Users, FileSpreadsheet, Globe, BarChart3,
  ShieldCheck, Clock, Mic, Cpu, Wrench, ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/contexts/subscription-context"
import { apiClient, getAuthToken } from "@/lib/apiClient"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { VoiceInputModal } from "@/components/voice-input-modal"
import { SmartAIRobot, type SmartAIRobotMood } from "@/components/smart-ai-robot"

// ─── Types ──────────────────────────────────────────────────────────────────

interface WidgetPayload {
  type: "KPI_SUMMARY" | "DATA_TABLE" | "ACTION_CONFIRMATION_REQUIRED" | "UPGRADE_PROMPT" | string
  title?: string
  metrics?: Array<{ label: string; value: string | number; color?: string }>
  items?: Array<any>
  message?: string
  features?: string[]
  toolName?: string
  params?: Record<string, unknown>
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
  isError?: boolean
  retryAction?: { type: "prompt" } | { type: "confirm"; toolName: string; params: Record<string, unknown> }
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"

const MODEL_SPECS = [
  { key: "auto", label: "Auto", description: "AI picks the best specialist", icon: Sparkles, plan: "all", color: "from-violet-500 to-purple-600" },
  { key: "cnc", label: "CNC Service AI", description: "CNC troubleshooting, alarms, maintenance & service", icon: Cpu, plan: "basic", color: "from-amber-500 to-orange-600" },
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
  auto: "SmartERP Intelligence", cnc: "CNC Service AI", general: "General Assistant", finance: "Finance AI",
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

function filterSuggestedFollowUps(suggestions: string[], role: string) {
  if (["owner", "admin", "hr", "super_admin"].includes(role.toLowerCase())) return suggestions.slice(0, 4)
  const restricted = /\b(payroll|salary|financial|revenue|invoice|gst|tax|company-wide|all employees|manage employee|admin)\b/i
  return suggestions.filter((suggestion) => !restricted.test(suggestion)).slice(0, 4)
}

// ─── Widget Renderer ──────────────────────────────────────────────────────────

function WidgetRenderer({
  widget,
  onConfirm,
  confirming,
}: {
  widget: WidgetPayload
  onConfirm?: (toolName: string, params: Record<string, unknown>) => void
  confirming?: boolean
}) {
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

  if (widget.type === "ACTION_CONFIRMATION_REQUIRED" || widget.type === "ACTION_CONFIRMATION") {
    return (
      <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 space-y-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <span className="text-xs font-bold text-red-600 dark:text-red-400">{widget.title || "Confirmation Required"}</span>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">{widget.message || (widget as any).warning}</p>
        {(widget as any).proposedAction && (
          <div className="text-[11px] p-2 rounded-lg bg-background/80 border border-border/60 font-mono text-foreground">
            <strong>Action:</strong> {(widget as any).proposedAction}
          </div>
        )}
        <Button
          size="sm"
          disabled={!widget.toolName || confirming}
          className="w-full text-xs h-8 bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 disabled:opacity-60"
          onClick={() => widget.toolName && onConfirm?.(widget.toolName, widget.params || {})}
        >
          {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {confirming ? "Processing confirmation…" : widget.toolName ? "Confirm this action" : "Action confirmation unavailable"}
        </Button>
        {!widget.toolName && <p className="text-[10px] text-muted-foreground">This proposal has no executable action reference, so nothing was submitted.</p>}
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
  const reduceMotion = useReducedMotion()

  // ── Panel state
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMinimized, setIsMinimized] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const [showModelSelector, setShowModelSelector] = React.useState(false)
  const [isMultiAgent, setIsMultiAgent] = React.useState(false)

  const { isPro, isBasic } = useSubscription()

  function isModelLocked(modelKey: string) {
    if (isPro) return false // Pro: ALL 9 MODELS UNLOCKED!
    if (modelKey === "auto" || modelKey === "general") return false // Free + Basic: General AI unlocked

    if (isBasic) {
      // Basic unlocks: attendance, inventory, hr, support, operations
      const basicUnlocked = ["attendance", "inventory", "hr", "support", "operations"]
      return !basicUnlocked.includes(modelKey)
    }

    // Free plan: Locks all specialist models except auto & general
    return true
  }

  // ── Model selection
  const [selectedModel, setSelectedModel] = React.useState<string>("auto")
  const [multiAgentScopes, setMultiAgentScopes] = React.useState<string[]>([])

  // ── CNC Machine Context
  const [machines, setMachines] = React.useState<any[]>([])
  const [selectedMachine, setSelectedMachine] = React.useState<any | null>(null)
  const [showMachineDropdown, setShowMachineDropdown] = React.useState(false)

  // ── Conversation state
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<AIMessage[]>([])
  const [historySearch, setHistorySearch] = React.useState("")

  // ── Input state
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [confirmingTool, setConfirmingTool] = React.useState<string | null>(null)
  const [robotMood, setRobotMood] = React.useState<SmartAIRobotMood>("idle")
  const moodTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const confirmLockRef = React.useRef(false)
  const [showVoiceModal, setShowVoiceModal] = React.useState(false)

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
  const sendLockRef = React.useRef(false)

  // ── Load conversations from localStorage
  React.useEffect(() => {
    if (user?.id) {
      const convs = loadConversations(String(user.id))
      setConversations(convs)
      setTopActions(getTopActions(String(user.id)))
    }
  }, [user?.id])

  // ── Fetch company machines when panel opens or CNC model is active
  React.useEffect(() => {
    if (isOpen && user) {
      apiClient("/api/machines")
        .then((res: any) => {
          if (res && res.machines && Array.isArray(res.machines)) {
            setMachines(res.machines)
          } else if (Array.isArray(res)) {
            setMachines(res)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, user])

  // ── URL Search Param listener (e.g. ?askAI=cnc&machineId=123)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search)
        const askAI = params.get("askAI")
        const machineId = params.get("machineId")
        if (askAI === "cnc" || machineId) {
          setSelectedModel("cnc")
          setIsOpen(true)
          if (machineId && machines.length > 0) {
            const found = machines.find((m) => String(m.id) === String(machineId) || m.serial_number === machineId)
            if (found) setSelectedMachine(found)
          }
        }
      } catch {}
    }
  }, [machines])

  // ── Auto-scroll to latest message
  React.useEffect(() => {
    if (isOpen && !isMinimized) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [messages, isLoading, isOpen, isMinimized])

  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, isMinimized ? 56 : 112)}px`
  }, [input, isMinimized])

  // The mobile panel fills the viewport, so keep the page behind it from scrolling.
  React.useEffect(() => {
    if (!isOpen || isMinimized || typeof window === "undefined") return

    const body = document.body
    const previousOverflow = body.style.overflow
    const mobileViewport = window.matchMedia("(max-width: 639px)")
    const syncScrollLock = () => {
      body.style.overflow = mobileViewport.matches ? "hidden" : previousOverflow
    }

    syncScrollLock()
    mobileViewport.addEventListener("change", syncScrollLock)
    return () => {
      mobileViewport.removeEventListener("change", syncScrollLock)
      body.style.overflow = previousOverflow
    }
  }, [isOpen, isMinimized])

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

  function welcomeSuggestions() {
    const role = String(user?.role || "employee").toLowerCase()
    if (["owner", "admin"].includes(role)) {
      return ["Today's attendance summary", "Show active jobs", "Check low-stock inventory", "Summarize invoices"]
    }
    if (role === "hr") {
      return ["Today's attendance summary", "Show pending leave requests", "Summarize employee attendance", "Open HR tools"]
    }
    if (role === "super_admin") {
      return ["Show platform health", "Review AI activity", "Summarize company operations", "Open admin tools"]
    }
    return ["Show my assigned jobs", "Show my attendance", "Check my leave status", "Help me find a feature"]
  }

  function welcomeMessage(): AIMessage {
    const role = String(user?.role || "employee").toLowerCase()
    const capabilities = role === "employee"
      ? ["Assigned jobs and tasks", "Personal attendance and leave", "SmartERP guidance"]
      : role === "hr"
        ? ["Attendance and leave", "Employee operations", "HR tools"]
        : role === "super_admin"
          ? ["Platform operations", "Company health", "Admin tools"]
          : ["Jobs and service operations", "Attendance and HR", "Inventory, invoices, and reports"]
    const firstName = user?.name?.split(" ")[0]
    return {
      id: "welcome",
      sender: "ai",
      text: `${firstName ? `Hi ${firstName}! 👋\n` : "Hello! 👋\n"}I'm **SmartERP AI**, your ERP assistant.\n\nI can help you with:\n${capabilities.map(capability => `• ${capability}`).join("\n")}\n\nChoose a suggestion or ask me anything.`,
      timestamp: new Date(),
      suggestedFollowUps: welcomeSuggestions(),
    }
  }

  // ── Open panel: restore or start conversation
  function handleOpen() {
    setIsOpen(true)
    setIsMinimized(false)
    setIsExpanded(false)
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
  async function sendMessage(promptText?: string, previousMessages: AIMessage[] = messages) {
    const text = (promptText || input).trim()
    if (!text || isLoading || sendLockRef.current) return
    sendLockRef.current = true

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

    const newMessages = [...previousMessages, userMsg, typingMsg]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current)
    setRobotMood("thinking")
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

      const clientCtx: any = {
        currentPage: pathname,
        portal: currentPortal,
        module: pageModule,
      }
      if (selectedMachine) {
        clientCtx.selectedMachine = {
          id: selectedMachine.id,
          name: selectedMachine.machine_name,
          serial: selectedMachine.serial_number,
          controller: selectedMachine.controller_type,
          make: selectedMachine.make,
          model: selectedMachine.model,
          spindle_hours: selectedMachine.spindle_hours,
          status: selectedMachine.status,
          customer: selectedMachine.customer_name,
          plant: selectedMachine.plant_name,
        }
      }

      const body: any = {
        message: text,
        currentPortal,
        currentModule: pageModule,
        currentPagePath: pathname,
        clientContext: clientCtx,
        history: previousMessages
          .filter(m => !m.isTyping)
          .slice(-10)
          .map(m => ({ sender: m.sender === "user" ? "user" : "assistant", content: m.text })),
        autoMode: selectedModel === "auto",
      }

      if (scopesToSend.length > 0) body.modelScopes = scopesToSend

      const data = await apiClient("/api/ai/agent", {
        method: "POST",
        body: JSON.stringify(body),
      })

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
        suggestedFollowUps: filterSuggestedFollowUps(data.suggestedFollowUps || [], String(user?.role || "employee")),
        latencyMs: data.telemetry?.latencyMs,
        intercepted: data.intercepted || false,
        multiAgent: data.multiAgent || false,
        scopesUsed: data.scopesUsed || [],
      }

      const finalMessages = [...previousMessages, userMsg, aiMsg]
      setMessages(finalMessages)
      persistMessages(finalMessages)
      setTopActions(getTopActions(String(user.id)))
      // An answer is not proof that a business action was completed. Reserve the
      // success animation for explicit successful confirmations below.
      setRobotMood("idle")
    } catch (err: any) {
      let friendlyText = "I'm temporarily connecting to live services. Please ask again or select a suggested topic below."
      if (err?.message === "PLAN_LOCKED") {
        friendlyText = "This feature requires a higher plan. Upgrade to unlock full AI capabilities."
      } else if (err?.message && !err.message.includes("cancelled") && !err.message.includes("Abort")) {
        friendlyText = `I'm processing your request. If this takes longer than expected, please try one of the quick actions below.`
      }

      const errorMsg: AIMessage = {
        id: `err_${Date.now()}`,
        sender: "ai",
        text: friendlyText,
        timestamp: new Date(),
        isError: true,
        retryAction: { type: "prompt" },
        suggestedFollowUps: welcomeSuggestions(),
      }
      const errMessages = [...previousMessages, userMsg, errorMsg]
      setMessages(errMessages)
      persistMessages(errMessages)
      setRobotMood("error")
      moodTimeoutRef.current = setTimeout(() => setRobotMood("idle"), 1800)
    } finally {
      setIsLoading(false)
      sendLockRef.current = false
    }
  }

  async function confirmAIAction(toolName: string, params: Record<string, unknown>) {
    if (confirmLockRef.current) return
    confirmLockRef.current = true
    setConfirmingTool(toolName)
    try {
      const result = await apiClient<any>("/api/ai/confirm-action", {
        method: "POST",
        body: JSON.stringify({ toolName, params }),
      })
      const stillNeedsConfirmation = result?.requiresUserConfirmation === true ||
        result?.type === "ACTION_CONFIRMATION_REQUIRED" ||
        result?.action === "ACTION_CONFIRMATION_REQUIRED"
      const actionFailed = Boolean(result?.error) || result?.success === false
      const responseText = result?.text || result?.message || (
        stillNeedsConfirmation
          ? "The server returned another confirmation request. The action has not been completed."
          : result?.success === true
            ? "The server confirmed that the action completed."
            : "The server returned a result. Review the related module to confirm its final status."
      )
      const responseMessage: AIMessage = {
        id: `confirm_${Date.now()}`,
        sender: "ai",
        text: responseText,
        timestamp: new Date(),
        isError: stillNeedsConfirmation || actionFailed,
      }
      const updatedMessages = [...messages, responseMessage]
      setMessages(updatedMessages)
      persistMessages(updatedMessages)
      if (stillNeedsConfirmation || actionFailed) setRobotMood("error")
      else if (result?.success === true) setRobotMood("success")
      else setRobotMood("idle")
      if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current)
      moodTimeoutRef.current = setTimeout(() => setRobotMood("idle"), 1800)
    } catch {
      const responseMessage: AIMessage = {
        id: `confirm_error_${Date.now()}`,
        sender: "ai",
        text: "The confirmation request did not return a final result. Check the related module before retrying to avoid repeating an action.",
        timestamp: new Date(),
        isError: true,
      }
      const updatedMessages = [...messages, responseMessage]
      setMessages(updatedMessages)
      persistMessages(updatedMessages)
      setRobotMood("error")
    } finally {
      confirmLockRef.current = false
      setConfirmingTool(null)
    }
  }

  const handleVoiceListeningChange = React.useCallback((listening: boolean) => {
    setRobotMood((current) => listening ? "listening" : current === "listening" ? "idle" : current)
  }, [])

  React.useEffect(() => () => {
    if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current)
  }, [])

  // ── Copy response
  function copyMessage(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  // ── Regenerate last AI response
  async function regenerateLastResponse() {
    const lastAIIndex = messages.findLastIndex(m => m.sender === "ai")
    const lastUserIndex = messages.findLastIndex((m, index) => index < lastAIIndex && m.sender === "user")
    const lastUserMsg = lastUserIndex >= 0 ? messages[lastUserIndex] : undefined
    if (!lastUserMsg) return
    // Keep the transcript up to the failed request, then retry without duplicating its user bubble.
    const beforeRetry = messages.slice(0, lastUserIndex)
    setMessages(beforeRetry)
    await sendMessage(lastUserMsg.text, beforeRetry)
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
            initial={reduceMotion ? false : { scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.82, opacity: 0 }}
            className={cn(
              "fixed z-40 flex items-center justify-center transition-all duration-300",
              pathname?.includes("/messages")
                ? "bottom-24 right-3 sm:bottom-28 sm:right-6"
                : "bottom-[max(env(safe-area-inset-bottom),0.75rem)] right-3 sm:bottom-6 sm:right-6"
            )}
          >
            <motion.button
              whileHover={reduceMotion ? undefined : { scale: 1.05 }}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              onClick={handleOpen}
              id="smart-ai-panel-trigger"
              title="Open SmartERP AI Operations Assistant"
              aria-label="Open SmartERP AI assistant"
              aria-haspopup="dialog"
              className="group relative flex h-[86px] w-[76px] items-center justify-center overflow-visible rounded-[30px] border-0 bg-transparent p-0 shadow-none transition-[filter,transform] hover:drop-shadow-[0_12px_18px_rgba(79,70,229,.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/40 motion-reduce:transition-none sm:h-[104px] sm:w-[92px]"
            >
              <span className="pointer-events-none absolute bottom-2 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-violet-500/20 blur-md sm:bottom-3 sm:h-4 sm:w-16" />
              <SmartAIRobot mood={robotMood} size="lg" />
            </motion.button>
            <div className="pointer-events-none absolute bottom-full right-1 mb-2 hidden w-[178px] rounded-2xl border border-violet-100 bg-white/95 px-3.5 py-2.5 text-left text-[12px] leading-snug text-slate-800 shadow-[0_10px_28px_rgba(38,35,91,.14)] backdrop-blur-sm sm:block dark:border-violet-300/15 dark:bg-slate-950/95 dark:text-slate-100">
              <span className="font-semibold">Hi! Need help?</span>
              <br />Ask me anything.
              <span className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-violet-100 bg-white/95 dark:border-violet-300/15 dark:bg-slate-950/95" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Panel ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="smart-ai-panel"
            initial={reduceMotion ? false : { y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 18, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{ overscrollBehavior: "contain" }}
            className={cn(
              "fixed z-50 flex flex-col overflow-visible overscroll-contain",
              "right-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] h-[min(620px,calc(100dvh-1rem))] w-[min(400px,calc(100vw-1.5rem))] pt-[54px]",
              "max-sm:inset-0 max-sm:h-dvh max-sm:w-screen max-sm:rounded-none max-sm:pt-0",
              isExpanded && "inset-3 h-auto w-auto pt-0 max-sm:inset-0",
              isMinimized && "inset-auto bottom-[max(env(safe-area-inset-bottom),1rem)] right-4 h-[132px] w-[min(360px,calc(100vw-2rem))] pt-0 max-sm:inset-auto max-sm:bottom-[max(env(safe-area-inset-bottom),0.75rem)] max-sm:right-3 max-sm:h-[132px] max-sm:w-[calc(100vw-1.5rem)]"
            )}
            role="dialog"
            aria-modal="false"
            aria-label="SmartERP AI assistant"
          >
            {!isExpanded && !isMinimized && (
              <div className="pointer-events-none absolute left-1/2 top-[-16px] z-20 hidden h-[112px] w-32 -translate-x-1/2 overflow-hidden sm:block">
                <SmartAIRobot mood={isLoading ? "thinking" : robotMood} size="hero" />
              </div>
            )}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-violet-200/70 bg-background shadow-[0_20px_64px_rgba(19,24,48,.22)] dark:border-violet-300/15 max-sm:rounded-none max-sm:border-0">
            {/* ── Panel Header ───────────────────────────────────────────────── */}
            <div className={cn(
              "relative flex min-h-[60px] items-center justify-between border-b border-border/70 px-3 py-2.5",
              "before:absolute before:left-0 before:right-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-violet-500 before:via-indigo-500 before:to-sky-400",
              "shrink-0 bg-background"
            )} style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
              <div className="flex min-w-0 items-center gap-2.5">
                <SmartAIRobot mood={isLoading ? "thinking" : robotMood} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-foreground tracking-tight">SmartERP AI</h2>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", isLoading ? "animate-pulse bg-violet-500" : robotMood === "error" ? "bg-rose-500" : "bg-emerald-500")} />
                    {isLoading || robotMood === "thinking" ? "Thinking…" : robotMood === "listening" ? "Listening…" : robotMood === "error" ? "Request failed · retry available" : "Online"}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">Your ERP assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {!isMinimized && (
                  <>
                    <Button variant="ghost" size="icon" aria-label="Conversation history" title="Conversation history" className="h-7 w-7 rounded-lg hover:bg-muted/60" onClick={() => setShowHistory(s => !s)}>
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Start a new conversation" title="New conversation" className="h-7 w-7 rounded-lg hover:bg-muted/60" onClick={startNewConversation}>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={isExpanded ? "Restore chat window size" : "Expand chat window"} title={isExpanded ? "Restore size" : "Expand"} className="hidden h-7 w-7 rounded-lg hover:bg-muted/60 sm:inline-flex" onClick={() => setIsExpanded(s => !s)}>
                      {isExpanded ? <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" /> : <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" aria-label={isMinimized ? "Restore chat window" : "Minimize chat window"} title={isMinimized ? "Restore" : "Minimize"} className="h-7 w-7 rounded-lg hover:bg-muted/60" onClick={() => setIsMinimized(s => !s)}>
                  {isMinimized ? <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" /> : <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label="Close SmartERP AI" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => { setIsOpen(false); setIsMinimized(false) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <div className="relative flex min-h-0 flex-1 overflow-hidden">
                {/* ── History Sidebar ───────────────────────────────────────── */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={reduceMotion ? false : { width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
                      className="flex flex-col border-r border-border/60 bg-muted/20 shrink-0 overflow-hidden w-full sm:w-[220px] max-sm:absolute max-sm:inset-0 max-sm:z-30 max-sm:bg-background"
                    >
                      <div className="p-2 border-b border-border/40 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:hidden shrink-0"
                          onClick={() => setShowHistory(false)}
                          aria-label="Back to chat"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="relative flex-1">
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
                              onClick={() => {
                                if (renamingConvId !== conv.id) {
                                  loadConversation(conv)
                                  setShowHistory(false)
                                }
                              }}
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
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {/* Model Selector Bar */}
                  <div className="shrink-0 border-b border-border/40 bg-muted/10 px-3 py-1.5">
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
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.15 }}
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
                                  <div className={cn("w-6 h-6 rounded-lg bg-linear-to-br flex items-center justify-center shrink-0", model.color)}>
                                    <model.icon className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-bold text-foreground truncate flex items-center gap-1">
                                      {model.label}
                                      {isModelLocked(model.key) && <Lock className="h-2.5 w-2.5 text-amber-500" />}
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

                    {/* CNC Machine Context Selector & Quick Actions */}
                    {selectedModel === "cnc" && (
                      <div className="mt-2 pt-2 border-t border-border/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <Cpu className="h-3.5 w-3.5" />
                            <span>Machine Context</span>
                          </div>
                          {selectedMachine && (
                            <button
                              onClick={() => setSelectedMachine(null)}
                              className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {selectedMachine ? (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate">{selectedMachine.machine_name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono truncate">
                                {selectedMachine.controller_type || "CNC"} • SN: {selectedMachine.serial_number}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400 bg-background/50">
                              CONNECTED
                            </Badge>
                          </div>
                        ) : (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowMachineDropdown(s => !s)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-dashed border-border/80 bg-background/50 hover:bg-muted/40 text-xs text-muted-foreground font-medium"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Cpu className="h-3 w-3 text-amber-500 shrink-0" />
                                {machines.length > 0 ? "Select machine from registry..." : "No machines registered"}
                              </span>
                              <ChevronDown className="h-3 w-3 shrink-0" />
                            </button>

                            {showMachineDropdown && machines.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-xl p-1 space-y-0.5">
                                {machines.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedMachine(m)
                                      setShowMachineDropdown(false)
                                    }}
                                    className="w-full text-left p-2 rounded-lg hover:bg-amber-500/10 transition-colors text-xs space-y-0.5"
                                  >
                                    <div className="font-bold text-foreground">{m.machine_name}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">
                                      {m.controller_type || "Universal"} • SN: {m.serial_number} • {m.customer_name || "Plant"}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CNC Specialized Quick Actions */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
                          {[
                            { label: "🔴 Decode Alarm", prompt: selectedMachine ? `Decode alarm for ${selectedMachine.machine_name} (${selectedMachine.controller_type})` : "Decode CNC alarm code" },
                            { label: "🔧 Spindle Fault", prompt: selectedMachine ? `Why won't spindle start on ${selectedMachine.machine_name}?` : "Why won't spindle start?" },
                            { label: "📜 History", prompt: selectedMachine ? `Show previous service history on ${selectedMachine.machine_name}` : "Show machine service history" },
                            { label: "📦 Spare Parts", prompt: "Check available CNC spare parts in stock" },
                            { label: "🛡 Warranty", prompt: selectedMachine ? `Check warranty status for ${selectedMachine.machine_name}` : "Check machine warranty status" },
                            { label: "🚨 Escalate", prompt: selectedMachine ? `Create a service escalation for ${selectedMachine.machine_name}` : "Create a service escalation" },
                          ].map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => sendMessage(action.prompt)}
                              className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all font-semibold"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Messages Scroll Area */}
                  <div
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 touch-pan-y overscroll-contain"
                    style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
                  >
                    {messages.map(msg => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        onCopy={copyMessage}
                        onRegenerate={regenerateLastResponse}
                        onConfirm={confirmAIAction}
                        confirmingTool={confirmingTool}
                        onFollowUp={text => { setInput(""); sendMessage(text); recordPrompt(String(user.id), autoModelBadge || selectedModel, text) }}
                        onNavigate={path => { router.push(path); setIsOpen(false) }}
                        isLastAI={msg.sender === "ai" && msg === [...messages].reverse().find(m => m.sender === "ai")}
                      />
                    ))}
                    <div ref={messagesEndRef} className="h-2" />
                  </div>

                  {/* Personalized Quick Actions */}
                  {topActions.length > 0 && messages.length <= 1 && !messages.some(message => message.suggestedFollowUps?.length) && (
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
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={reduceMotion ? { duration: 0 } : undefined}
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
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={reduceMotion ? { duration: 0 } : undefined}
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
                  <div className="shrink-0 border-t border-border/60 bg-background px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2.5 sm:p-3">
                    <div className="flex items-end gap-1.5 rounded-[18px] border border-border/70 bg-background px-1.5 py-1.5 shadow-sm transition-colors focus-within:border-violet-400/70 focus-within:ring-2 focus-within:ring-violet-500/10">
                      <div className="relative min-w-0 flex-1">
                        <Textarea
                          ref={textareaRef}
                          value={input}
                          disabled={isLoading}
                          aria-label="Message SmartERP AI"
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
                              ? "Ask anything about SmartERP…"
                              : `Ask ${MODEL_DISPLAY_NAMES[selectedModel] || "AI"}…`
                          }
                          rows={1}
                          className="min-h-9 max-h-28 resize-none overflow-y-auto rounded-xl border-0 bg-transparent px-2 py-2 text-sm shadow-none transition-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          style={{ height: "auto" }}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowVoiceModal(true)}
                        size="icon"
                        variant="outline"
                        title="Voice-to-Command / Shop Floor Mic"
                        aria-label="Open voice input"
                        className="h-9 w-9 shrink-0 rounded-full border-0 bg-muted/70 text-violet-600 hover:bg-muted dark:bg-muted/50 dark:text-violet-400"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        aria-label="Send message"
                        className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm hover:from-violet-700 hover:to-indigo-700"
                      >
                        {isLoading
                          ? <Loader2 className="h-4 w-4 animate-spin text-white" />
                          : <Send className="h-4 w-4 text-white" />
                        }
                      </Button>
                    </div>
                    <p className="mt-1.5 text-center text-[9px] text-muted-foreground/70">
                      AI responses may be inaccurate. Verify important information.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isMinimized && (
              <div className="flex shrink-0 items-center gap-1.5 border-t border-border/60 bg-background px-2.5 py-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  disabled={isLoading}
                  aria-label="Message SmartERP AI"
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Ask a question…"
                  rows={1}
                  className="min-h-9 max-h-14 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border-0 bg-muted/40 px-3 py-2 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-violet-500/30"
                />
                <Button type="button" onClick={() => setShowVoiceModal(true)} size="icon" variant="ghost" title="Voice input" aria-label="Open voice input" className="h-9 w-9 shrink-0 rounded-full text-violet-600 dark:text-violet-400">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} size="icon" aria-label="Send message" className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                </Button>
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop Floor Voice AI Modal */}
      <VoiceInputModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        portal={currentPortal}
        onListeningChange={handleVoiceListeningChange}
        onError={() => {
          if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current)
          setRobotMood("error")
          moodTimeoutRef.current = setTimeout(() => setRobotMood("idle"), 1800)
        }}
        onSuccess={(res) => {
          if (res?.text) {
            toast.success("SmartERP AI response received.")
            setRobotMood("idle")
            setShowVoiceModal(false)
          }
        }}
      />
    </>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg, onCopy, onRegenerate, onConfirm, confirmingTool, onFollowUp, onNavigate, isLastAI
}: {
  msg: AIMessage
  onCopy: (text: string) => void
  onRegenerate: () => void
  onConfirm: (toolName: string, params: Record<string, unknown>) => void
  confirmingTool: string | null
  onFollowUp: (text: string) => void
  onNavigate: (path: string) => void
  isLastAI: boolean
}) {
  const [showActions, setShowActions] = React.useState(false)
  const [showSources, setShowSources] = React.useState(false)
  const reduceMotion = useReducedMotion()

  if (msg.isTyping) {
    return (
      <div className="flex items-start gap-2" role="status" aria-label="SmartERP AI is thinking">
        <SmartAIRobot mood="thinking" size="sm" />
        <div className="rounded-2xl rounded-tl-sm border border-border/40 bg-muted/60 px-3 py-2.5">
          <div className="flex gap-1.5 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms] motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms] motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms] motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    )
  }

  const isUser = msg.sender === "user"

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div className={cn(
        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isUser
          ? "bg-gradient-to-br from-blue-500 to-blue-700"
          : "bg-transparent"
      )}>
        {isUser ? <User className="h-3.5 w-3.5 text-white" /> : <SmartAIRobot mood={msg.isError ? "error" : "idle"} size="sm" />}
      </div>

      <div className={cn("flex-1 max-w-[85%]", isUser && "flex flex-col items-end")}>
        {/* Bubble */}
        <div
          onMouseEnter={() => !isUser && setShowActions(true)}
          onMouseLeave={() => !isUser && setShowActions(false)}
          className={cn(
            "relative rounded-[18px] px-3.5 py-2.5 text-[13px] leading-[1.55]",
            isUser
              ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-sm"
              : msg.isError
                ? "bg-rose-500/5 border border-rose-500/20 text-foreground rounded-tl-sm"
                : "bg-slate-50 border border-slate-200/80 text-foreground rounded-tl-sm dark:bg-slate-900/60 dark:border-slate-700/70"
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

          {msg.isError && msg.retryAction && (
            <button
              type="button"
              onClick={() => msg.retryAction?.type === "confirm"
                ? onConfirm(msg.retryAction.toolName, msg.retryAction.params)
                : onRegenerate()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-background/70 px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <RotateCcw className="h-3 w-3" /> Try again
            </button>
          )}

          {/* Widget */}
          {msg.widget && (
            <WidgetRenderer
              widget={msg.widget}
              onConfirm={onConfirm}
              confirming={!!msg.widget.toolName && confirmingTool === msg.widget.toolName}
            />
          )}

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
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : undefined}
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
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={reduceMotion ? { duration: 0 } : undefined}
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
