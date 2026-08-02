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
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function OwnerInvoiceIssuesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchDisputedInvoices();
  }, []);

  const fetchDisputedInvoices = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; invoices: any[] }>('/api/invoices?status=disputed');
      if (res && res.success) {
        setInvoices(res.invoices);
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" /> Customer Invoice Issues
          </h1>
          <p className="text-sm text-slate-500">
            Review customer disputes, adjust billing line items, and reissue updated invoice versions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDisputedInvoices}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-slate-600 font-medium">Loading issues...</span>
        </div>
      ) : invoices.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-800">No Disputed Invoices</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              All customer invoices are accepted and clear! When a customer raises an invoice issue, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {invoices.map((inv) => (
            <Card key={inv.id} className="border-amber-200 bg-amber-50/10 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b bg-amber-50/30">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-xs">
                      {inv.invoice_number} (v{inv.version_number}.0)
                    </Badge>
                    <CardTitle className="text-base font-bold mt-1 text-slate-900">{inv.job_title || 'Completed Job'}</CardTitle>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Disputed
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" /> {inv.customer_name || 'Client'}
                  </span>
                  <span className="font-semibold text-indigo-700">₹{Number(inv.total_amount).toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-amber-100/60 p-3 rounded-md border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-amber-950">
                    <AlertTriangle className="h-3.5 w-3.5" /> Customer Dispute Reported
                  </div>
                  <p className="italic">{inv.internal_notes || 'Customer reported a discrepancy in labor hours or line items.'}</p>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>Issued: {new Date(inv.created_at).toLocaleDateString()}</span>
                  <span>Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Immediate'}</span>
                </div>
              </CardContent>

              <CardFooter className="bg-slate-50 p-4 border-t flex justify-end gap-2">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  onClick={() => router.push(`/owner/jobs/${inv.job_id}/invoice-editor`)}
                >
                  <Edit3 className="h-4 w-4 mr-1.5" /> Review Issue & Reissue (v{inv.version_number + 1}.0)
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
