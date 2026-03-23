"use client"

import { useEffect, useState } from "react"
import { HRLayout } from "@/components/hr-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { Phone, Mail, MessageCircle, ArrowRight, ShieldCheck, Zap, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HRSupportPage() {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(true) // HR typically has access if the company is Pro

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await apiClient("/api/subscription/status")
        const planName = res.plan?.name?.toLowerCase() || "free"
        
        if (planName === "pro" || planName.includes("pro")) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
        }
      } catch (err) {
        logger.error("Failed to load subscription status", err)
      } finally {
        setLoading(false)
      }
    }
    checkAccess()
  }, [])

  if (loading) {
    return (
      <HRLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </HRLayout>
    )
  }

  // Support Card Data
  const supportCards = [
    {
      id: "call",
      title: "Priority Call",
      description: "Get direct technical assistance for SmartERP setup or feature troubleshooting.",
      icon: Phone,
      actionLabel: "Contact via Call",
      href: "tel:9535134351",
      color: "from-blue-500/10 to-transparent",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonClass: "bg-blue-600 hover:bg-blue-700 text-white"
    },
    {
      id: "email",
      title: "Email Support",
      description: "Send detailed inquiries or document issues. Our response time is < 4 hours.",
      icon: Mail,
      actionLabel: "Send Email",
      href: "mailto:thepreethu01@gmail.com?subject=SmartERP%20HR%20Support%20Request",
      color: "from-indigo-500/10 to-transparent",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white"
    },
    {
      id: "whatsapp",
      title: "WhatsApp Chat",
      description: "Fastest way to get answers for quick questions or instant mobile support.",
      icon: MessageCircle,
      actionLabel: "Open WhatsApp",
      href: "https://wa.me/918310982308?text=Hello%20I%20am%20HR%20from%20SmartERP%20needs%20support",
      color: "from-emerald-500/10 to-transparent",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white"
    }
  ]

  return (
    <HRLayout>
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        
        {/* Modern Header Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 px-8 py-16 md:px-16 md:py-20 shadow-2xl border border-white/5 text-white">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/0 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-500/20 to-emerald-500/0 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold mb-8 text-primary uppercase tracking-widest">
              <LifeBuoy className="w-4 h-4" />
              Help Center
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              How can we <span className="text-primary italic">help</span> you?
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl font-medium">
              As an HR Administrator, you have access to our priority support channels. Choose your preferred way to connect.
            </p>
          </div>
        </div>

        {!hasAccess && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-6 rounded-[1.5rem] flex items-center gap-4">
             <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
             </div>
             <div>
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Standard Support Active</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 opacity-90">Priority support is a Pro feature. Your company is currently on the Free plan, but you can still reach out via email.</p>
             </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {supportCards.map((card) => (
            <div 
              key={card.id}
              className="group relative flex flex-col bg-card hover:bg-accent/40 border border-border/80 rounded-[2rem] p-10 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="mb-8 inline-flex p-5 rounded-2xl bg-muted border border-border group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                  <card.icon className={`w-10 h-10 ${card.iconColor}`} />
                </div>
                
                <h3 className="text-2xl font-black mb-4 tracking-tight">
                  {card.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-10 flex-1 text-sm font-medium">
                  {card.description}
                </p>
                
                <a 
                  href={card.href}
                  target={card.id === "whatsapp" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg group-hover:shadow-xl group-active:scale-95 ${card.buttonClass}`}
                >
                  {card.actionLabel}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center pt-8">
          <div className="inline-block px-6 py-3 bg-muted rounded-full text-sm font-semibold text-muted-foreground">
             Our team is available Mon-Fri, 9:00 AM – 6:00 PM (IST)
          </div>
        </div>

      </div>
    </HRLayout>
  )
}
