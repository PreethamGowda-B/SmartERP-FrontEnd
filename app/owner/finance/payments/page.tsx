'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText, 
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function OwnerPaymentsPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  // Record Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; payments: any[] }>('/api/finance/payments');
      if (res && res.success) {
        setPayments(res.payments);
      }
    } catch (err: any) {
      toast({ title: 'Error loading payments', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async () => {
    try {
      const res = await apiClient<{ success: boolean; invoices: any[] }>('/api/invoices?status=issued');
      if (res && res.success) {
        setInvoicesList(res.invoices);
        setModalOpen(true);
      }
    } catch (err: any) {
      toast({ title: 'Error loading invoices', description: err.message, variant: 'destructive' });
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoiceId || !amount) {
      toast({ title: 'Invoice and amount are required', variant: 'destructive' });
      return;
    }

    try {
      setRecording(true);
      const res = await apiClient<{ success: boolean }>('/api/finance/payments/record', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          paymentMethod,
          transactionReference: transactionRef,
          amount: parseFloat(amount),
          notes,
        }),
      });

      if (res && res.success) {
        toast({ title: 'Payment Recorded! 💰', description: 'Invoice status updated and AR schedule settled.' });
        setModalOpen(false);
        fetchPayments();
      }
    } catch (err: any) {
      toast({ title: 'Recording failed', description: err.message, variant: 'destructive' });
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600" /> Payments Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Log and view all customer payments (Razorpay, Cash, Bank Transfer, Cheque, UPI).
          </p>
        </div>
        <Button onClick={handleOpenModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <Plus className="h-4 w-4 mr-1.5" /> Record Payment
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b text-xs font-semibold uppercase">
                  <tr>
                    <th className="p-4">Payment Date</th>
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Txn Ref</th>
                    <th className="p-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td className="p-4 font-mono font-semibold text-slate-900">{p.invoice_number || 'INV-2026'}</td>
                      <td className="p-4 font-medium text-slate-800">{p.customer_name || 'Client'}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="uppercase text-xs font-semibold">
                          {p.payment_method}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500">{p.transaction_reference || 'N/A'}</td>
                      <td className="p-4 text-right font-extrabold text-emerald-700">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CreditCard className="h-5 w-5" /> Record Customer Payment
            </DialogTitle>
            <DialogDescription>
              Record an offline or online payment against an issued job invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div>
              <Label>Select Issued Invoice</Label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose Invoice..." />
                </SelectTrigger>
                <SelectContent>
                  {invoicesList.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.customer_name} (₹{inv.total_amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer (NEFT/IMPS)</SelectItem>
                    <SelectItem value="upi">UPI / GPay / PhonePe</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="razorpay">Razorpay Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount Received (₹)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Transaction Reference / Cheque #</Label>
              <Input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="e.g. UTR / Ref No" className="mt-1 font-mono text-xs" />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment remarks..." rows={2} className="mt-1 text-xs" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={recording} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {recording ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
