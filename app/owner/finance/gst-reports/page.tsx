'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function OwnerGSTReportsPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<any>({ subtotal: '0', cgst: '0', sgst: '0', igst: '0', total_tax: '0' });
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchGSTSummary();
  }, []);

  const fetchGSTSummary = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; totals: any; invoices: any[] }>('/api/finance/gst-summary');
      if (res && res.success) {
        setTotals(res.totals);
        setInvoices(res.invoices);
      }
    } catch (err: any) {
      toast({ title: 'Error loading GST summary', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-600" /> Statutory GST Reports & Tax Liabilities
          </h1>
          <p className="text-sm text-slate-500">
            GSTR-1 Sales Report breakdown, CGST/SGST/IGST tax accruals for Indian statutory compliance.
          </p>
        </div>
      </div>

      {/* Tax Split Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Tax Liability</div>
            <div className="text-2xl font-extrabold text-purple-700 mt-1">₹{Number(totals.total_tax).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">CGST (Intrastate Central)</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">₹{Number(totals.cgst).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">SGST (Intrastate State)</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">₹{Number(totals.sgst).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">IGST (Interstate)</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">₹{Number(totals.igst).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* GSTR-1 Sales Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">GSTR-1 Sales Ledger</CardTitle>
          <CardDescription className="text-xs">Outward supply invoices for statutory filing</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No tax invoices recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-4">Invoice # / Date</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4 text-right">Taxable Value (₹)</th>
                    <th className="p-4 text-right">CGST</th>
                    <th className="p-4 text-right">SGST</th>
                    <th className="p-4 text-right">IGST</th>
                    <th className="p-4 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono text-xs font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="p-4 font-medium text-slate-800">{inv.customer_name || 'Client'}</td>
                      <td className="p-4 text-right font-semibold text-slate-900">₹{Number(inv.subtotal).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-slate-600">₹{Number(inv.cgst).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-slate-600">₹{Number(inv.sgst).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right text-slate-600">₹{Number(inv.igst).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right font-bold text-purple-700">₹{Number(inv.total_tax).toLocaleString('en-IN')}</td>
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
