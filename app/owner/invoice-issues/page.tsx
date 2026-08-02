'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  User, 
  Calendar, 
  RefreshCw, 
  Edit3, 
  MessageSquare,
  Eye,
  Check,
  X,
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function OwnerInvoiceIssuesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);

  // Resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [ownerResponse, setOwnerResponse] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputedInvoices();
  }, []);

  const fetchDisputedInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; disputes: any[] }>('/api/invoices/disputes/all');
      if (res && res.success) {
        setDisputes(res.disputes || []);
      }
    } catch (err: any) {
      toast({
        title: 'Error loading invoice issues',
        description: err.message || 'Could not fetch disputed invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (status: 'resolved' | 'rejected') => {
    if (!selectedDispute) return;
    try {
      setResolving(true);
      const res = await apiClient<{ success: boolean }>(`/api/invoices/disputes/${selectedDispute.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          owner_response: ownerResponse || (status === 'resolved' ? 'Issue resolved by owner' : 'Issue rejected by owner'),
        }),
      });

      if (res && res.success) {
        toast({
          title: status === 'resolved' ? 'Issue Resolved! ✅' : 'Issue Rejected ❌',
          description: 'Customer notified automatically.',
        });
        setSelectedDispute(null);
        setOwnerResponse('');
        fetchDisputedInvoices();
      }
    } catch (err: any) {
      toast({
        title: 'Action failed',
        description: err.message || 'Could not update issue status',
        variant: 'destructive',
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" /> Customer Invoice Issues
          </h1>
          <p className="text-sm text-slate-500">
            Review customer disputes, adjust billing line items, reply to clients, and reissue updated invoice versions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
            onClick={() => router.push('/owner/jobs')}
          >
            ← Back to Jobs
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDisputedInvoices}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-slate-600 font-medium">Loading issues...</span>
        </div>
      ) : disputes.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-800">No Open Invoice Issues</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              All customer invoices are accepted and clear! When a customer raises an invoice issue, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {disputes.map((disp) => (
            <Card key={disp.id} className="border-amber-200 bg-amber-50/10 hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3 border-b bg-amber-50/30">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-xs">
                      {disp.invoice_number || 'INV-2026'}
                    </Badge>
                    <CardTitle className="text-base font-bold mt-1 text-slate-900">{disp.job_title || 'Completed Job'}</CardTitle>
                  </div>
                  <Badge className={`text-xs ${disp.status === 'resolved' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                    {(disp.status || 'OPEN').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="h-3.5 w-3.5 text-slate-400" /> {disp.customer_name || 'Client'} ({disp.customer_email || 'No email'})
                  </span>
                  <span className="font-bold text-indigo-700">₹{Number(disp.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-900">
                      <AlertTriangle className="h-3.5 w-3.5" /> Category: {disp.issue_category || 'Discount Request'}
                    </span>
                    <span className="text-[10px] text-amber-700">{new Date(disp.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="italic text-slate-800 mt-1">"{disp.description || 'No detailed message provided.'}"</p>
                </div>

                {disp.owner_response && (
                  <div className="bg-slate-100 p-2.5 rounded-lg border text-xs text-slate-700 space-y-0.5">
                    <span className="font-bold text-slate-900">Owner Reply / Resolution:</span>
                    <p>{disp.owner_response}</p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="bg-slate-50 p-3 border-t flex flex-wrap justify-between gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-slate-600"
                  onClick={() => {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.prozync.in';
                    window.open(`${baseUrl}/api/invoices/${disp.invoice_id}/pdf`, '_blank');
                  }}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Invoice
                </Button>

                <div className="flex items-center gap-1.5">
                  {disp.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        setSelectedDispute(disp);
                        setOwnerResponse('');
                      }}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Resolve / Reply
                    </Button>
                  )}

                  <Button
                    size="sm"
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    onClick={() => router.push(`/owner/jobs/${disp.job_id}/invoice-editor`)}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Create Revised Invoice
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" /> Resolve Customer Issue
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide a message or explanation to the customer for invoice #{selectedDispute?.invoice_number}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <span className="font-bold text-slate-800">Issue:</span> {selectedDispute?.issue_category}
              <p className="italic text-slate-600">"{selectedDispute?.description}"</p>
            </div>

            <Textarea
              placeholder="Enter resolution notes / explanation for customer..."
              value={ownerResponse}
              onChange={(e) => setOwnerResponse(e.target.value)}
              className="text-xs"
              rows={4}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-red-200 text-red-700 hover:bg-red-50"
              disabled={resolving}
              onClick={() => handleResolveDispute('rejected')}
            >
              {resolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5 mr-1" />} Reject Dispute
            </Button>
            <Button
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={resolving}
              onClick={() => handleResolveDispute('resolved')}
            >
              {resolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />} Resolve & Notify Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
