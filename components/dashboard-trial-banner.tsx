"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, CalendarDays, AlertTriangle, ArrowRight, X } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function DashboardTrialBanner() {
  const [data, setData] = useState<{
    is_trial: boolean
    days_remaining: number
    banner_message: string
  } | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    async function fetchBanner() {
      try {
        const res = await apiClient("/api/subscription/trial-status")
        if (res.is_trial && res.days_remaining > 0) {
          setData(res)
        }
      } catch (err) {
        console.error("Failed to fetch trial banner status", err)
      }
    }
    fetchBanner()
  }, [])

  if (!data || !isVisible) return null

  const days = data.days_remaining

  // Determine urgency styling
  let bgColor = "bg-indigo-600 dark:bg-indigo-900"
  let icon = <Sparkles className="h-5 w-5 mr-2" />
  
  if (days <= 3) {
    bgColor = "bg-rose-600 dark:bg-rose-900/90 animate-pulse"
    icon = <CalendarDays className="h-5 w-5 mr-2" />
  } else if (days <= 7) {
    bgColor = "bg-amber-600 dark:bg-amber-800"
    icon = <AlertTriangle className="h-5 w-5 mr-2" /> // AlertTriangle icon
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative overflow-hidden shadow-lg mb-6 rounded-xl border border-white/10 ${bgColor} text-white`}
    >
      <div className="absolute inset-0 bg-[url('/grain.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 px-6 md:px-8">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="p-2 bg-white/10 rounded-full backdrop-blur-md hidden md:block">
             {days <= 3 ? <CalendarDays className="h-5 w-5 text-rose-100" /> : <Sparkles className="h-5 w-5 text-indigo-100" />}
          </div>
          <div>
            <h3 className="font-semibold text-[15px] md:text-base leading-tight drop-shadow-sm">
                Pro Trial Active — {days} {days === 1 ? 'day' : 'days'} remaining
            </h3>
            <p className="text-sm text-white/80 mt-0.5 leading-snug">
                {days <= 3 
                    ? "Your trial ends very soon! Upgrade now to avoid losing access to premium features." 
                    : "Enjoy unlimited employees, locations, and AI until your trial ends."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Button 
            asChild
            variant="secondary" 
            size="sm"
            className="w-full sm:w-auto font-medium text-[13px] bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm transition-all whitespace-nowrap"
          >
            <Link href="/owner/billing">
                Upgrade Plan
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <button 
             onClick={() => setIsVisible(false)}
             className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white flex-shrink-0"
             aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
