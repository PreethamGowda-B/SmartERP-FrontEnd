"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  Users, 
  Building2, 
  PieChart as PieChartIcon, 
  Calendar,
  Download,
  Target
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Button } from "@/components/ui/button"

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient("/api/admin/dashboard")
        setData(res)
      } catch (err) {
        logger.error("Failed to fetch analytics data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Analytics</h1>
            <p className="text-slate-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-80">Deep insights into platform performance</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-10 rounded-xl border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest gap-2">
               <Calendar className="h-4 w-4" /> Last 30 Days
             </Button>
             <Button className="h-10 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest gap-2">
               <Download className="h-4 w-4" /> Export Data
             </Button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Company Growth */}
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                     <Building2 className="h-5 w-5 text-blue-500" /> Company Adoption
                   </h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">New company registrations</p>
                </div>
              </div>
              <div className="h-[300px]">
                {loading ? (
                   <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.charts.companyGrowth}>
                      <defs>
                        <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Area type="stepAfter" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCompanies)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
           </div>

           {/* User Growth */}
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                     <Users className="h-5 w-5 text-indigo-500" /> User Expansion
                   </h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Platform user acquisition</p>
                </div>
              </div>
              <div className="h-[300px]">
                {loading ? (
                   <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.charts.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
           </div>

           {/* Subscription Distribution */}
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div className="flex-1">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-6">
                      <PieChartIcon className="h-5 w-5 text-emerald-500" /> Revenue Distribution
                    </h2>
                    <div className="space-y-4">
                       {data?.charts.subscriptionDistribution.map((entry: any, index: number) => (
                         <div key={entry.name} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                               <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{entry.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(entry.value / (data.stats.totalCompanies || 1)) * 100}%` }}
                                    className="h-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                               </div>
                               <span className="text-sm font-black text-slate-900 w-8 text-right">{entry.value}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="w-full md:w-[300px] h-[300px] shrink-0">
                    {!loading && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.charts.subscriptionDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {data?.charts.subscriptionDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-6">
              <Target className="h-16 w-16 text-white opacity-20 animate-pulse" />
              <div className="space-y-2 text-white">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Enterprise Intelligence</h3>
                <p className="text-slate-400 font-medium italic">Aggregating cross-tenant data points for advanced heuristic analysis.</p>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  )
}
