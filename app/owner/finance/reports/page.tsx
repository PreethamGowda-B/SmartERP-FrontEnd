'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { TrendingUp, FileText, Download, DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { OwnerLayout } from '@/components/owner-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface InvoiceRow {
  id: string;
  customer_name?: string;
  total_amount?: number | string;
  amount_paid?: number | string;
  status?: string;
}

export default function OwnerFinancialReportsPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [payrollTotal, setPayrollTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, payRes] = await Promise.allSettled([
        apiClient<any>('/api/invoices'),
        apiClient<any>('/api/payroll'),
      ]);

      if (invRes.status === 'fulfilled') {
        const rows = Array.isArray(invRes.value) ? invRes.value : invRes.value?.invoices || invRes.value?.data || [];
        setInvoices(rows);
      } else {
        throw invRes.reason;
      }

      if (payRes.status === 'fulfilled') {
        const pRows = Array.isArray(payRes.value) ? payRes.value : payRes.value?.payrolls || payRes.value?.data || [];
        setPayrollTotal(pRows.reduce((sum: number, p: any) => sum + Number(p.total_salary || 0), 0));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load financial report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((s, inv) => s + Number(inv.total_amount || 0), 0);
    const totalCollected = invoices.reduce((s, inv) => s + Number(inv.amount_paid || 0), 0);
    const byCustomer = new Map<string, { billed: number; collected: number; count: number }>();
    for (const inv of invoices) {
      const name = inv.customer_name || 'Walk-in / Unassigned';
      const cur = byCustomer.get(name) || { billed: 0, collected: 0, count: 0 };
      cur.billed += Number(inv.total_amount || 0);
      cur.collected += Number(inv.amount_paid || 0);
      cur.count += 1;
      byCustomer.set(name, cur);
    }
    return {
      totalBilled,
      totalCollected,
      netOperating: totalCollected - payrollTotal,
      customers: [...byCustomer.entries()].sort((a, b) => b[1].billed - a[1].billed),
    };
  }, [invoices, payrollTotal]);

  const handleExportPnLPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Profit & Loss Summary', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Invoiced Revenue: INR ${summary.totalBilled.toLocaleString('en-IN')}`, 14, 42);
    doc.text(`Total Collected Revenue: INR ${summary.totalCollected.toLocaleString('en-IN')}`, 14, 50);
    doc.text(`Recorded Payroll Expense: INR ${payrollTotal.toLocaleString('en-IN')}`, 14, 58);
    doc.setFontSize(12);
    doc.text(`Net Operating Balance: INR ${summary.netOperating.toLocaleString('en-IN')}`, 14, 70);
    doc.save('financial-pnl-summary.pdf');
    toast.success('P&L Summary PDF exported');
  };

  const handleExportRevenueCsv = () => {
    const header = 'Customer,Invoices,Total Billed,Total Collected\n';
    const rows = summary.customers
      .map(([name, d]) => `"${name.replace(/"/g, '""')}",${d.count},${d.billed.toFixed(2)},${d.collected.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-by-customer.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Revenue by Customer CSV exported');
  };

  return (
    <OwnerLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-indigo-600" /> Financial Statements &amp; Reports
            </h1>
            <p className="text-sm text-slate-500">
              Profit &amp; Loss summary and revenue breakdown by customer from live invoices and payroll.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading financial data...
          </div>
        ) : error ? (
          <Card className="p-6 text-center space-y-3 border-destructive/40">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={loadData}>Retry</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" /> Profit &amp; Loss Summary
                </CardTitle>
                <CardDescription className="text-xs">
                  Billed: ₹{summary.totalBilled.toLocaleString('en-IN')} • Collected: ₹{summary.totalCollected.toLocaleString('en-IN')} • Payroll: ₹{payrollTotal.toLocaleString('en-IN')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between text-xs" onClick={handleExportPnLPdf}>
                  <span>Export P&amp;L Summary (PDF)</span>
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" /> Revenue by Customer
                </CardTitle>
                <CardDescription className="text-xs">
                  {summary.customers.length} customer accounts across {invoices.length} invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between text-xs"
                  onClick={handleExportRevenueCsv}
                  disabled={summary.customers.length === 0}
                >
                  <span>Export Revenue Report (CSV)</span>
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
