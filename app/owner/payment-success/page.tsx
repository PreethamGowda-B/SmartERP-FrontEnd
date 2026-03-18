"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, ArrowRight, ShieldCheck, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OwnerLayout } from "@/components/owner-layout"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { useAuth } from "@/contexts/auth-context"

export default function PaymentSuccessPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)

  useEffect(() => {
    // Refresh subscription status to confirm upgrade
    async function verifyUpgrade() {
      try {
        const res = await apiClient("/api/subscription/status")
        setCurrentPlan(res.plan?.name || "Basic")
        logger.log("[PAYMENT] Subscription verified on success page:", res.plan?.name)
      } catch (err) {
        logger.error("[PAYMENT] Could not verify upgrade on success page", err)
      } finally {
        setLoading(false)
      }
    }
    
    // Tiny delay to allow background processes (webhook) to finish
    const timer = setTimeout(verifyUpgrade, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <OwnerLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] container max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full"
        >
          <Card className="text-center shadow-2xl border-indigo-100 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
            
            <CardHeader className="pt-10">
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                  className="bg-green-100 p-4 rounded-full"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-600" />
                </motion.div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">Payment Successful! 🎉</CardTitle>
              <Badge variant="secondary" className="mt-2 bg-green-50 text-green-700 border-green-200">
                {loading ? "Confirming activation..." : `Active Plan: ${currentPlan}`}
              </Badge>
            </CardHeader>

            <CardContent className="px-8 pb-10 space-y-6">
              <div className="space-y-4 text-gray-600">
                <p className="text-lg leading-relaxed">
                  Thank you for your payment! Your subscription has been successfully upgraded to the 
                  <span className="font-bold text-indigo-600"> Basic Plan</span>.
                </p>
                <p className="text-sm">
                  You now have access to premium features like **Payroll Generation**, **Location Tracking**, 
                  and increased limits for your employees and inventory.
                </p>
              </div>

              <div className="bg-blue-50/50 rounded-xl p-4 flex items-start gap-4 text-left border border-blue-100">
                <ShieldCheck className="w-6 h-6 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Activation Status</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your features are unlocked immediately. If you don't see them yet, simply refresh your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-gray-50/50 border-t p-8 flex flex-col sm:flex-row gap-4">
              <Button asChild className="w-full sm:w-1/2 h-12 text-md font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md">
                <Link href="/owner">
                  Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-1/2 h-12 text-md font-medium border-gray-200 hover:bg-white hover:text-indigo-600 transition-colors">
                <Link href="/owner/settings">
                  View Billing Details
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Mail className="w-4 h-4" />
              <span>Need help? Contact us at </span>
              <a href="mailto:support@prozync.in" className="text-indigo-600 font-semibold hover:underline">support@prozync.in</a>
            </div>
            
            <Link href="/owner" className="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to SmartERP
            </Link>
          </div>
        </motion.div>
      </div>
    </OwnerLayout>
  )
}
