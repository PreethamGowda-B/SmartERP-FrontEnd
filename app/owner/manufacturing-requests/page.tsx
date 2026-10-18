'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OwnerLayout } from '@/components/owner-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { ArrowLeft, Factory, Loader2, RefreshCw, Search, CheckCircle2, XCircle, MessageSquareText, Link2 } from 'lucide-react';

type RequestRow = {
  id: string; request_reference: string; customer_id: string; customer_name?: string; customer_email?: string;
  component_name: string; part_number?: string; drawing_number?: string; drawing_revision?: string;
  description: string; material_specification?: string; dimensions?: string; tolerance?: string; finish?: string;
  requested_quantity: number; unit: string; requested_completion_date?: string; status: string;
  owner_response?: string; confirmed_due_date?: string; commercial_status: string;
  production_order_id?: string; production_order_number?: string; created_at: string;
};

export default function OwnerManufacturingRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'clarification_required'>('approved');
  const [message, setMessage] = useState('');
  const [commercialStatus, setCommercialStatus] = useState('not_required');
  const [dueDate, setDueDate] = useState('');
  const [productionOrderId, setProductionOrderId] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [requestResponse, orderResponse] = await Promise.all([
        apiClient('/api/v1/customer-manufacturing-requests'),
        apiClient('/api/v1/production/orders?pageSize=100'),
      ]);
      if (!requestResponse?.success || !Array.isArray(requestResponse.data?.requests)) throw new Error(requestResponse?.error || 'Unable to load manufacturing requests.');
      setRequests(requestResponse.data.requests);
      setOrders(Array.isArray(orderResponse?.data?.orders) ? orderResponse.data.orders : []);
    } catch (cause: any) { setError(cause?.message || 'Unable to load manufacturing requests.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const review = async () => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      const response = await apiClient(`/api/v1/customer-manufacturing-requests/${selected.id}/review`, {
        method: 'POST', body: JSON.stringify({ decision, message, commercialStatus, confirmedDueDate: dueDate || null }),
      });
      if (!response?.success) throw new Error(response?.error || 'The request review was not saved.');
      setSelected(null); await load();
    } catch (cause: any) { setError(cause?.message || 'The request review was not saved.'); }
    finally { setBusy(false); }
  };

  const linkOrder = async () => {
    if (!selected || !productionOrderId) return;
    setBusy(true); setError('');
    try {
      const response = await apiClient(`/api/v1/customer-manufacturing-requests/${selected.id}/link-production-order`, {
        method: 'POST', body: JSON.stringify({ productionOrderId }),
      });
      if (!response?.success) throw new Error(response?.error || 'The production order was not linked.');
      setSelected(null); await load();
    } catch (cause: any) { setError(cause?.message || 'The production order was not linked.'); }
    finally { setBusy(false); }
  };

  const filtered = requests.filter((item) => `${item.request_reference} ${item.component_name} ${item.part_number || ''} ${item.customer_name || ''}`.toLowerCase().includes(query.toLowerCase()));

  return <OwnerLayout><main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <Link href="/owner/customer-jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} />Customer Jobs</Link>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-primary"><Factory size={18} /><span className="text-sm font-semibold">Customer Manufacturing</span></div><h1 className="mt-1 text-2xl font-bold">Manufacturing requests</h1><p className="mt-1 text-sm text-muted-foreground">Review technical requirements before any production order is created.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></div>
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
    <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search reference, component, part, or customer" /></div>
    <section className="overflow-hidden rounded-xl border bg-card"><div className="grid grid-cols-[1fr_auto] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"><span>Request / component</span><span className="hidden sm:block">Customer</span><span className="hidden sm:block">Quantity</span><span className="hidden sm:block">Status</span><span>Review</span></div>
      {loading ? <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading requests…</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No manufacturing requests found.</div> : filtered.map((item) => <button key={item.id} onClick={() => { setSelected(item); setMessage(item.owner_response || ''); setDueDate(item.confirmed_due_date?.slice(0,10) || ''); setCommercialStatus(item.commercial_status || 'not_required'); setProductionOrderId(item.production_order_id || ''); }} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b px-4 py-4 text-left last:border-0 hover:bg-muted/30 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"><span><span className="block font-mono text-xs text-muted-foreground">{item.request_reference}</span><span className="mt-1 block font-semibold">{item.component_name}</span><span className="text-xs text-muted-foreground">{item.part_number || 'Part number not supplied'}</span></span><span className="hidden text-sm sm:block">{item.customer_name || item.customer_email || item.customer_id}</span><span className="hidden text-sm tabular-nums sm:block">{item.requested_quantity} {item.unit}</span><span className="hidden sm:block"><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{item.status.replaceAll('_',' ')}</span></span><span className="text-sm font-semibold text-primary">Open</span></button>)}</section>

    {selected && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Review manufacturing request"><section className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-background p-4 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-muted-foreground">{selected.request_reference}</p><h2 className="mt-1 text-xl font-bold">{selected.component_name}</h2><p className="text-sm text-muted-foreground">{selected.customer_name || selected.customer_email} · {selected.requested_quantity} {selected.unit}</p></div><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-muted/40 p-3 text-sm"><strong>Technical description</strong><p className="mt-1 whitespace-pre-wrap">{selected.description}</p></div><div className="rounded-lg bg-muted/40 p-3 text-sm"><strong>Specifications</strong><p className="mt-1">{[['Part',selected.part_number],['Drawing',selected.drawing_number],['Revision',selected.drawing_revision],['Material',selected.material_specification],['Dimensions',selected.dimensions],['Tolerance',selected.tolerance],['Finish',selected.finish]].filter(([,value])=>value).map(([key,value])=>`${key}: ${value}`).join(' · ') || 'No additional specifications supplied'}</p></div></div>
      {selected.status === 'submitted' || selected.status === 'clarification_required' ? <div className="mt-5 space-y-3 border-t pt-4"><h3 className="font-semibold">Owner review</h3><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">Decision<select className="h-10 rounded-md border bg-background px-3" value={decision} onChange={(event) => setDecision(event.target.value as any)}><option value="approved">Approve request</option><option value="clarification_required">Request clarification</option><option value="rejected">Reject request</option></select></label><label className="grid gap-1 text-sm">Commercial terms<select className="h-10 rounded-md border bg-background px-3" value={commercialStatus} onChange={(event) => setCommercialStatus(event.target.value)}><option value="not_required">Not required</option><option value="confirmed">Confirmed separately</option><option value="pending">Pending</option></select></label><label className="grid gap-1 text-sm">Confirmed completion date<Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label className="grid gap-1 text-sm sm:col-span-2">Customer-visible response / rejection reason<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="rounded-md border bg-background p-3" placeholder="Required for clarification or rejection" /></label></div><Button onClick={() => void review()} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : decision === 'approved' ? <CheckCircle2 className="mr-2 h-4 w-4" /> : decision === 'rejected' ? <XCircle className="mr-2 h-4 w-4" /> : <MessageSquareText className="mr-2 h-4 w-4" />}Save review</Button></div> : <p className="mt-5 rounded-lg bg-muted/40 p-3 text-sm">Current status: <strong>{selected.status.replaceAll('_',' ')}</strong>{selected.owner_response ? ` · ${selected.owner_response}` : ''}</p>}
      {['approved','production_scheduled'].includes(selected.status) && <div className="mt-5 space-y-3 border-t pt-4"><h3 className="font-semibold">Production order</h3><p className="text-xs text-muted-foreground">Create an order prefilled from this approved request, or link an existing order for the same customer. The backend verifies the company and customer on either action.</p>{selected.production_order_id ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Linked: {selected.production_order_number || selected.production_order_id}</p> : <><Button variant="outline" onClick={() => router.push(`/owner/production?manufacturingRequestId=${encodeURIComponent(selected.id)}`)}><Factory className="mr-2 h-4 w-4" />Create order from this request</Button><div className="flex flex-col gap-2 sm:flex-row"><select className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3" value={productionOrderId} onChange={(event) => setProductionOrderId(event.target.value)}><option value="">Or select this customer’s existing production order</option>{orders.filter((order) => String(order.customerId) === String(selected.customer_id)).map((order) => <option value={order.id} key={order.id}>{order.orderNumber} · {order.componentName}</option>)}</select><Button onClick={() => void linkOrder()} disabled={!productionOrderId || busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}Link order</Button></div></>}</div>}
    </section></div>}
  </main></OwnerLayout>;
}
