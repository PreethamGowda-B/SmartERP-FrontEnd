"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import { UserPlus, Star, Mail, Phone, Briefcase, FileText, CheckCircle2, Search, Plus } from "lucide-react"

export default function HRRecruitmentPage() {
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [designation, setDesignation] = useState("Field Technician")
  const [department, setDepartment] = useState("Operations")

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const res = await apiClient("/api/hr/recruitment")
      if (Array.isArray(res?.candidates)) setCandidates(res.candidates)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const handleAddCandidate = async () => {
    if (!name || !email) {
      toast({ title: "Required", description: "Name and email are required.", variant: "destructive" })
      return
    }
    try {
      await apiClient("/api/hr/recruitment", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, designation, department, stage: "sourced" })
      })
      toast({ title: "Candidate Added", description: `${name} added to recruitment pipeline.` })
      setIsAddOpen(false)
      setName("")
      setEmail("")
      setPhone("")
      fetchCandidates()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add candidate.", variant: "destructive" })
    }
  }

  const stages = [
    { key: "sourced", label: "Sourced / Applied", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { key: "interviewing", label: "Interviewing", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { key: "offered", label: "Offer Sent", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "joined", label: "Joined", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  ]

  const filtered = candidates.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <HRLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Recruitment & ATS Pipeline</h1>
            <p className="text-xs text-muted-foreground mt-1">Source, interview, issue offer letters, and onboard new talent.</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1.5" /> Add Candidate
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        {/* ATS Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {stages.map((stageObj) => {
            const stageCandidates = filtered.filter(c => (c.stage || 'sourced').toLowerCase() === stageObj.key)
            return (
              <div key={stageObj.key} className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-card border shadow-2xs">
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">{stageObj.label}</span>
                  <Badge variant="outline" className={stageObj.color}>{stageCandidates.length}</Badge>
                </div>

                <div className="space-y-3">
                  {stageCandidates.length === 0 ? (
                    <div className="p-6 text-center border border-dashed rounded-xl text-xs text-muted-foreground">
                      No candidates in {stageObj.label.toLowerCase()}
                    </div>
                  ) : (
                    stageCandidates.map((c) => (
                      <Card key={c.id} className="premium-card border hover:border-primary/40 transition-all">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-foreground">{c.name}</p>
                              <p className="text-[11px] font-semibold text-primary">{c.designation}</p>
                            </div>
                            <Badge variant="outline" className="text-[9px] bg-accent/40">{c.department || "Ops"}</Badge>
                          </div>

                          <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
                            <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>
                            {c.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Candidate Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add New Candidate</DialogTitle>
            <DialogDescription className="text-xs">Add a new applicant to your recruitment ATS pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold">Full Name</Label>
              <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold">Email Address</Label>
              <Input placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-xs rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold">Phone Number</Label>
              <Input placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-xs rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold">Applied Position</Label>
              <Input placeholder="Field Technician / Electrician" value={designation} onChange={(e) => setDesignation(e.target.value)} className="h-9 text-xs rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="h-9 text-xs font-bold rounded-xl">Cancel</Button>
            <Button onClick={handleAddCandidate} className="h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground">Save Candidate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HRLayout>
  )
}
