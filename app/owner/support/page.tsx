"use client"

import { useEffect, useState } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { triggerFeatureLock } from "@/components/locked-feature-prompt"
import { Phone, Mail, MessageCircle, ArrowRight, ShieldCheck, Zap } from "lucide-react"

export default function SupportPage() {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await apiClient("/api/subscription/status")
        const planName = res.plan?.name?.toLowerCase() || "free"
        
        if (planName === "pro" || planName.includes("pro")) {
          setHasAccess(true)
        } else {
          // Trigger the lock modal
          triggerFeatureLock({
            feature: "Priority Support",
            current_plan: res.plan?.name || "FREE",
            message: "Priority Support is a premium feature reserved for our Pro plan users."
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
      <OwnerLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </OwnerLayout>
    )
  }

  if (!hasAccess) {
    return (
      <OwnerLayout>
        {/* If the modal gets closed, they just see a generic lock screen */}
        <div className="flex flex-col h-[70vh] items-center justify-center text-center px-4">
          <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Feature Locked</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            You must upgrade to the Pro plan to access the priority support center.
          </p>
        </div>
      </OwnerLayout>
    )
  }

  // Support Card Data
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
    <OwnerLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 px-8 py-16 md:px-16 md:py-20 shadow-2xl dark:border dark:border-white/10 text-white">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/0 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-500/20 to-emerald-500/0 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-6 text-indigo-200">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              Pro Plan Exclusive
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              SmartERP Priority Support
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-300 leading-relaxed max-w-2xl font-light">
              Pro plan users get direct access to priority support. Choose a contact method below and our team will assist you quickly.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {supportCards.map((card) => (
            <div 
              key={card.id}
              className="group relative flex flex-col bg-card hover:bg-accent/50 border border-border rounded-[1.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="mb-6 inline-flex p-4 rounded-xl bg-accent border border-border/50 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <card.icon className={`w-8 h-8 ${card.iconColor}`} />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 tracking-tight">
                  {card.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-8 flex-1">
                  {card.description}
                </p>
                
                <a 
                  href={card.href}
                  target={card.id === "whatsapp" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-medium transition-all duration-300 shadow-sm group-hover:shadow-md ${card.buttonColor}`}
                >
                  {card.actionLabel}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Extra info */}
        <div className="flex justify-center pt-8">
          <p className="text-sm text-muted-foreground text-center">
            Our support hours are Monday to Friday, 9:00 AM – 6:00 PM (IST).
          </p>
        </div>

      </div>
    </OwnerLayout>
  )
}
