"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Send, Search, User, Check, Clock, Filter, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/apiClient"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

interface Employee {
  id: string
  name: string
  email: string
  position?: string
  department?: string
  role?: string
}

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  message: string
  read: boolean
  created_at: string
  is_mine: boolean
}

export default function HRMessagesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await apiClient("/api/employees")
        if (Array.isArray(data)) {
          setEmployees(data)
          if (data.length > 0) setSelectedContact(data[0])
        }
      } catch (err) {
        logger.error("Failed to fetch employees:", err)
      } finally {
        setLoadingEmployees(false)
      }
    }
    fetchEmployees()
  }, [])

  // Fetch messages when contact changes
  useEffect(() => {
    if (!selectedContact) return

    async function fetchMessages() {
      setLoadingMessages(true)
      try {
        const data = await apiClient(`/api/messages/conversation/${selectedContact?.id}`)
        setMessages(data)
        setTimeout(scrollToBottom, 100)
      } catch (err) {
        logger.error("Failed to fetch messages:", err)
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedContact])

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact || sending) return
    
    setSending(true)
    try {
      await apiClient("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          receiver_id: selectedContact.id,
          message: message.trim()
        })
      })
      setMessage("")
      // Optimized: Refresh messages immediately
      const data = await apiClient(`/api/messages/conversation/${selectedContact.id}`)
      setMessages(data)
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      logger.error("Error sending message:", err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <HRLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-700">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
             <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
               <MessageSquare className="h-8 w-8 text-primary" />
               Smart<span className="text-primary italic">Messages</span>
             </h1>
             <p className="text-muted-foreground font-medium text-sm">Real-time communication with every member of your organization.</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
          
          {/* Enhanced Contacts List */}
          <Card className="flex-[0.35] border border-border shadow-xs flex flex-col overflow-hidden rounded-2xl bg-card">
            <CardHeader className="p-4 sm:p-5 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                 <CardTitle className="text-base font-semibold tracking-tight text-slate-900">Active Team</CardTitle>
                 <Badge variant="secondary" className="rounded-full font-medium text-xs">{employees.length} Users</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  className="pl-9 h-9 rounded-lg bg-slate-50 border-slate-200 text-sm focus:bg-white" 
                  placeholder="Search team members..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto overflow-x-hidden">
               {loadingEmployees ? (
                 <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1.5 flex-1 pt-1">
                           <Skeleton className="h-3 w-1/2" />
                           <Skeleton className="h-2.5 w-full" />
                        </div>
                      </div>
                    ))}
                 </div>
               ) : filteredEmployees.length > 0 ? (
                 filteredEmployees.map(e => (
                  <div 
                    key={e.id} 
                    className={cn(
                      "p-3.5 px-5 cursor-pointer border-b border-border/50 transition-colors relative",
                      selectedContact?.id === e.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-slate-50"
                    )}
                    onClick={() => setSelectedContact(e)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs",
                        selectedContact?.id === e.id ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"
                      )}>
                        {e.name?.charAt(0) || <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{e.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{e.position || "Staff"}</p>
                      </div>
                    </div>
                  </div>
                 ))
               ) : (
                 <div className="p-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No contacts found</p>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Premium Chat Interface */}
          <Card className="flex-[0.65] border border-border shadow-xs flex flex-col overflow-hidden rounded-2xl bg-card text-foreground relative">
            {/* Chat Header */}
            <CardHeader className="bg-slate-50/70 border-b border-border p-4 px-6">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                        {selectedContact?.name?.charAt(0) || "U"}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div>
                       <h3 className="font-semibold text-base text-slate-900 tracking-tight">{selectedContact ? selectedContact.name : "Select a Contact"}</h3>
                       <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{selectedContact?.email || "No email"}</p>
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <Badge variant="outline" className="h-4 text-[10px] font-medium border-border px-1.5 leading-none">{selectedContact?.department || "General"}</Badge>
                       </div>
                    </div>
                 </div>
               </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-6 overflow-y-auto space-y-3 bg-white">
               {selectedContact ? (
                 <>
                   {messages.length > 0 ? (
                     messages.map((m) => (
                       <div key={m.id} className={cn("flex", m.is_mine ? "justify-end" : "justify-start")}>
                         <div className={cn(
                           "flex flex-col gap-1 max-w-[75%]",
                           m.is_mine ? "items-end" : "items-start"
                         )}>
                            <div className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm font-normal shadow-xs",
                              m.is_mine 
                                ? "bg-primary text-primary-foreground rounded-tr-xs" 
                                : "bg-slate-100 border border-slate-200/80 text-slate-900 rounded-tl-xs"
                            )}>
                               {m.message}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                               {m.is_mine && <Check className="inline-block w-2.5 h-2.5 mr-1 text-primary" />}
                               {formatTime(m.created_at)}
                            </span>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="flex flex-col h-full items-center justify-center space-y-2 opacity-50 py-16">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        <p className="font-medium text-xs text-muted-foreground">No conversation history</p>
                     </div>
                   )}
                   <div ref={messagesEndRef} />
                 </>
               ) : (
                 <div className="flex flex-col h-full items-center justify-center space-y-3 opacity-50 py-24">
                    <MessageSquare className="h-10 w-10 text-muted-foreground" />
                    <p className="font-medium text-sm text-muted-foreground">Select a member to start</p>
                 </div>
               )}
            </CardContent>

            {/* Input Bar */}
            <div className="p-4 px-6 border-t border-border bg-slate-50/50">
               <div className="relative flex items-center gap-2 bg-white border border-border rounded-xl p-1.5 px-3 shadow-xs focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                 <Input 
                   className="bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-muted-foreground text-sm font-normal h-9 flex-1" 
                   placeholder={selectedContact ? `Write to ${selectedContact.name}...` : 'Select a contact'} 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                   disabled={!selectedContact || sending}
                 />
                 <Button 
                   className="h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs group transition-all"
                   onClick={handleSendMessage}
                   disabled={!message.trim() || !selectedContact || sending}
                 >
                   {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                 </Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
