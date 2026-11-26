"use client"

import { useCallback, useEffect, useState } from "react"
import jsPDF from "jspdf"
import { EmployeeLayout } from "@/components/employee-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/apiClient"
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Download,
  FileCheck,
  Loader2,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

interface SkillRecord {
  id: string | number
  skill_name: string
  certification_name?: string | null
  issuing_authority?: string | null
  expiry_date?: string | null
  created_at?: string
}

export default function EmployeeSkillsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<SkillRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    skill_name: "",
    certification_name: "",
    issuing_authority: "",
    expiry_date: "",
  })

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient("/api/hr/skills")
      setRecords(Array.isArray(res?.skills) ? res.skills : [])
    } catch (err: any) {
      toast.error(err?.message || "Failed to load skills and certifications")
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const handleDownloadPassport = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Employee Skill Passport & Certifications", 14, 20)
    doc.setFontSize(10)
    doc.text(`Employee: ${user?.name || "Employee"}`, 14, 30)
    doc.text(`Role: ${user?.position || user?.role || "Staff"}`, 14, 36)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42)

    let y = 54
    if (records.length === 0) {
      doc.text("No recorded skills or certifications yet.", 14, y)
    } else {
      records.forEach((rec, idx) => {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.setFontSize(11)
        doc.text(`${idx + 1}. ${rec.skill_name}`, 14, y)
        y += 6
        doc.setFontSize(9)
        const details = [
          rec.certification_name ? `Certification: ${rec.certification_name}` : null,
          rec.issuing_authority ? `Authority: ${rec.issuing_authority}` : null,
          rec.expiry_date ? `Expires: ${new Date(rec.expiry_date).toLocaleDateString()}` : null,
        ]
          .filter(Boolean)
          .join(" | ")
        if (details) {
          doc.text(details, 18, y)
          y += 6
        }
        y += 2
      })
    }
    doc.save(`skill-passport-${(user?.name || "employee").toLowerCase().replace(/\s+/g, "-")}.pdf`)
    toast.success("Skill Passport PDF downloaded")
  }

  const handleSubmitCert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.skill_name.trim()) {
      toast.error("Please enter a skill name")
      return
    }
    setSubmitting(true)
    try {
      await apiClient("/api/hr/skills", {
        method: "POST",
        body: JSON.stringify({
          skill_name: form.skill_name.trim(),
          certification_name: form.certification_name.trim() || null,
          issuing_authority: form.issuing_authority.trim() || null,
          expiry_date: form.expiry_date || null,
        }),
      })
      toast.success("Skill & certification submitted")
      setForm({ skill_name: "", certification_name: "", issuing_authority: "", expiry_date: "" })
      setDialogOpen(false)
      await fetchSkills()
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit certification")
    } finally {
      setSubmitting(false)
    }
  }

  const certRecords = records.filter((r) => r.certification_name)

  return (
    <EmployeeLayout>
      <div className="space-y-6">
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPassport}
              className="gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Download Skill Passport
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              Add Skill / Cert
            </Button>
          </div>
        </div>

        <Card className="border-border/80 shadow-xs bg-gradient-to-r from-card via-amber-500/5 to-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-orange-500/20 shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "E"}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h2 className="text-lg font-extrabold text-foreground">{user?.name || "Field Specialist"}</h2>
                <p className="text-xs text-muted-foreground font-medium">
                  {user?.position || "Staff"} • {user?.company_name || "Workspace"}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <strong>{records.length}</strong> Recorded Skills
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <strong>{certRecords.length}</strong> Certifications
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading skills &amp; certifications...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-500" />
                  Recorded Technical Skills
                </CardTitle>
                <CardDescription className="text-xs">
                  Synced with HR skill matrix records.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-3">
                {records.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No skills recorded yet.</p>
                ) : (
                  records.map((skill) => (
                    <div key={skill.id} className="p-3 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">{skill.skill_name}</span>
                      {skill.issuing_authority && (
                        <Badge variant="outline" className="text-[10px]">
                          {skill.issuing_authority}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  Accreditations &amp; Certifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Official credentials submitted for HR verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-3.5">
                {certRecords.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No certifications recorded yet.</p>
                ) : (
                  certRecords.map((cert) => (
                    <div key={cert.id} className="p-4 rounded-xl border border-border/70 bg-card space-y-1.5">
                      <h4 className="text-xs font-bold text-foreground">{cert.certification_name}</h4>
                      <p className="text-[11px] text-muted-foreground">{cert.issuing_authority || "Verified Issuer"}</p>
                      {cert.expiry_date && (
                        <p className="text-[11px] text-muted-foreground">
                          Valid until: <strong>{new Date(cert.expiry_date).toLocaleDateString()}</strong>
                        </p>
                      )}
                    </div>
                  ))
                )}

                <div className="p-4 rounded-xl border border-dashed border-border flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">Have a new certificate?</span>
                    <p className="text-[11px] text-muted-foreground">Submit for supervisor verification and HR recording.</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setDialogOpen(true)}>
                    Add Cert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Skill &amp; Certification</DialogTitle>
            <DialogDescription>
              Record a verified skill or safety certification in your HR profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCert} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="skill_name">Skill Name *</Label>
              <Input
                id="skill_name"
                value={form.skill_name}
                onChange={(e) => setForm((f) => ({ ...f, skill_name: e.target.value }))}
                placeholder="e.g. Fanuc 0i-MF CNC Operation"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certification_name">Certification Title</Label>
              <Input
                id="certification_name"
                value={form.certification_name}
                onChange={(e) => setForm((f) => ({ ...f, certification_name: e.target.value }))}
                placeholder="e.g. ISO 45001 Safety Clearance"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issuing_authority">Issuing Authority</Label>
              <Input
                id="issuing_authority"
                value={form.issuing_authority}
                onChange={(e) => setForm((f) => ({ ...f, issuing_authority: e.target.value }))}
                placeholder="e.g. National Safety Council"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  )
}
