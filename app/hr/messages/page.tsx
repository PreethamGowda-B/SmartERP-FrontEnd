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
          <Card className="flex-[0.35] border-none shadow-xl flex flex-col overflow-hidden rounded-[2rem] bg-card/60 backdrop-blur-sm border border-border/50">
            <CardHeader className="p-6 border-b space-y-4">
              <div className="flex items-center justify-between">
                 <CardTitle className="text-lg font-black tracking-tight">Active Team</CardTitle>
                 <Badge variant="secondary" className="rounded-full font-bold">{employees.length} Users</Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  className="pl-9 h-10 rounded-xl bg-muted/50 border-none shadow-inner text-sm font-medium" 
                  placeholder="Search team members..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary/20">
               {loadingEmployees ? (
                 <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1 pt-1">
                           <Skeleton className="h-3 w-1/2" />
                           <Skeleton className="h-2 w-full" />
                        </div>
                      </div>
                    ))}
                 </div>
               ) : filteredEmployees.length > 0 ? (
                 filteredEmployees.map(e => (
                  <div 
                    key={e.id} 
                    className={cn(
                      "p-4 px-6 cursor-pointer border-b border-border/30 transition-all duration-300 relative",
                      selectedContact?.id === e.id ? "bg-primary/5 shadow-inner" : "hover:bg-muted/30"
                    )}
                    onClick={() => setSelectedContact(e)}
                  >
                    {selectedContact?.id === e.id && (
                       <div className="absolute left-0 top-0 w-1 h-full bg-primary" />
                    )}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center font-black text-xs shadow-sm shadow-primary/20",
                        selectedContact?.id === e.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {e.name?.charAt(0) || <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm tracking-tight truncate">{e.name}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">{e.position || "Staff"}</p>
                      </div>
                    </div>
                  </div>
                 ))
               ) : (
                 <div className="p-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold">No contacts found</p>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Premium Chat Interface */}
          <Card className="flex-[0.65] border-none shadow-2xl flex flex-col overflow-hidden rounded-[2rem] bg-zinc-950 text-white relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] -z-10 rounded-full" />
            
            {/* Chat Header */}
            <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 p-5 px-8">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-xl shadow-primary/30">
                        {selectedContact?.name?.charAt(0) || "U"}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-zinc-950 animate-pulse" />
                    </div>
                    <div>
                       <h3 className="font-black text-lg tracking-tight">{selectedContact ? selectedContact.name : "Select a Contact"}</h3>
                       <div className="flex items-center gap-3">
                          <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{selectedContact?.email}</p>
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <Badge variant="outline" className="h-4 text-[9px] font-black border-white/20 text-white/60 px-1.5 leading-none">{selectedContact?.department || "General"}</Badge>
                       </div>
                    </div>
                 </div>
               </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-8 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
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
                              "px-5 py-3 rounded-2xl text-sm font-medium shadow-xl",
                              m.is_mine 
                                ? "bg-primary text-white rounded-tr-sm" 
                                : "bg-white/10 backdrop-blur-sm border border-white/5 text-white rounded-tl-sm"
                            )}>
                               {m.message}
                            </div>
                            <span className="text-[9px] font-bold text-white/30 px-2">
                               {m.is_mine && <Check className="inline-block w-2.5 h-2.5 mr-1 text-primary" />}
                               {formatTime(m.created_at)}
                            </span>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="flex flex-col h-full items-center justify-center space-y-4 opacity-40">
                        <MessageSquare className="h-10 w-10" />
                        <p className="font-bold text-xs uppercase tracking-widest">No conversation history</p>
                     </div>
                   )}
                   <div ref={messagesEndRef} />
                 </>
               ) : (
                 <div className="flex flex-col h-full items-center justify-center space-y-4 opacity-30">
                    <MessageSquare className="h-16 w-16" />
                    <p className="font-black uppercase tracking-[0.2em] text-sm">Select a member to start</p>
                 </div>
               )}
            </CardContent>

            {/* Input Bar */}
            <div className="p-6 px-10 border-t border-white/10 bg-white/5 backdrop-blur-xl">
               <div className="relative flex items-center gap-4 bg-zinc-900 border border-white/10 ring-1 ring-white/5 rounded-2xl p-2 px-4 shadow-2xl transition-all focus-within:ring-primary/50 focus-within:border-primary/50">
                 <Input 
                   className="bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-white/20 text-sm font-bold h-10 flex-1" 
                   placeholder={selectedContact ? `Write to ${selectedContact.name}...` : 'Select a contact'} 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                   disabled={!selectedContact || sending}
                 />
                 <Button 
                   className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/40 group transition-all"
                   onClick={handleSendMessage}
                   disabled={!message.trim() || !selectedContact || sending}
                 >
                   {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                 </Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
