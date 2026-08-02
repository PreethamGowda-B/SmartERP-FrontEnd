'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  Eye, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function CustomerInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);

  // Dispute modal state
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState('Material mismatch');
  const [issueDescription, setIssueDescription] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; invoice: any; lineItems: any[] }>(`/api/invoices/${invoiceId}`);
      if (res && res.success) {
        setInvoice(res.invoice);
        setLineItems(res.lineItems || []);

        // Log View Activity Tracking Beacon
        apiClient(`/api/invoices/${invoiceId}/track`, {
          method: 'POST',
          body: JSON.stringify({
            companyId: res.invoice.company_id,
            actionType: 'viewed',
            performedByType: 'customer',
            performedByName: res.invoice.customer_name || 'Customer',
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      toast({
        title: 'Error loading invoice',
        description: err.message || 'Could not fetch invoice details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Log Download Activity Tracking Beacon
      apiClient(`/api/invoices/${invoiceId}/track`, {
        method: 'POST',
        body: JSON.stringify({
          companyId: invoice.company_id,
          actionType: 'downloaded',
          performedByType: 'customer',
          performedByName: invoice.customer_name || 'Customer',
        }),
      }).catch(() => {});

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.prozync.in';
      window.open(`${baseUrl}/api/invoices/${invoiceId}/pdf`, '_blank');
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err.message || 'Could not download invoice PDF',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitDispute = async () => {
    if (!issueDescription.trim()) {
      toast({ title: 'Please enter a description of the issue', variant: 'destructive' });
      return;
    }

    try {
      setSubmittingDispute(true);
      // 1. Post to Canonical Approval Engine (/api/work-requests)
      await apiClient('/api/work-requests', {
        method: 'POST',
        body: JSON.stringify({
          request_type: 'invoice_discount',
          category: 'finance',
          urgency: 'high',
          invoice_id: invoiceId,
          job_id: invoice?.job_id,
          title: `Customer Discount Request: ${invoice?.invoice_number || invoiceId}`,
          reason: `${issueCategory}: ${issueDescription}`,
          payload: { category: issueCategory, invoice_number: invoice?.invoice_number }
        }),
      }).catch(() => {});

      // 2. Log to legacy dispute endpoint for backward compatibility
      const res = await apiClient<{ success: boolean }>(`/api/invoices/${invoiceId}/dispute`, {
        method: 'POST',
        body: JSON.stringify({
          companyId: invoice.company_id,
          customerId: invoice.customer_id,
          issueCategory,
          description: issueDescription,
        }),
      });

      if (res && res.success) {
        toast({
          title: 'Invoice Issue Submitted',
          description: 'The business owner has been notified and will review your request.',
        });
        setDisputeOpen(false);
        fetchInvoiceDetails();
      }
    } catch (err: any) {
      toast({
        title: 'Submission failed',
        description: err.message || 'Could not submit issue',
        variant: 'destructive',
      });
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600 font-medium">Loading Invoice...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Invoice Not Found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1.5" /> Download PDF
          </Button>
          {invoice.status !== 'paid' && invoice.status !== 'disputed' && (
            <>
              <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 bg-amber-50" onClick={() => setDisputeOpen(true)}>
                <AlertTriangle className="h-4 w-4 mr-1.5" /> Raise Invoice Issue
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <CreditCard className="h-4 w-4 mr-1.5" /> Pay Invoice (₹{Number(invoice.total_amount).toLocaleString('en-IN')})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Document Card */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b bg-slate-50/50 p-6">
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono">
                {invoice.invoice_number} (v{invoice.version_number || 1}.0)
              </Badge>
              <h1 className="text-2xl font-bold text-slate-900 mt-2">{invoice.job_title || 'Completed Service Job'}</h1>
              <p className="text-xs text-slate-500 mt-1">SmartERP Enterprise Portal</p>
            </div>
            <div className="text-right">
              <Badge className={`text-xs px-3 py-1 ${invoice.status === 'paid' ? 'bg-emerald-600' : invoice.status === 'disputed' ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                {(invoice.status || 'ISSUED').toUpperCase()}
              </Badge>
              <div className="text-xs text-slate-500 mt-2">
                Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'On Receipt'}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Status Alert Banners */}
          {invoice.status === 'disputed' && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Invoice Issue Submitted:</strong> You have raised a dispute regarding this invoice. The business owner will review your notes and publish an updated Version {(invoice.version_number || 1) + 1}.0 shortly.
              </div>
            </div>
          )}

          {invoice.status === 'paid' && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-sm text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="font-semibold">Payment Complete:</strong> This invoice has been fully paid. Thank you!
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 border-b text-xs uppercase font-semibold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Qty / Hrs</th>
                  <th className="p-3 text-right">Unit Price (₹)</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-900">
                      {item.description}
                      <div className="text-[11px] text-slate-400 font-mono">HSN: {item.hsn_code || '998311'}</div>
                    </td>
                    <td className="p-3 text-center text-slate-700">{item.quantity}</td>
                    <td className="p-3 text-right text-slate-700">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">₹{Number(item.total_amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
              </div>

              {invoice.is_inter_state ? (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>IGST ({invoice.gst_rate}%):</span>
                  <span>₹{Number(invoice.igst).toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>CGST ({(invoice.gst_rate / 2)}%):</span>
                    <span>₹{Number(invoice.cgst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>SGST ({(invoice.gst_rate / 2)}%):</span>
                    <span>₹{Number(invoice.sgst).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-2">
                <span>Total Amount:</span>
                <span className="text-indigo-600">₹{Number(invoice.total_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raise Issue Modal */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" /> Raise Invoice Issue
            </DialogTitle>
            <DialogDescription>
              Report a discrepancy or question regarding this invoice. The business owner will review and issue an updated version.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Issue Category</Label>
              <Select value={issueCategory} onValueChange={setIssueCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Material mismatch">Material mismatch (Unused material included)</SelectItem>
                  <SelectItem value="Working days incorrect">Working days / labor hours incorrect</SelectItem>
                  <SelectItem value="Quantity wrong">Quantity is wrong</SelectItem>
                  <SelectItem value="GST error">GST calculation error</SelectItem>
                  <SelectItem value="Other">Other pricing issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Detailed Explanation</Label>
              <Textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Explain what needs adjustment..."
                rows={4}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitDispute} disabled={submittingDispute} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              {submittingDispute ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Submit Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
