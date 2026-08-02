'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  ArrowRight,
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';

export default function FinanceDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    total_invoiced: 0,
    total_paid: 0,
    total_outstanding: 0,
    total_tax_collected: 0,
    pending_count: 0,
    paid_count: 0,
    disputed_count: 0,
    overdue_count: 0,
    overdue_amount: 0,
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; summary: any }>('/api/finance/summary');
      if (res && res.success) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      console.error('Error fetching finance summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600 font-medium">Loading Finance Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-indigo-600" /> Finance Overview
          </h1>
          <p className="text-sm text-slate-500">
            Enterprise Financial Hub: Invoices, Accounts Receivable, GST Compliance & Payment Ledger.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>Total Invoiced</span>
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              ₹{Number(summary.total_invoiced).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500 mt-1">Across all finalized customer job invoices</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>Collected Revenue</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2">
              ₹{Number(summary.total_paid).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-600 mt-1">{summary.paid_count} invoices paid in full</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>Outstanding AR</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              ₹{Number(summary.total_outstanding).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-amber-600 mt-1">{summary.pending_count} pending invoices</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase">
              <span>GST Collected</span>
              <ShieldCheck className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              ₹{Number(summary.total_tax_collected).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-purple-600 mt-1">CGST / SGST / IGST liabilities</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Quick Access Modules */}
      <h2 className="text-lg font-bold text-slate-900 pt-2">Financial Sub-Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/owner/finance/invoices')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" /> Invoices</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </CardTitle>
            <CardDescription className="text-xs">Manage, track, download, and dispatch issued job invoices.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between"><span>Pending / Issued:</span> <strong>{summary.pending_count}</strong></div>
              <div className="flex justify-between"><span>Disputed Issues:</span> <strong className="text-amber-600">{summary.disputed_count}</strong></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/owner/finance/accounts-receivable')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-600" /> Accounts Receivable</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </CardTitle>
            <CardDescription className="text-xs">AR Aging analysis (0-30, 31-60, 60+ days) and collection schedules.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between"><span>Overdue Invoices:</span> <strong className="text-red-600">{summary.overdue_count}</strong></div>
              <div className="flex justify-between"><span>Overdue Amount:</span> <strong className="text-red-600">₹{Number(summary.overdue_amount).toLocaleString('en-IN')}</strong></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/owner/finance/gst-reports')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-purple-600" /> GST Reports</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </CardTitle>
            <CardDescription className="text-xs">GSTR-1 sales summary and CGST/SGST/IGST tax liability reports.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between"><span>GSTR-1 Ready:</span> <strong>Active</strong></div>
              <div className="flex justify-between"><span>Total Tax Liability:</span> <strong className="text-purple-700">₹{Number(summary.total_tax_collected).toLocaleString('en-IN')}</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
