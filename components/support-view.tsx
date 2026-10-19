"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { triggerFeatureLock } from "@/components/locked-feature-prompt"
import { Phone, Mail, MessageCircle, ArrowRight, ShieldCheck, Zap } from "lucide-react"

export function SupportView() {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await apiClient("/api/subscription/status")
        if (res.plan?.features?.priority_support === true) {
          setHasAccess(true)
        } else {
          triggerFeatureLock({
            feature: "Priority Support",
            current_plan: res.plan?.name || "Starter",
            message: "Priority support is not enabled for the current company plan. The company owner can review available plans."
          })
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
      <div className="flex h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-center px-4">
        <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Feature Locked</h3>
        <p className="text-muted-foreground text-xs max-w-sm mb-6">
          Priority support is not enabled for the current company plan.
        </p>
      </div>
    )
  }

  const supportCards = [
    {
      id: "call",
      title: "Book a Call",
      description: "Speak directly with our support team and get help with your SmartERP setup or issues.",
      icon: Phone,
      actionLabel: "Book a Call",
      href: "tel:9535134351",
      color: "from-blue-500/10 to-transparent",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white"
    },
    {
      id: "email",
      title: "Email Support",
      description: "Send us a message and our team will respond as soon as possible.",
      icon: Mail,
      actionLabel: "Mail Us",
      href: "mailto:prozyncinnovations@gmail.com?subject=SmartERP%20Support%20Request",
      color: "from-indigo-500/10 to-transparent",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700 text-white"
    },
    {
      id: "whatsapp",
      title: "WhatsApp Support",
      description: "Chat with our support team instantly on WhatsApp for faster assistance.",
      icon: MessageCircle,
      actionLabel: "Open WhatsApp",
      href: "https://wa.me/918310982308?text=Hello%20I%20need%20support%20for%20SmartERP",
      color: "from-emerald-500/10 to-transparent",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-50 via-white to-indigo-50/50 p-6 md:p-10 border border-border shadow-xs text-slate-900">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-linear-to-br from-indigo-200/20 to-purple-200/0 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-linear-to-tr from-blue-200/20 to-emerald-200/0 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold mb-3 text-indigo-700">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Priority Support
          </div>
          
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-slate-900">
            SmartERP Dedicated Support
          </h2>
          
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Your subscription's priority support access is active. Choose a contact method below.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {supportCards.map((card) => (
          <div 
            key={card.id}
            className="group relative flex flex-col bg-card hover:bg-accent/50 border border-border rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-linear-to-b ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="mb-5 inline-flex p-3 rounded-xl bg-accent border border-border/50 group-hover:scale-110 transition-transform duration-300 shadow-xs self-start">
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              
              <h3 className="text-xl font-bold mb-2 tracking-tight">
                {card.title}
              </h3>
              
              <p className="text-muted-foreground text-xs leading-relaxed mb-6 flex-1">
                {card.description}
              </p>
              
              <a 
                href={card.href}
                target={card.id === "whatsapp" ? "_blank" : "_top"}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (card.id === "email") {
                    e.preventDefault()
                    window.location.href = card.href
                  }
                }}
                className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 shadow-xs group-hover:shadow-md ${card.buttonColor}`}
              >
                {card.actionLabel}
                <ArrowRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Extra info */}
      <div className="flex justify-center pt-4">
        <p className="text-xs text-muted-foreground text-center">
          Our support hours are Monday to Friday, 9:00 AM – 6:00 PM (IST).
        </p>
      </div>
    </div>
  )
}
