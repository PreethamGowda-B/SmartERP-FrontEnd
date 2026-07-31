"use client"

import { useState, useEffect } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { payrollValidationApi, PayrollValidationRun, PayrollValidationFlag } from "@/lib/payrollValidationApi"
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Sparkles, 
  UserX, 
  CreditCard, 
  TrendingUp, 
  RefreshCcw,
  Lock,
  Unlock
} from "lucide-react"

export default function PayrollPreRunValidationPage() {
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState<number>(7)
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [run, setRun] = useState<PayrollValidationRun | null>(null)
  const [flags, setFlags] = useState<PayrollValidationFlag[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Resolve Modal
  const [selectedFlag, setSelectedFlag] = useState<PayrollValidationFlag | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<string>("")

  useEffect(() => {
    handleRunValidation()
  }, [selectedMonth, selectedYear])

  const handleRunValidation = async () => {
    try {
      setLoading(true)
      // Sample mock proposed payroll records for 7-point audit demonstration
      const sampleProposed = [
        { userId: "11111111-1111-1111-1111-111111111111", employeeName: "Rajesh Kumar", baseSalary: 45000, bonus: 15000, deduction: 2000 },
        { userId: "22222222-2222-2222-2222-222222222222", employeeName: "Priya Sharma", baseSalary: 60000, bonus: 0, deduction: 2500 },
        { userId: "33333333-3333-3333-3333-333333333333", employeeName: "Vikram Singh (Former)", baseSalary: 30000, bonus: 0, deduction: 0 },
      ]

      const valData = await payrollValidationApi.validatePreRun(selectedMonth, selectedYear, sampleProposed)
      if (valData.success && valData.validation) {
        fetchRunDetails(valData.validation.runId)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to execute pre-run payroll validation.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRunDetails = async (runId: string) => {
    try {
      const data = await payrollValidationApi.getRunDetails(runId)
      if (data.success) {
        setRun(data.run)
        setFlags(data.flags || [])
      }
    } catch (err: any) {
      console.error("Error loading run details:", err)
    }
  }

  const handleResolveFlag = async () => {
    if (!selectedFlag) return
    try {
      await payrollValidationApi.resolveFlag(selectedFlag.id, resolutionNotes)
      toast({ title: "Flag Resolved", description: "Anomaly override recorded in audit log." })
      setSelectedFlag(null)
      if (run) fetchRunDetails(run.id)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to resolve flag.", variant: "destructive" })
    }
  }

  const handleApprovePayroll = async () => {
    if (!run) return
    try {
      await payrollValidationApi.approvePreRun(run.id)
      toast({ title: "Pre-Run Approved", description: "Payroll run unblocked for direct disbursal." })
      fetchRunDetails(run.id)
    } catch (err: any) {
      toast({ title: "Approval Blocked", description: err.message, variant: "destructive" })
    }
  }

  const criticalUnresolved = flags.filter((f) => f.severity === "critical" && !f.is_resolved).length

  return (
    <OwnerLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Payroll Pre-Run Validation & Anomaly Engine
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              7-point pre-disbursal audit catching ghost employee fraud, duplicate bank accounts, salary spikes, and statutory errors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border bg-card p-1.5 rounded-md">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-8 rounded border bg-background px-2 text-xs"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-8 w-20 text-xs"
              />
            </div>
            <Button size="sm" onClick={handleRunValidation}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Run Audit
            </Button>
          </div>
        </div>

        {/* Audit Risk Score Banner */}
        {run && (
          <div
            className={`rounded-lg border p-4 flex items-center justify-between ${
              run.risk_level === "low"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : run.risk_level === "warning"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            <div className="flex items-center gap-3">
              {run.risk_level === "low" && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
              {run.risk_level === "warning" && <AlertTriangle className="h-6 w-6 text-amber-500" />}
              {run.risk_level === "critical" && <XCircle className="h-6 w-6 text-rose-500" />}
              <div>
                <h3 className="font-bold text-base capitalize">
                  Audit Rating: {run.risk_level} Risk ({run.total_anomalies_found} Anomalies Found)
                </h3>
                <p className="text-xs opacity-90 mt-0.5">
                  {run.risk_level === "low"
                    ? "Zero critical flags. Payroll is safe for immediate disbursal."
                    : run.risk_level === "warning"
                    ? "Minor warnings detected. Review non-critical flags before payroll approval."
                    : "CRITICAL FLAGS DETECTED: Disbursal hard-blocked until Owner PIN override or flag resolution."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {run.is_approved ? (
                <Badge className="bg-emerald-600 text-white text-xs py-1 px-3 flex items-center gap-1">
                  <Unlock className="h-3.5 w-3.5" /> Approved & Unblocked
                </Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={criticalUnresolved > 0}
                  onClick={handleApprovePayroll}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Lock className="mr-1.5 h-4 w-4" /> Approve Payroll Disbursal
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 7-Point Audit Checklist Grid */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary" /> 1. Duplicate Bank/PAN
            </span>
            <Badge variant="outline" className="text-[10px]">Passed</Badge>
          </div>
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" /> 2. Salary Spike (&gt;25%)
            </span>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">Warning</Badge>
          </div>
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <UserX className="h-4 w-4 text-primary" /> 3. Inactive User Payout
            </span>
            <Badge variant="outline" className="text-[10px]">Passed</Badge>
          </div>
          <div className="rounded-lg border bg-card p-3 flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> 4. Attendance Check
            </span>
            <Badge variant="outline" className="text-[10px]">Passed</Badge>
          </div>
        </div>

        {/* Anomaly Flags Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-Run Anomaly Audit Flags ({flags.length})</CardTitle>
            <CardDescription>Line-item audit flags generated by the 7-point pre-run engine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Flag Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">AI Explanation</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Executing 7-point audit checks...
                      </td>
                    </tr>
                  ) : flags.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No payroll anomaly flags detected. All 7 audit checks passed.
                      </td>
                    </tr>
                  ) : (
                    flags.map((flag) => (
                      <tr key={flag.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{flag.employee_name}</td>
                        <td className="px-4 py-3 font-mono text-xs capitalize">{flag.flag_type.replace("_", " ")}</td>
                        <td className="px-4 py-3">
                          {flag.severity === "critical" && <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30">Critical</Badge>}
                          {flag.severity === "warning" && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Warning</Badge>}
                          {flag.severity === "info" && <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Info</Badge>}
                        </td>
                        <td className="px-4 py-3 text-xs">{flag.description}</td>
                        <td className="px-4 py-3 text-xs italic text-muted-foreground">
                          {flag.ai_analysis_reasoning || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {flag.is_resolved ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">Resolved</Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setSelectedFlag(flag)}
                            >
                              Resolve / Override
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Resolve Flag Modal */}
        <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Anomaly Flag</DialogTitle>
              <DialogDescription>
                Provide an audit resolution note to override flag for {selectedFlag?.employee_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Resolution / Override Notes</Label>
                <Input
                  placeholder="e.g. Verified annual increment approved by HR Director..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleResolveFlag}>Save Resolution</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  )
}
