'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Send, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function OwnerAccountsReceivablePage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState<any>({ current: 0, '1_30': 0, '31_60': 0, '60_plus': 0 });
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    fetchARAging();
  }, []);

  const fetchARAging = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; buckets: any; schedules: any[] }>('/api/finance/ar-aging');
      if (res && res.success) {
        setBuckets(res.buckets);
        setSchedules(res.schedules);
      }
    } catch (err: any) {
      toast({ title: 'Error loading AR aging', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-600" /> Accounts Receivable Aging & Reminders
          </h1>
          <p className="text-sm text-slate-500">
            Track invoice aging buckets, automated collection schedules, and customer reminders.
          </p>
        </div>
      </div>

      {/* Aging Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">Current (Not Due)</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">₹{Number(buckets.current || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">1 – 30 Days Overdue</div>
            <div className="text-xl font-extrabold text-amber-700 mt-1">₹{Number(buckets['1_30'] || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">31 – 60 Days Overdue</div>
            <div className="text-xl font-extrabold text-orange-700 mt-1">₹{Number(buckets['31_60'] || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">60+ Days Overdue</div>
            <div className="text-xl font-extrabold text-red-700 mt-1">₹{Number(buckets['60_plus'] || 0).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Schedules Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Collection Tracking Schedules</CardTitle>
          <CardDescription className="text-xs">Live tracking of outstanding customer balances</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No outstanding collection schedules.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4 text-right">Invoice Total (₹)</th>
                    <th className="p-4 text-right">Outstanding (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{s.customer_name}</div>
                        <div className="text-xs text-slate-500">{s.customer_phone || s.customer_email || 'Direct Client'}</div>
                      </td>
                      <td className="p-4 text-slate-600">{new Date(s.due_date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="uppercase text-xs font-mono">
                          {s.current_stage || 'pre_due'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right text-slate-700">₹{Number(s.invoice_amount).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-right font-extrabold text-amber-700">
                        ₹{Number(s.amount_outstanding).toLocaleString('en-IN')}
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
