"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { EmployeeSidebar } from "@/components/employee-sidebar"
import { EmployeeTopNav } from "@/components/employee-top-nav"
import { AIChatBot } from "@/components/ai-chat-bot"
import { NavLoadingProvider, useNavLoading } from "@/components/nav-loading-context"
import PageTransition from "./page-transition"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import DotsLoader from "@/components/dots-loader"

interface EmployeeLayoutProps {
  children: React.ReactNode
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isChatBotOpen, setIsChatBotOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "employee")) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          style={{ width: 160, height: 100 }}
          className="flex items-center justify-center bg-white rounded-lg shadow-md"
        >
          <DotsLoader />
        </div>
      </div>
    )
  }

  if (!user || user.role !== "employee") {
    return null
  }

  return (
    <NavLoadingProvider>
      <div className="min-h-screen bg-background">
        <EmployeeSidebar />
        <div className="lg:pl-64">
          <EmployeeTopNav />
          <MainContent>{children}</MainContent>
        </div>

        <Button
          className={`fixed bottom-4 right-4 z-40 rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 ${
            isChatBotOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
          }`}
          onClick={() => setIsChatBotOpen(true)}
        >
          <Bot className="h-5 w-5" />
        </Button>

        <AIChatBot isOpen={isChatBotOpen} onToggle={() => setIsChatBotOpen(!isChatBotOpen)} />
        <PageTransition />
      </div>
    </NavLoadingProvider>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { loadingId } = useNavLoading()
  return (
    <main
      className={`p-4 lg:p-8 transition-all duration-400 ease-in-out ${loadingId ? "opacity-30 translate-y-2" : "opacity-100 translate-y-0"}`}
    >
      {children}
    </main>
  )
}
