'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Download, 
  Send, 
  Eye, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function OwnerInvoicesListPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' ? '/api/invoices' : `/api/invoices?status=${statusFilter}`;
      const res = await apiClient<{ success: boolean; invoices: any[] }>(url);
      if (res && res.success) {
        setInvoices(res.invoices);
      }
    } catch (err: any) {
      toast({
        title: 'Error loading invoices',
        description: err.message || 'Could not fetch invoices list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async (invId: string) => {
    try {
      const res = await apiClient<{ success: boolean }>(`/api/invoices/${invId}/send-whatsapp`, { method: 'POST' });
      if (res && res.success) {
        toast({ title: 'Invoice Sent via WhatsApp! 📱', description: 'Template message dispatched.' });
        fetchInvoices();
      }
    } catch (err: any) {
      toast({ title: 'WhatsApp dispatch failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSendEmail = async (invId: string) => {
    try {
      const res = await apiClient<{ success: boolean }>(`/api/invoices/${invId}/send-email`, { method: 'POST' });
      if (res && res.success) {
        toast({ title: 'Invoice Email Queued! 📧', description: 'Sent via Resend.' });
        fetchInvoices();
      }
    } catch (err: any) {
      toast({ title: 'Email dispatch failed', description: err.message, variant: 'destructive' });
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.job_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" /> Invoices Management
          </h1>
          <p className="text-sm text-slate-500">
            View, track customer views/downloads, dispatch via WhatsApp/Email, and record payments.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by Inv #, Customer, or Job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="issued">Issued / Sent</SelectItem>
              <SelectItem value="viewed">Viewed by Client</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-slate-600 font-medium">Loading Invoices...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No invoices found matching current criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-4">Invoice # / Date</th>
                    <th className="p-4">Customer & Job</th>
                    <th className="p-4 text-right">Amount (₹)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">View / Download Activity</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 font-mono">{inv.invoice_number}</div>
                        <div className="text-xs text-slate-500 font-sans">
                          v{inv.version_number || 1}.0 · {new Date(inv.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{inv.customer_name || 'Client'}</div>
                        <div className="text-xs text-slate-500">{inv.job_title || 'Service Job'}</div>
                      </td>

                      <td className="p-4 text-right font-extrabold text-slate-900">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                      </td>

                      <td className="p-4 text-center">
                        <Badge
                          className={`text-xs ${
                            inv.status === 'paid'
                              ? 'bg-emerald-600'
                              : inv.status === 'disputed'
                              ? 'bg-amber-600'
                              : inv.status === 'viewed'
                              ? 'bg-blue-600'
                              : 'bg-indigo-600'
                          }`}
                        >
                          {(inv.status || 'ISSUED').toUpperCase()}
                        </Badge>
                      </td>

                      <td className="p-4 text-xs text-slate-600 space-y-1">
                        {inv.viewed_at ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-medium">
                            <Eye className="h-3.5 w-3.5 text-emerald-600" /> Viewed: {new Date(inv.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">Not viewed yet</div>
                        )}
                        {inv.downloaded_at && (
                          <div className="flex items-center gap-1 text-indigo-700">
                            <Download className="h-3.5 w-3.5 text-indigo-600" /> Downloaded
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="View Invoice"
                          onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, '_blank')}
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          title="Send via WhatsApp"
                          onClick={() => handleSendWhatsApp(inv.id)}
                        >
                          <MessageSquare className="h-4 w-4 text-emerald-600" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          title="Send via Email"
                          onClick={() => handleSendEmail(inv.id)}
                        >
                          <Mail className="h-4 w-4 text-indigo-600" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 ml-1"
                          onClick={() => router.push(`/owner/jobs/${inv.job_id}/invoice-editor`)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
