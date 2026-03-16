"use client"

import { motion } from "framer-motion"
import { ShieldAlert, Mail, ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PremiumBackground } from "@/components/premium-background"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 bg-slate-50">
      <PremiumBackground />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-100 overflow-hidden">
          {/* Header with Icon */}
          <div className="bg-red-50 p-8 flex flex-col items-center text-center border-b border-red-100">
            <div className="p-4 bg-red-100 rounded-full mb-6">
              <ShieldAlert className="h-12 w-12 text-red-600 animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Account Suspended
            </h1>
            <div className="h-1 w-20 bg-red-500 rounded-full mx-auto" />
          </div>

          <div className="p-8 md:p-12 space-y-8">
            <div className="space-y-4 text-center">
              <p className="text-slate-600 text-lg leading-relaxed">
                Your account is <span className="font-bold text-red-600 uppercase tracking-wide">suspended/disabled</span> because of some unusual activities found in your account.
              </p>
              <p className="text-slate-500 font-medium">
                To protect the security of our platform and your data, access has been temporarily restricted.
              </p>
            </div>

            {/* Contact Support Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Customer Care</h3>
                  <a 
                    href="mailto:prozyncinnovations@gmail.com" 
                    className="text-primary font-semibold hover:underline transition-all"
                  >
                    prozyncinnovations@gmail.com
                  </a>
                </div>
              </div>
              <p className="text-xs text-slate-400 italic">
                Our support team typically responds within 2-4 business hours.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link href="/auth/login" className="flex-1">
                <Button variant="outline" className="w-full group hover:bg-slate-50 h-12 rounded-xl border-2">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Login
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.href = "mailto:prozyncinnovations@gmail.com"}
                className="flex-1 bg-red-600 hover:bg-red-700 h-12 rounded-xl shadow-lg shadow-red-200"
              >
                Contact Support Now
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                SmartERP Security Protocol
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
