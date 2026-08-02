'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Calculator, 
  User, 
  Calendar, 
  DollarSign, 
  Building, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface LineItem {
  id?: string;
  item_type: 'labour' | 'material' | 'equipment' | 'transport' | 'extra';
  description: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export default function DedicatedInvoiceEditorPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobData, setJobData] = useState<any>(null);

  // Form State
  const [labourHours, setLabourHours] = useState<number>(8);
  const [labourRate, setLabourRate] = useState<number>(500);
  const [equipmentCharges, setEquipmentCharges] = useState<number>(0);
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 15 Days');
  const [dueDays, setDueDays] = useState<number>(15);
  const [customerNotes, setCustomerNotes] = useState<string>('Thank you for your business!');
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (jobId) {
      fetchEditorData();
    }
  }, [jobId]);

  const fetchEditorData = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success: boolean; job: any; prefilled: any }>(`/api/invoices/editor-data/${jobId}`);
      if (res && res.success) {
        setJobData(res.job);
        const p = res.prefilled;
        setLabourHours(p.labour_hours || 8);
        setLabourRate(p.labour_rate || 500);
        setEquipmentCharges(p.equipment_charges || 0);
        setTransportCharges(p.transport_charges || 0);
        setAdditionalCharges(p.additional_charges || 0);
        setDiscountAmount(p.discount_amount || 0);
        setGstRate(p.gst_rate || 18);
        setIsInterState(p.is_inter_state || false);
        setDueDays(p.due_days || 15);

        // Pre-fill line items
        const initialItems: LineItem[] = [
          {
            item_type: 'labour',
            description: 'Labour & Technical Charges',
            hsn_code: '998311',
            quantity: p.labour_hours || 8,
            unit_price: p.labour_rate || 500,
            total_amount: (p.labour_hours || 8) * (p.labour_rate || 500),
          },
        ];

        if (p.materials_used && p.materials_used.length > 0) {
          p.materials_used.forEach((m: any) => {
            initialItems.push({
              item_type: 'material',
              description: `Material: ${m.item_name}`,
              hsn_code: '998311',
              quantity: m.quantity || 1,
              unit_price: m.unit_cost || 150,
              total_amount: (m.quantity || 1) * (m.unit_cost || 150),
            });
          });
        }

        setLineItems(initialItems);
      }
    } catch (err: any) {
      toast({
        title: 'Error loading job invoice editor',
        description: err.message || 'Could not fetch prefilled job data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        item_type: 'extra',
        description: 'New Line Item',
        hsn_code: '998311',
        quantity: 1,
        unit_price: 100,
        total_amount: 100,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const handleUpdateLineItem = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };

    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(item.quantity as any) || 0;
      const p = parseFloat(item.unit_price as any) || 0;
      item.total_amount = parseFloat((q * p).toFixed(2));
    }

    updated[index] = item;
    setLineItems(updated);
  };

  // Computations
  const computedLabourCost = parseFloat((labourHours * labourRate).toFixed(2));
  const computedMaterialsCost = lineItems
    .filter((i) => i.item_type === 'material')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const subtotal = Math.max(
    0,
    parseFloat(
      (
        lineItems.reduce((sum, i) => sum + (i.total_amount || 0), 0) +
        equipmentCharges +
        transportCharges +
        additionalCharges -
        discountAmount
      ).toFixed(2)
    )
  );

  const totalTax = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal + totalTax).toFixed(2));

  const handleFinalizeInvoice = async () => {
    try {
      setSaving(true);

      const payload = {
        jobId,
        labour_hours: labourHours,
        labour_rate: labourRate,
        equipment_charges: equipmentCharges,
        transport_charges: transportCharges,
        additional_charges: additionalCharges,
        discount_amount: discountAmount,
        gst_rate: gstRate,
        is_inter_state: isInterState,
        due_days: dueDays,
        payment_terms: paymentTerms,
        customer_notes: customerNotes,
        internal_notes: internalNotes,
        lineItems,
      };

      const res = await apiClient<{ success: boolean; invoice?: any; reason?: string; error?: string }>('/api/invoices/finalize', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && (res.success || res.invoice)) {
        const invNum = res.invoice?.invoice_number || 'INV-2026-0001';
        const isEdit = res.reason === 'invoice_updated';
        toast({
          title: isEdit ? `Invoice Updated (Edited ${res.edited_count || 1}x) 📄` : 'Invoice Finalized & Issued! 💰',
          description: `Invoice ${invNum} saved successfully. Returning to jobs...`,
        });
        setTimeout(() => {
          router.push('/owner/jobs');
        }, 500);
      } else {
        toast({
          title: 'Finalization Issue',
          description: res?.error || 'Could not finalize invoice',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Finalization Failed',
        description: err.message || 'Could not finalize invoice',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-600 font-medium">Loading Job Invoice Editor...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
            onClick={() => router.push('/owner/jobs')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" /> Invoice Editor
            </h1>
            <p className="text-sm text-slate-500">
              Review and finalize billing for completed job: <span className="font-semibold text-slate-700">{jobData?.title}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-3 py-1">
            Job Completed
          </Badge>
          <Button onClick={handleFinalizeInvoice} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Finalize & Issue Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Job Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" /> Client & Service Info
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-slate-500">Customer Name</Label>
                <div className="font-semibold text-slate-900">{jobData?.customer_name}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Contact Details</Label>
                <div className="text-slate-700">{jobData?.customer_email || jobData?.customer_phone || 'N/A'}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Job Title</Label>
                <div className="font-medium text-slate-900">{jobData?.title}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Completion Timestamp</Label>
                <div className="text-slate-700">{jobData?.completed_at ? new Date(jobData.completed_at).toLocaleString() : 'Just now'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items & Charges Table Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Billing Line Items</CardTitle>
                <CardDescription className="text-xs">Customize labor, materials, and additional charges</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Line Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b text-xs font-semibold uppercase">
                    <tr>
                      <th className="p-3">Type / Description</th>
                      <th className="p-3 w-24">HSN</th>
                      <th className="p-3 w-20 text-center">Qty / Hrs</th>
                      <th className="p-3 w-28 text-right">Rate (₹)</th>
                      <th className="p-3 w-28 text-right">Total (₹)</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 space-y-1">
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="Description"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.hsn_code}
                            onChange={(e) => handleUpdateLineItem(idx, 'hsn_code', e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem(idx, 'quantity', parseFloat(e.target.value))}
                            className="h-8 text-xs text-center"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleUpdateLineItem(idx, 'unit_price', parseFloat(e.target.value))}
                            className="h-8 text-xs text-right"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-900">
                          ₹{Number(item.total_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-center">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleRemoveLineItem(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expenses & Discounts Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Additional Charges & Discounts</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Equipment Charges (₹)</Label>
                <Input
                  type="number"
                  value={equipmentCharges}
                  onChange={(e) => setEquipmentCharges(parseFloat(e.target.value) || 0)}
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Transport Fees (₹)</Label>
                <Input
                  type="number"
                  value={transportCharges}
                  onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Extra Fee (₹)</Label>
                <Input
                  type="number"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Discount (₹)</Label>
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="h-9 mt-1 text-emerald-600 font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Terms & Customer Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Payment Due Days</Label>
                  <Select value={String(dueDays)} onValueChange={(val) => setDueDays(parseInt(val))}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due Immediately</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="15">15 Days (Standard)</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Payment Terms Text</Label>
                  <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="h-9 mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes to Customer (Appears on Invoice)</Label>
                <Textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={2} className="mt-1 text-xs" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Calculation Summary Panel */}
        <div className="space-y-6">
          <Card className="sticky top-6 border-indigo-200 bg-indigo-50/20">
            <CardHeader className="border-b bg-indigo-50/50 pb-3">
              <CardTitle className="text-base font-bold text-indigo-900 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-600" /> Invoice Calculation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Line Items + Charges):</span>
                <span className="font-medium text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* GST Config */}
              <div className="border-t pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-700">Interstate Transaction (IGST)?</Label>
                  <Switch checked={isInterState} onCheckedChange={setIsInterState} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-700">GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                    className="h-8 w-20 text-right text-xs"
                  />
                </div>

                {isInterState ? (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>IGST ({gstRate}%):</span>
                    <span className="font-medium text-slate-900">₹{totalTax.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>CGST ({(gstRate / 2)}%):</span>
                      <span className="font-medium text-slate-900">₹{(totalTax / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>SGST ({(gstRate / 2)}%):</span>
                      <span className="font-medium text-slate-900">₹{(totalTax / 2).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1">
                  <span>Total Tax:</span>
                  <span>₹{totalTax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-base text-slate-900">Total Payable:</span>
                <span className="font-extrabold text-2xl text-indigo-600">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-indigo-50/50 border-t p-4 flex flex-col gap-2">
              <Button onClick={handleFinalizeInvoice} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Finalize & Issue Invoice
              </Button>
              <p className="text-[11px] text-center text-slate-500">
                Finalizing generates Inv #, PDF, AR Schedule, and publishes to Customer Portal automatically.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
