"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, X, Minimize2, Maximize2, Mic, MicOff } from "lucide-react"

// Local minimal type for browser SpeechRecognition (optional)
type SpeechRecognition = any
import { apiClient } from "@/lib/apiClient"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

interface AIChatBotProps {
  isOpen: boolean
  onToggle: () => void
}

export function AIChatBot({ isOpen, onToggle }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your SmartERP AI assistant. I can help you with job management, employee questions, material requests, and more. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const initializeSpeechRecognition = () => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsRecording(false)
      }

      recognition.onerror = () => {
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      return recognition
    }
    return null
  }

  const toggleRecording = () => {
    if (!recognition) {
      const newRecognition = initializeSpeechRecognition()
      if (!newRecognition) {
        alert("Speech recognition is not supported in your browser")
        return
      }
      setRecognition(newRecognition)
    }

    if (isRecording) {
      recognition?.stop()
      setIsRecording(false)
    } else {
      recognition?.start()
      setIsRecording(true)
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Persist chat message to backend activities (best-effort). Backend will
    // store the details so other users/sessions can fetch recent activities.
    ;(async () => {
      try {
        await apiClient('/api/activities', { method: 'POST', body: JSON.stringify({ action: 'chat_message', details: userMessage.text }) })
      } catch (err) {
        // ignore
      }
    })()

    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: getAIResponse(userMessage.text),
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setIsLoading(false)
    }, 1500)
  }

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("job") || input.includes("project")) {
      return "I can help you with job management! You currently have 12 active projects. Would you like me to show you project status, create a new job, or help with job assignments?"
    }

    if (input.includes("employee") || input.includes("worker")) {
      return "For employee management, I can help you check attendance, view employee profiles, or manage work assignments. You have 24 total employees with 20 currently active."
    }

    if (input.includes("material") || input.includes("supply")) {
      return "I can assist with material requests and inventory. There are currently 5 pending material requests awaiting approval. Would you like to review them?"
    }

    if (input.includes("payroll") || input.includes("payment")) {
      return "For payroll inquiries, I can help you view payment summaries, overtime calculations, or generate payroll reports. The next payroll run is scheduled for Friday."
    }

    if (input.includes("report") || input.includes("analytics")) {
      return "I can generate various reports including financial summaries, project progress, employee performance, and material usage. What type of report would you like?"
    }

    if (input.includes("safety") || input.includes("incident")) {
      return "Safety is our priority! I can help you report incidents, check safety compliance, or schedule safety training. Is there a safety concern you'd like to address?"
    }

    if (input.includes("hello") || input.includes("hi")) {
      return "Hello! I'm here to help you manage your construction business more efficiently. What would you like assistance with today?"
    }

    return "I understand you're asking about construction management. I can help with jobs, employees, materials, payroll, reports, and safety. Could you be more specific about what you need assistance with?"
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <Card
        className={`w-80 ${isMinimized ? "h-16" : "h-[500px]"} shadow-2xl border-2 bg-background transform transition-all duration-500 ease-in-out ${
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-full opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <CardHeader className="p-3 border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <div className="p-1.5 bg-primary rounded-full">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              SmartERP AI Assistant
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-primary/10"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                onClick={onToggle}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4 max-h-[350px]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      {message.sender === "bot" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        {message.text}
                      </div>
                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">U</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <div className="p-4 border-t bg-muted/20">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder="Type your message or use voice..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="text-sm pr-12 border-2 focus:border-primary"
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                      isRecording ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-primary"
                    }`}
                    onClick={toggleRecording}
                    disabled={isLoading}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button size="sm" onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} className="px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isRecording && (
                <div className="text-xs text-red-500 mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Recording... Speak now
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
