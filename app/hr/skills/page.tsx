"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import { Award, ShieldCheck, CheckCircle2, Search, AlertCircle, Plus } from "lucide-react"

export default function HRSkillsPage() {
  const { toast } = useToast()
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const res = await apiClient("/api/hr/skills")
      if (Array.isArray(res?.skills)) setSkills(res.skills)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  const filtered = skills.filter(s => 
    s.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.skill_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <HRLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Skill & Certification Engine</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage employee trades, certifications, & equipment authorizations for job matching.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by employee name or skill (e.g. HVAC, Electrical)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        {/* Skills & Certifications Table */}
        <Card className="border shadow-xs">
          <CardContent className="p-0 overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
                <p className="text-sm font-bold text-foreground">No verified certifications found</p>
                <p className="text-xs mt-0.5">Certifications and trade skills assigned to employees will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Skill / Trade</th>
                    <th className="p-4">Certification</th>
                    <th className="p-4">Issuing Body</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">HR Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{s.employee_name || s.employee_email}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-primary/10 text-primary font-bold">{s.skill_name}</Badge>
                      </td>
                      <td className="p-4 font-semibold">{s.certification_name || "Certified Technician"}</td>
                      <td className="p-4 text-muted-foreground">{s.issuing_authority || "National Vocational Board"}</td>
                      <td className="p-4 text-muted-foreground">{s.expiry_date ? new Date(s.expiry_date).toLocaleDateString("en-IN") : "Permanent"}</td>
                      <td className="p-4">
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> VERIFIED
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  )
}
