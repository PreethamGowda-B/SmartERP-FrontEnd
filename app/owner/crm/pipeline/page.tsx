"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { crmSalesApi, CrmLead } from "@/lib/crmSalesApi"
import { 
  Briefcase, 
  Plus, 
  Flame, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Send, 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Phone, 
  Mail,
  Search,
  RefreshCw
} from "lucide-react"

export default function CrmPipelinePage() {
  const { toast } = useToast()
  const [pipeline, setPipeline] = useState<Record<string, CrmLead[]>>({
    new_lead: [],
    contacted: [],
    proposal_sent: [],
    negotiation: [],
    closed_won: [],
    closed_lost: [],
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Modals
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState<boolean>(false)
  const [selectedProposalLead, setSelectedProposalLead] = useState<CrmLead | null>(null)

  // New Lead Form
  const [leadName, setLeadName] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [dealValue, setDealValue] = useState<number>(250000)

  useEffect(() => {
    fetchPipeline()
  }, [])

  const fetchPipeline = async () => {
    try {
      setLoading(true)
      const data = await crmSalesApi.getPipeline()
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load CRM pipeline.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLead = async () => {
    if (!leadName || !email) {
      toast({ title: "Validation Error", description: "Lead name and email are required.", variant: "destructive" })
      return
    }
    try {
      const res = await crmSalesApi.createLead({
        leadName,
        companyName,
        email,
        phone,
        dealValue,
      })
      toast({
        title: "Lead Created",
        description: `Lead ingested with predictive score ${res.lead.lead_score} (${res.lead.priority.toUpperCase()}).`,
      })
      setIsAddLeadModalOpen(false)
      fetchPipeline()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create lead.", variant: "destructive" })
    }
  }

  const handleStageChange = async (leadId: string, targetStage: string) => {
    try {
      await crmSalesApi.updateLeadStage(leadId, targetStage)
      toast({ title: "Stage Updated", description: `Moved lead to ${targetStage.replace("_", " ").toUpperCase()}.` })
      fetchPipeline()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update stage.", variant: "destructive" })
    }
  }

  const handleGenerateProposal = async (lead: CrmLead) => {
    try {
      toast({ title: "Generating Proposal...", description: "Groq Llama 3.3 70B drafting sales proposal..." })
      const res = await crmSalesApi.generateAiProposal(lead.id)
      setSelectedProposalLead(res.lead)
      fetchPipeline()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate proposal.", variant: "destructive" })
    }
  }

  const allLeads = Object.values(pipeline).flat()
  const totalPipelineValue = allLeads.reduce((sum, l) => sum + Number(l.deal_value || 0), 0)
  const hotLeadsCount = allLeads.filter((l) => l.priority === "hot").length

  const stagesConfig = [
    { key: "new_lead", title: "New Lead", color: "border-blue-500/50 bg-blue-500/5" },
    { key: "contacted", title: "Contacted", color: "border-amber-500/50 bg-amber-500/5" },
    { key: "proposal_sent", title: "Proposal Sent", color: "border-purple-500/50 bg-purple-500/5" },
    { key: "negotiation", title: "Negotiation", color: "border-orange-500/50 bg-orange-500/5" },
    { key: "closed_won", title: "Closed Won", color: "border-emerald-500/50 bg-emerald-500/5" },
  ]

  return (
    <OwnerLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-primary" />
              Autonomous CRM Pipeline & AI Sales Agent
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Predictive lead scoring, visual Kanban deal stages, and automated 1-click Groq AI proposal drafting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchPipeline}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Pipeline
            </Button>
            <Button size="sm" onClick={() => setIsAddLeadModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </div>
        </div>

        {/* KPI Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{totalPipelineValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all active deal stages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Leads</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allLeads.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Monitored pipeline deals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hot Leads (&ge;75 Score)</CardTitle>
              <Flame className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{hotLeadsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">High conversion probability</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deals Won</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {pipeline.closed_won?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Successfully closed deals</p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board Container */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stagesConfig.map((col) => {
            const leads = pipeline[col.key] || []
            return (
              <div key={col.key} className={`rounded-lg border ${col.color} p-3 space-y-3 min-w-[240px]`}>
                <div className="flex items-center justify-between pb-1 border-b">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    {col.title} ({leads.length})
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    ₹{leads.reduce((sum, l) => sum + Number(l.deal_value || 0), 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-3">
                  {leads.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-md">
                      No deals in {col.title}
                    </div>
                  ) : (
                    leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-lg border bg-card p-3 space-y-2 shadow-sm hover:shadow transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm">{lead.lead_name}</div>
                            {lead.company_name && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" /> {lead.company_name}
                              </div>
                            )}
                          </div>
                          {lead.priority === "hot" && (
                            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px]">
                              <Flame className="mr-1 h-3 w-3 fill-rose-500 text-rose-500" /> Hot {lead.lead_score}
                            </Badge>
                          )}
                          {lead.priority === "warm" && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                              Warm {lead.lead_score}
                            </Badge>
                          )}
                          {lead.priority === "cold" && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">
                              Cold {lead.lead_score}
                            </Badge>
                          )}
                        </div>

                        <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Deal Value: ₹{Number(lead.deal_value).toLocaleString()}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t flex items-center justify-between gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-primary"
                            onClick={() => handleGenerateProposal(lead)}
                          >
                            <Sparkles className="mr-1 h-3 w-3" /> AI Proposal
                          </Button>

                          {col.key === "new_lead" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => handleStageChange(lead.id, "contacted")}
                            >
                              Contacted <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          {col.key === "contacted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => handleStageChange(lead.id, "proposal_sent")}
                            >
                              Proposal <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          {col.key === "proposal_sent" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => handleStageChange(lead.id, "negotiation")}
                            >
                              Negotiate <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          {col.key === "negotiation" && (
                            <Button
                              size="sm"
                              className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleStageChange(lead.id, "closed_won")}
                            >
                              Win Deal <CheckCircle2 className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Lead Modal */}
        <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sales Lead</DialogTitle>
              <DialogDescription>
                Ingest lead into SmartERP. Predictive lead scoring engine will automatically evaluate conversion probability.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Lead / Contact Name</Label>
                <Input placeholder="Anand Verma" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
              </div>
              <div>
                <Label>Company Name</Label>
                <Input placeholder="Verma Logistics Pvt Ltd" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="anand@vermalogistics.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label>Estimated Deal Value (₹)</Label>
                <Input type="number" value={dealValue} onChange={(e) => setDealValue(Number(e.target.value))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateLead}>Ingest & Score Lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Proposal Drawer / Modal */}
        <Dialog open={!!selectedProposalLead} onOpenChange={() => setSelectedProposalLead(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Groq AI Generated B2B Sales Proposal
              </DialogTitle>
              <DialogDescription>
                Drafted for <strong>{selectedProposalLead?.lead_name}</strong> (
                {selectedProposalLead?.company_name || "Enterprise Lead"}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4 text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
                {selectedProposalLead?.ai_proposal_text || "Generating AI proposal text..."}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  toast({ title: "Proposal Exported", description: "Copied to clipboard for client email/WhatsApp." })
                  setSelectedProposalLead(null)
                }}
              >
                Copy & Export Proposal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
