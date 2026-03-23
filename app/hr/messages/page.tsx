"use client"

import { useState, useEffect, useMemo } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, Users, Send, Search, User, Check, Clock, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/apiClient"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Employee {
  id: string
  name: string
  email: string
  position?: string
  department?: string
  role?: string
}

export default function HRMessagesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const data = await apiClient("/api/employees")
        if (Array.isArray(data)) {
          setEmployees(data)
          if (data.length > 0) setSelectedContact(data[0])
        }
      } catch (err) {
        console.error("Failed to fetch employees:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [employees, searchTerm])

  const handleSendMessage = () => {
    if (!message.trim()) return
    // In a real app, this would hit /api/messages/send
    console.log(`Sending message to ${selectedContact?.email}: ${message}`)
    setMessage("")
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
          <div className="flex items-center gap-3 bg-card p-1 rounded-2xl border shadow-sm self-start md:self-center">
             <Button variant="ghost" size="sm" className="rounded-xl font-bold h-9 bg-primary text-primary-foreground">All Channels</Button>
             <Button variant="ghost" size="sm" className="rounded-xl font-bold h-9 opacity-50">Direct</Button>
             <Button variant="ghost" size="sm" className="rounded-xl font-bold h-9 opacity-50">Group</Button>
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
               {loading ? (
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
                        <div className="flex justify-between items-start mb-0.5">
                           <p className="font-bold text-sm tracking-tight truncate">{e.name}</p>
                           <span className="text-[9px] text-muted-foreground font-bold font-mono">12:30 PM</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70 mb-1">{e.position || "Staff"}</p>
                        <p className="text-xs text-muted-foreground/60 truncate italic leading-none">Last message sent via ERP...</p>
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
                 <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all"><Clock className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all"><Filter className="h-4 w-4" /></Button>
                 </div>
               </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-white/10">
               {selectedContact ? (
                 <>
                   <div className="flex justify-center mb-6">
                      <span className="bg-white/5 px-4 py-1 rounded-full text-[10px] uppercase font-bold text-white/40 tracking-widest border border-white/5">Yesterday</span>
                   </div>
                   
                   <div className="flex justify-start group">
                      <div className="flex flex-col gap-1 max-w-[75%]">
                         <div className="bg-white/10 backdrop-blur-sm border border-white/5 px-5 py-3.5 rounded-3xl rounded-tl-sm text-sm font-medium shadow-xl">
                            Hello HR! My payroll sheet seems to show a discrepancy in overtime for last week. Could you check?
                         </div>
                         <span className="text-[9px] font-bold text-white/30 ml-2 mt-1">11:45 AM</span>
                      </div>
                   </div>

                   <div className="flex justify-end">
                      <div className="flex flex-col gap-1 max-w-[75%] items-end">
                         <div className="bg-primary px-5 py-3.5 rounded-3xl rounded-tr-sm text-sm font-bold shadow-2xl shadow-primary/20 text-white tracking-tight">
                            Hi {selectedContact.name?.split(' ')[0]}! Checking this right now. Please allow me 15 minutes to sync with the attendance server.
                         </div>
                         <div className="flex items-center gap-1.5 mt-1 mr-2 font-bold text-white/30 text-[9px]">
                            <span>12:12 PM</span>
                            <Check className="w-3 h-3 text-primary" />
                         </div>
                      </div>
                   </div>

                   <div className="flex justify-start">
                      <div className="flex flex-col gap-1 max-w-[75%]">
                         <div className="bg-white/10 backdrop-blur-sm border border-white/5 px-5 py-3.5 rounded-3xl rounded-tl-sm text-sm font-medium shadow-xl italic opacity-80">
                            Thinking...
                         </div>
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col h-full items-center justify-center space-y-4 opacity-30">
                    <MessageSquare className="h-16 w-16" />
                    <p className="font-black uppercase tracking-[0.2em] text-sm">Open channel to start</p>
                 </div>
               )}
            </CardContent>

            {/* Input Bar */}
            <div className="p-6 px-10 border-t border-white/10 bg-white/5 backdrop-blur-xl">
               <div className="relative flex items-center gap-4 bg-zinc-900 border border-white/10 ring-1 ring-white/5 rounded-2xl p-2 px-4 shadow-2xl transition-all focus-within:ring-primary/50 focus-within:border-primary/50">
                 <Input 
                   className="bg-transparent border-none shadow-none focus-visible:ring-0 placeholder:text-white/20 text-sm font-bold h-10 flex-1" 
                   placeholder={`Write to ${selectedContact?.name || 'team'}...`} 
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                 />
                 <Button 
                   className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/40 group transition-all"
                   onClick={handleSendMessage}
                   disabled={!message.trim() || !selectedContact}
                 >
                   <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </Button>
               </div>
               <div className="flex gap-4 mt-3 ml-2">
                  <span className="text-[9px] font-black uppercase text-white/20 tracking-widest cursor-pointer hover:text-white transition-colors">Attach Logs</span>
                  <span className="text-[9px] font-black uppercase text-white/20 tracking-widest cursor-pointer hover:text-white transition-colors">Quick Reply</span>
                  <span className="text-[9px] font-black uppercase text-white/20 tracking-widest cursor-pointer hover:text-white transition-colors">Urgent Signal</span>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
