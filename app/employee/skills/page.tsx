"use client"

import { useState } from "react"
import { EmployeeLayout } from "@/components/employee-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  FileCheck,
  Flame,
  Zap,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillItem {
  id: string
  name: string
  category: "Machine Operation" | "Electrical & Diagnostics" | "Safety & Quality"
  level: "Expert" | "Proficient" | "Intermediate" | "Basic"
  percentage: number
  verifiedBy: string
}

interface Certification {
  id: string
  title: string
  issuingBody: string
  validUntil: string
  status: "active" | "expiring_soon" | "expired"
  certNumber: string
}

const DEFAULT_SKILLS: SkillItem[] = [
  { id: "sk-1", name: "Fanuc 0i-MF 3-Axis & 5-Axis CNC Milling", category: "Machine Operation", level: "Expert", percentage: 95, verifiedBy: "SmartERP Certified" },
  { id: "sk-2", name: "Siemens 840D SL Controller Programming & Tuning", category: "Machine Operation", level: "Proficient", percentage: 85, verifiedBy: "Chief Technical Engineer" },
  { id: "sk-3", name: "Laser Interferometer Pitch Error & Backlash Compensation", category: "Electrical & Diagnostics", level: "Expert", percentage: 92, verifiedBy: "Quality Directorate" },
  { id: "sk-4", name: "Hydraulic Pack & Nitrogen Accumulator Servicing", category: "Electrical & Diagnostics", level: "Proficient", percentage: 80, verifiedBy: "Field Service Lead" },
  { id: "sk-5", name: "ISO 45001 Industrial Safety & LOTO Protocol", category: "Safety & Quality", level: "Expert", percentage: 100, verifiedBy: "Safety Compliance Officer" },
  { id: "sk-6", name: "Six Sigma Root-Cause Defect Analysis", category: "Safety & Quality", level: "Intermediate", percentage: 75, verifiedBy: "Operations Manager" },
]

const DEFAULT_CERTS: Certification[] = [
  { id: "c-1", title: "Certified CNC Field Service Specialist (Level 3)", issuingBody: "National Machine Tool Builders Institute", validUntil: "15 Oct 2027", status: "active", certNumber: "NMTB-98421" },
  { id: "c-2", title: "High Voltage Electrical Safety & Arc Flash Clearance", issuingBody: "Industrial Safety Standards Board", validUntil: "20 May 2028", status: "active", certNumber: "ISSB-77219" },
  { id: "c-3", title: "Precision Coordinate Metrology & Calibration", issuingBody: "Metrology Accreditation Council", validUntil: "10 Nov 2026", status: "expiring_soon", certNumber: "MAC-44102" },
]

export default function EmployeeSkillsPage() {
  const { user } = useAuth()
  const [skills] = useState<SkillItem[]>(DEFAULT_SKILLS)
  const [certs] = useState<Certification[]>(DEFAULT_CERTS)

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Award className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Skill Passport &amp; Certifications</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Verified technical proficiencies, machine clearances, and safety accreditation badges.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Digital Skill Passport PDF export generated.")}
            className="self-start sm:self-auto gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Download Skill Passport
          </Button>
        </div>

        {/* Top Profile Summary Card */}
        <Card className="border-border/80 shadow-xs bg-gradient-to-r from-card via-amber-500/5 to-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-orange-500/20 shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "E"}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h2 className="text-lg font-extrabold text-foreground">{user?.name || "Field Specialist"}</h2>
                  <Badge className="bg-amber-500 text-white text-[10px] font-bold self-center sm:self-auto">
                    LEVEL 3 SPECIALIST
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {user?.position || "Senior CNC Field Service Engineer"} • {user?.company_name || "Enterprise Operations"}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <strong>6</strong> Verified Skills
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <strong>3</strong> Active Certifications
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Top 5% Performance Score
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Technical Proficiencies */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-500" />
                  Technical Proficiencies &amp; Machine Operation
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  VERIFIED
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Audited hands-on capabilities across CNC machines, electrical diagnostic rigs, and safety compliance.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="space-y-1.5 p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{skill.name}</span>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                      {skill.level}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Progress value={skill.percentage} className="h-1.5 flex-1" />
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">{skill.percentage}%</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                    <span className="uppercase tracking-wider font-semibold">{skill.category}</span>
                    <span>Verified by: {skill.verifiedBy}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Certifications & Clearances */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  Accreditations &amp; Safety Clearances
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  ISO / OSHA
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Official regulatory and vendor credentials authorizing site operations.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-3.5">
              {certs.map((cert) => {
                const statusBadge =
                  cert.status === "active"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"

                return (
                  <div key={cert.id} className="p-4 rounded-xl border border-border/70 bg-card hover:shadow-xs transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-snug">{cert.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{cert.issuingBody}</p>
                      </div>
                      <Badge className={cn("text-[10px] uppercase font-bold", statusBadge)}>
                        {cert.status === "active" ? "Valid" : "Renew Soon"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      <span className="font-mono">ID: {cert.certNumber}</span>
                      <span>Valid until: <strong>{cert.validUntil}</strong></span>
                    </div>
                  </div>
                )
              })}

              <div className="p-4 rounded-xl border border-dashed border-border flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">Have a new certificate?</span>
                  <p className="text-[11px] text-muted-foreground">Submit for supervisor verification and HR recording.</p>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => alert("Upload certificate document modal.")}>
                  Upload Cert
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EmployeeLayout>
  )
}
