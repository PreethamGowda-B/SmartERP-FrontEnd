"use client"

import { useState, useEffect } from "react"
import { HRLayout } from "@/components/hr-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/apiClient"
import { Inbox, CheckCircle2, XCircle, Clock, Check, X, Search, Loader2 } from "lucide-react"

export default function HRRequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await apiClient("/api/hr/requests?status=all")
      if (Array.isArray(res?.requests)) setRequests(res.requests)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleReview = async (id: number, status: "approved" | "rejected") => {
    try {
      setProcessingId(id)
      await apiClient(`/api/hr/requests/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, hr_comments: `Reviewed & updated by HR` })
      })
      toast({ title: "✅ Application Updated", description: `Request #${id} marked as ${status} successfully.` })
      fetchRequests()
    } catch (err: any) {
      toast({ title: "❌ Review Failed", description: err.message || "Failed to update request", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <HRLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Employee Request Processing Inbox</h1>
            <p className="text-xs text-muted-foreground mt-1">Review leave applications, attendance corrections, advances, & shift transfer requests.</p>
          </div>
        </div>

        {/* Requests Table */}
        <Card className="border shadow-xs">
          <CardContent className="p-0 overflow-x-auto">
            {requests.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
                <p className="text-sm font-bold text-foreground">Request inbox is clear</p>
                <p className="text-xs mt-0.5">Submitted employee applications will appear here for review.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Request Type</th>
                    <th className="p-4">Application Details</th>
                    <th className="p-4">Submitted Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-foreground">{r.employee_name}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-primary/10 text-primary font-bold uppercase text-[10px]">
                          {r.request_type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground max-w-xs truncate">
                        {typeof r.details === "object" ? JSON.stringify(r.details) : r.details}
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="p-4">
                        <Badge className={`font-bold px-2 py-0.5 uppercase text-[9px] ${
                          r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {r.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === r.id}
                              className="h-7 text-xs font-bold rounded-lg border-emerald-300 text-emerald-700 bg-emerald-50"
                              onClick={() => handleReview(r.id, "approved")}
                            >
                              {processingId === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                              {processingId === r.id ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === r.id}
                              className="h-7 text-xs font-bold rounded-lg border-rose-300 text-rose-700 bg-rose-50"
                              onClick={() => handleReview(r.id, "rejected")}
                            >
                              {processingId === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                              {processingId === r.id ? "Rejecting..." : "Reject"}
                            </Button>
                          </div>
                        )}
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
