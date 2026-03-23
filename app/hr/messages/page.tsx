"use client"

import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function HRMessagesPage() {
  return (
    <HRLayout>
      <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-160px)] flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">Direct communication with your team.</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Contacts List */}
          <Card className="md:col-span-1 border-none shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <Users className="h-4 w-4" />
                 Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="p-4 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                       E
                     </div>
                     <div>
                       <p className="font-medium text-sm">Employee {i}</p>
                       <p className="text-xs text-muted-foreground truncate italic">Last message preview...</p>
                     </div>
                   </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="md:col-span-2 border-none shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="border-b bg-muted/30 p-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                    E1
                  </div>
                  <h3 className="font-bold text-sm">Employee 1</h3>
               </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 overflow-y-auto space-y-4">
               <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none text-sm max-w-[80%]">
                     Hello HR, I have a question regarding my payroll for this month.
                  </div>
               </div>
               <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-none text-sm max-w-[80%] shadow-md">
                     Hi! Certainly, how can I help?
                  </div>
               </div>
            </CardContent>
            <div className="p-4 border-t bg-muted/30">
               <div className="flex gap-2">
                 <Input className="rounded-xl border-none shadow-inner" placeholder="Type your message..." />
                 <Button className="rounded-xl shadow-lg">
                   <Send className="h-4 w-4" />
                 </Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </HRLayout>
  )
}
