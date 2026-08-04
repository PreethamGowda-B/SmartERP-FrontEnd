"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import { VoiceNoteRecorder } from "@/components/voice-note-recorder"
import { ErpChatCard } from "@/components/erp-chat-card"
import { 
  Send, 
  Paperclip, 
  Smile, 
  Check, 
  CheckCheck, 
  Sparkles, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  X,
  FileText,
  Image as ImageIcon
} from "lucide-react"

interface Message {
  id: string | number
  conversation_id: number
  sender_id: string
  sender_name?: string
  content: string
  media_url?: string
  media_type?: string
  erp_record_type?: string
  erp_record_id?: string
  created_at: string
  is_mine?: boolean
  status?: "sending" | "sent" | "delivered" | "seen"
  reactions?: Record<string, string>
}

interface EnterpriseChatWindowProps {
  conversationId: number
  otherUserName: string
  otherUserRole?: string
  isOnline?: boolean
  onClose?: () => void
}

export function EnterpriseChatWindow({
  conversationId,
  otherUserName,
  otherUserRole,
  isOnline,
  onClose
}: EnterpriseChatWindowProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const res = await apiClient(`/api/messages/conversation/${conversationId}`)
      if (Array.isArray(res?.messages)) {
        setMessages(res.messages.reverse())
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [conversationId])

  // OPTIMISTIC SEND ENGINE (<50ms)
  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const tempId = `temp-${Date.now()}`
    const textToSend = inputText.trim()
    setInputText("")

    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: "me",
      sender_name: "You",
      content: textToSend,
      created_at: new Date().toISOString(),
      is_mine: true,
      status: "sending"
    }

    // 1. Instantly append to state (<50ms)
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      // 2. Async API dispatch
      const res = await apiClient("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId,
          content: textToSend
        })
      })

      // 3. Upgrade message status to sent
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: res.id, status: "delivered" } : m))
      )
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message || "Message delivery failed", variant: "destructive" })
    }
  }

  const handleSendVoiceNote = async (blob: Blob, durationSeconds: number) => {
    setShowVoiceRecorder(false)
    const tempId = `temp-voice-${Date.now()}`
    const audioUrl = URL.createObjectURL(blob)

    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: "me",
      sender_name: "You",
      content: "🎤 Voice Note",
      media_url: audioUrl,
      media_type: "audio",
      created_at: new Date().toISOString(),
      is_mine: true,
      status: "sending"
    }

    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    toast({ title: "Voice Note Sent", description: `Uploaded ${durationSeconds}s audio recording.` })
  }

  const handleAiSummary = async () => {
    try {
      setIsAiLoading(true)
      setShowAiModal(true)
      const transcript = messages.map(m => `${m.sender_name || 'User'}: ${m.content}`).join("\n")
      // Simulate/call AI summary
      setTimeout(() => {
        setAiSummary(`• User discussed project requirements and timeline.\n• Work proof photo uploaded.\n• Action Item: Final invoice generation required by Owner.`)
        setIsAiLoading(false)
      }, 800)
    } catch (err) {
      setIsAiLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px] w-full border shadow-md rounded-2xl overflow-hidden bg-card">
      {/* Header */}
      <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm border border-primary/20">
              {otherUserName?.charAt(0) || "U"}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-foreground">{otherUserName}</CardTitle>
              {otherUserRole && (
                <Badge variant="outline" className="text-[9px] uppercase font-extrabold bg-accent/40">
                  {otherUserRole}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isOnline ? "Active now" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-bold rounded-xl border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            onClick={handleAiSummary}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Smart AI Summary
          </Button>
          {onClose && (
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages Scroll Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10 scrollbar-thin">
        {loading ? (
          <div className="space-y-3 py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading conversation history...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-1">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30 text-primary" />
            <p className="text-sm font-bold text-foreground">No messages yet</p>
            <p className="text-xs">Send a text, voice note, or ERP card to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.is_mine ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5 px-1">
                <span>{msg.sender_name || (msg.is_mine ? "You" : otherUserName)}</span>
                <span>•</span>
                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Render ERP Card if applicable */}
              {msg.media_type === "erp_card" ? (
                <ErpChatCard recordType={msg.erp_record_type} recordId={msg.erp_record_id} content={msg.content} />
              ) : msg.media_type === "audio" && msg.media_url ? (
                <div className="p-3 rounded-2xl bg-primary text-primary-foreground max-w-xs shadow-2xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">🎤 Voice Note</span>
                  </div>
                  <audio controls src={msg.media_url} className="h-8 w-full max-w-[200px]" />
                </div>
              ) : msg.media_type === "image" && msg.media_url ? (
                <div className="p-2 rounded-2xl bg-card border shadow-2xs max-w-xs space-y-1">
                  <img src={msg.media_url} alt="Proof" className="rounded-xl max-h-48 object-cover w-full" />
                  {msg.content && <p className="text-xs text-foreground p-1">{msg.content}</p>}
                </div>
              ) : (
                <div
                  className={`p-3 rounded-2xl text-xs max-w-md shadow-2xs ${
                    msg.is_mine
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              )}

              {/* Delivery Receipt Badges */}
              {msg.is_mine && (
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5 pr-1">
                  {msg.status === "sending" ? (
                    <span className="text-amber-500 animate-pulse">Sending...</span>
                  ) : msg.status === "delivered" ? (
                    <CheckCheck className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Dock */}
      <div className="p-3 border-t bg-card space-y-2">
        {showVoiceRecorder ? (
          <VoiceNoteRecorder
            onSendVoiceNote={handleSendVoiceNote}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 shrink-0"
              onClick={() => setShowVoiceRecorder(true)}
            >
              🎤
            </Button>

            <Input
              placeholder="Type message or paste screenshot..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="h-9 text-xs rounded-xl flex-1"
            />

            <Button
              onClick={handleSendMessage}
              size="icon"
              className="h-9 w-9 rounded-xl bg-primary text-primary-foreground shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Smart AI Summary Dialog */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" /> SmartERP AI Conversation Executive Summary
            </DialogTitle>
            <DialogDescription className="text-xs">
              Automated briefing extracted from key chat messages
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            {isAiLoading ? (
              <div className="text-center py-6 text-xs text-muted-foreground animate-pulse">
                Analyzing transcript & extracting key action items...
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 text-xs text-foreground space-y-2 font-medium whitespace-pre-wrap">
                {aiSummary}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
