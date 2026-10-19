"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { payrollValidationApi, PayrollValidationRun, PayrollValidationFlag } from "@/lib/payrollValidationApi"
import { mapPayrollAuditChecks } from "@/lib/payrollAuditPresentation"
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  UserX, 
  CreditCard, 
  TrendingUp, 
  RefreshCcw,
  Lock,
  Unlock,
  Loader2,
  Banknote,
  Calculator,
  IndianRupee,
  CalendarDays,
} from "lucide-react"

import { LockedFeatureScreen } from "@/components/locked-feature-screen"
import { useSubscription } from "@/contexts/subscription-context"

export function PayrollAuditView() {
  const { plan } = useSubscription()
  const hasPayroll = plan.features?.payroll === true
  const { toast } = useToast()
  
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [run, setRun] = useState<PayrollValidationRun | null>(null)
  const [flags, setFlags] = useState<PayrollValidationFlag[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Resolve Modal
  const [selectedFlag, setSelectedFlag] = useState<PayrollValidationFlag | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<string>("")

  const fetchRunDetails = useCallback(async (runId: string) => {
    try {
      const data = await payrollValidationApi.getRunDetails(runId)
      if (data.success) {
        setRun(data.run)
        setFlags(data.flags || [])
      } else {
        throw new Error(data.error || "Unable to load audit details.")
      }
    } catch (err: any) {
      setRun(null)
      setFlags([])
      setError(err.message || "Unable to load audit details.")
    }
  }, [])

  const handleRunValidation = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setRun(null)
      setFlags([])
      const valData = await payrollValidationApi.validatePreRun(selectedMonth, selectedYear)
      if (valData.success && valData.validation) {
        await fetchRunDetails(valData.validation.runId)
      } else {
        throw new Error(valData.error || "The server did not return an audit result.")
      }
    } catch (err: any) {
      setRun(null)
      setFlags([])
      setError(err.message || "Unable to validate persisted payroll data.")
      toast({
        title: "Error",
        description: err.message || "Failed to execute pre-run payroll validation.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [fetchRunDetails, selectedMonth, selectedYear, toast])

  useEffect(() => {
    void handleRunValidation()
  }, [handleRunValidation])

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
  const checksComplete = (run?.check_results?.length || 0) === 7
    && run?.check_results.every((check) => !["unable_to_validate", "not_applicable"].includes(check.status))
  const isFuturePeriod = Boolean(run && (run.year > currentDate.getFullYear()
    || (run.year === currentDate.getFullYear() && run.month > currentDate.getMonth() + 1)))
  const checkIcons = [CreditCard, TrendingUp, UserX, FileSpreadsheet, Calculator, IndianRupee, Banknote]
  const checkStatusClass: Record<string, string> = {
    passed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    failed: "bg-rose-500/10 text-rose-700 border-rose-500/30",
    unable_to_validate: "bg-slate-500/10 text-slate-700 border-slate-500/30",
    not_applicable: "bg-slate-500/10 text-slate-700 border-slate-500/30",
  }
  const displayedChecks = mapPayrollAuditChecks(run?.check_results)

  if (!hasPayroll) {
    return (
      <div className="py-4">
        <LockedFeatureScreen
          featureTitle="AI Payroll Pre-Run Audit & Flag Engine"
          featureDescription="Payroll validation is not enabled for the current company plan."
          requiredTier="pro"
          isLocked={!hasPayroll}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Audit Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border bg-card/60 backdrop-blur-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Payroll Pre-Run Validation & Anomaly Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            7-point pre-disbursal audit catching ghost employee fraud, duplicate bank accounts, salary spikes, and statutory errors.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border bg-card p-1.5 rounded-lg">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-8 rounded-md border bg-background px-2 text-xs font-medium"
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
              className="h-8 w-20 text-xs font-medium"
            />
          </div>
          <Button size="sm" onClick={handleRunValidation} disabled={loading} className="font-semibold shadow-xs">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Run Audit
          </Button>
        </div>
      </div>

      {/* Audit Risk Score Banner */}
      {run && (
        <div
          className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            run.risk_level === "low"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : run.risk_level === "warning"
              ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-3">
          {run.audit_status === "passed" && <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />}
            {run.risk_level === "warning" && <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />}
            {run.risk_level === "critical" && <XCircle className="h-6 w-6 text-rose-600 shrink-0" />}
            <div>
              <h3 className="font-bold text-base capitalize">
                {run.audit_status === "no_records" ? "No payroll records available to audit" :
                  run.is_stale ? "Audit results are stale" :
                    `Audit ${run.audit_status.replace(/_/g, " ")} — ${run.total_anomalies_found} findings`}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {run.is_stale
                  ? "Payroll or source data changed after this audit. Run it again before reviewing or approving."
                  : `${run.record_count} payroll records examined · ${run.checks_executed}/7 checks executed for ${String(run.month).padStart(2, "0")}/${run.year}.${isFuturePeriod ? " This is a future period; approval is blocked." : run.checks_executed < 7 ? " One or more checks could not be completed." : " Review findings before approval."}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {run.is_approved && !run.is_stale && checksComplete && run.record_count > 0 ? (
              <Badge className="bg-emerald-600 text-white text-xs py-1 px-3 flex items-center gap-1 font-bold">
                <Unlock className="h-3.5 w-3.5" /> Approved & Unblocked
              </Badge>
            ) : (
              <Button
                size="sm"
                disabled={loading || run.is_approved || run.is_stale || !checksComplete || run.record_count === 0 || criticalUnresolved > 0 || isFuturePeriod}
                onClick={handleApprovePayroll}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                <Lock className="mr-1.5 h-4 w-4" /> Approve Payroll Disbursal
              </Button>
            )}
          </div>
        </div>
      )}

      {error && !loading && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">{error}</div>}

      {/* The checklist is rendered only from persisted backend results. */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-xl border bg-card p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Running checks against company payroll records…</div>
        ) : run ? displayedChecks.map((check, index) => {
          const Icon = checkIcons[index] || CalendarDays
          return (
            <div key={check.id} className="rounded-xl border bg-card p-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold flex items-center gap-1.5"><Icon className="h-4 w-4 text-primary shrink-0" />{check.number}. {check.label}</span>
                <Badge variant="outline" className={`text-[10px] font-bold whitespace-nowrap ${checkStatusClass[check.status] || checkStatusClass.unable_to_validate}`}>{check.statusLabel}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{check.records_examined} records examined · {check.findings_count} findings</p>
              <p className="mt-1 text-xs text-muted-foreground">{check.explanation}</p>
            </div>
          )
        }) : null}
      </div>

      {/* Anomaly Flags Table */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-lg">Pre-Run Anomaly Audit Flags ({flags.length})</CardTitle>
          <CardDescription className="text-xs">Line-item audit flags generated by the 7-point pre-run engine</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-2">
          <div className="rounded-none sm:rounded-lg border-y sm:border overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Flag Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">AI Explanation</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                      Executing 7-point audit checks...
                    </td>
                  </tr>
                ) : run?.audit_status === "no_records" ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                      No payroll records available to audit for this period.
                    </td>
                  </tr>
                ) : error ? (
                  <tr><td colSpan={6} className="py-8 text-center text-rose-700 text-xs">Audit results could not be loaded. {error}</td></tr>
                ) : flags.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">No findings were generated. Review each check status above; unresolved or unavailable checks are not a clean audit.</td></tr>
                ) : (
                  flags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-xs">{flag.employee_name}</td>
                      <td className="px-4 py-3 font-mono text-[11px] capitalize">{flag.flag_type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        {flag.severity === "critical" && <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-[10px] font-bold">Critical</Badge>}
                        {flag.severity === "warning" && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-bold">Warning</Badge>}
                        {flag.severity === "info" && <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-bold">Info</Badge>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {flag.description}
                        {flag.source_record_id && <div className="mt-1 text-[10px] text-muted-foreground">{flag.source_table === "users" ? "Employee record" : "Payroll record"}: {flag.source_record_id}</div>}
                        {flag.finding_details && Object.entries(flag.finding_details).some(([key, value]) => ["previous_amount", "current_amount", "change_percent", "gross_earnings", "deduction", "stored_net", "expected_net", "payout_amount", "masked_identifier"].includes(key) && value != null) && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {Object.entries(flag.finding_details)
                              .filter(([key, value]) => ["previous_amount", "current_amount", "change_percent", "gross_earnings", "deduction", "stored_net", "expected_net", "payout_amount", "masked_identifier"].includes(key) && value != null)
                              .map(([key, value]) => `${key.replace(/_/g, " ")}: ${key.endsWith("amount") || ["gross_earnings", "deduction", "stored_net", "expected_net", "payout_amount"].includes(key) ? `₹${Number(value).toLocaleString("en-IN")}` : value}`)
                              .join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs italic text-muted-foreground">
                        {flag.ai_analysis_reasoning || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {flag.is_resolved ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-bold">Resolved</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Anomaly Flag</DialogTitle>
            <DialogDescription>
              Provide an audit resolution note to override flag for {selectedFlag?.employee_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Resolution / Override Notes</Label>
              <Input
                placeholder="e.g. Verified annual increment approved by HR Director..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleResolveFlag} className="font-semibold">Save Resolution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
