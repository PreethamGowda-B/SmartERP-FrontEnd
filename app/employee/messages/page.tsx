"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Search, Bot } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"

const messages = [
  {
    id: 1,
    sender: "John Smith",
    role: "Owner",
    message: "Great work on the downtown project today!",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    sender: "AI Assistant",
    role: "Bot",
    message: "Your timesheet for today has been automatically submitted.",
    time: "4 hours ago",
    unread: false,
  },
  {
    id: 3,
    sender: "Mike Johnson",
    role: "Foreman",
    message: "Can you bring extra safety equipment tomorrow?",
    time: "1 day ago",
    unread: false,
  },
]

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${message.unread ? "border-primary" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender === "AI Assistant" ? <Bot className="h-4 w-4" /> : message.sender.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{message.sender}</p>
                        <Badge variant="secondary" className="text-xs">
                          {message.role}
                        </Badge>
                        {message.unread && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{message.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                John Smith - Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-xs">
                    <p className="text-sm">
                      Hi John, the downtown project is going well. We should finish on schedule.
                    </p>
                    <p className="text-xs opacity-70 mt-1">3 hours ago</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2 max-w-xs">
                    <p className="text-sm">Great work on the downtown project today!</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[120px]"
                />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </div>
    </EmployeeLayout>
  )
}
