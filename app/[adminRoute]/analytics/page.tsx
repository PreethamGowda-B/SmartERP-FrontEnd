"use client"

import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  LineChart, 
  PieChart,
  Target
} from "lucide-react"

export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium opacity-60">Deep-dive into platform growth and user distribution</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="p-8 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md h-96 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-accent/10 border border-accent/20">
                 <LineChart className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white">Company Growth</h3>
              <p className="text-muted-foreground max-w-xs text-sm italic">
                Platform-wide registration trends and organic growth tracking visualization is being optimized.
              </p>
           </div>

           <div className="p-8 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md h-96 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
                 <PieChart className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Subscription Distribution</h3>
              <p className="text-muted-foreground max-w-xs text-sm italic">
                Revenue split and recurring billing demographics visualization coming in next update.
              </p>
           </div>

           <div className="md:col-span-2 p-12 rounded-[2rem] border border-white/5 bg-gradient-to-br from-accent/5 to-transparent backdrop-blur-md flex flex-col items-center justify-center text-center space-y-6">
              <Target className="h-16 w-16 text-accent opacity-20 animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Enterprise Intelligence</h3>
                <p className="text-muted-foreground font-medium italic">Aggregating cross-tenant data points for advanced heuristic analysis.</p>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  )
}
