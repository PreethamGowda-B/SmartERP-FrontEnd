'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Factory, Loader2, Plus, RefreshCw, Send } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';

type ManufacturingRequest = {
  id: string; requestReference: string; componentName: string; partNumber?: string | null;
  requestedQuantity: number; unit: string; status: string; description: string;
  confirmedDueDate?: string | null; ownerResponse?: string | null;
  productionOrder?: { orderNumber?: string; status?: string; acceptedQuantity?: number; dispatchedQuantity?: number } | null;
  invoice?: { id: string; invoiceNumber: string; status: string; amount: number; issuedAt: string } | null;
  createdAt: string; updatedAt: string;
};
type ManufacturingEvent = { event_type: string; message?: string | null; created_at: string; to_status?: string | null };

const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CustomerManufacturingRequestsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [requests, setRequests] = useState<ManufacturingRequest[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState('');
  const [eventsByRequest, setEventsByRequest] = useState<Record<string, ManufacturingEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const idempotencyRef = useRef<{ signature: string; key: string } | null>(null);
  const [form, setForm] = useState({ componentName: '', partNumber: '', description: '', intendedApplication: '', materialSpecification: '', dimensions: '', tolerance: '', finish: '', drawingNumber: '', drawingRevision: '', requestedQuantity: '1', unit: 'pcs', requestedCompletionDate: '', deliveryPreference: 'to_confirm', instructions: '' });

  useEffect(() => { if (!authLoading && !isAuthenticated) router.push('/customer/login'); }, [authLoading, isAuthenticated, router]);
  const loadRequests = useCallback(async () => {
    try {
      setError('');
      const response = await customerApi.get('/api/customer/manufacturing-requests');
      const data = response.data?.data?.requests;
      if (!Array.isArray(data)) throw new Error('Manufacturing requests are temporarily unavailable.');
      setRequests(data);
    } catch (cause: any) { setError(cause?.response?.data?.error || cause?.message || 'Unable to load manufacturing requests.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isAuthenticated) void loadRequests(); }, [isAuthenticated, loadRequests]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadRequests();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, loadRequests]);

  const toggleTimeline = async (requestId: string) => {
    if (expandedRequestId === requestId) { setExpandedRequestId(''); return; }
    setExpandedRequestId(requestId);
    if (eventsByRequest[requestId]) return;
    try {
      const response = await customerApi.get(`/api/customer/manufacturing-requests/${encodeURIComponent(requestId)}`);
      const events = response.data?.data?.events;
      if (Array.isArray(events)) setEventsByRequest((current) => ({ ...current, [requestId]: events }));
    } catch (cause: any) {
      setError(cause?.response?.data?.error || 'Unable to load request activity.');
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setReference('');
    if (!form.componentName.trim() || !form.description.trim() || !(Number(form.requestedQuantity) > 0)) {
      setError('Enter a component name, description, and a quantity greater than zero.'); return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, requestedQuantity: Number(form.requestedQuantity), requestedCompletionDate: form.requestedCompletionDate || null };
      const signature = JSON.stringify(payload);
      if (!idempotencyRef.current || idempotencyRef.current.signature !== signature) {
        idempotencyRef.current = { signature, key: crypto.randomUUID() };
      }
      const response = await customerApi.post('/api/customer/manufacturing-requests', {
        ...payload,
      }, { headers: { 'Idempotency-Key': idempotencyRef.current.key } });
      const request = response.data?.data;
      if (!response.data?.success || !request?.requestReference) throw new Error(response.data?.error || 'The request was not confirmed by the server.');
      setReference(request.requestReference);
      idempotencyRef.current = null;
      setForm({ componentName: '', partNumber: '', description: '', intendedApplication: '', materialSpecification: '', dimensions: '', tolerance: '', finish: '', drawingNumber: '', drawingRevision: '', requestedQuantity: '1', unit: 'pcs', requestedCompletionDate: '', deliveryPreference: 'to_confirm', instructions: '' });
      await loadRequests();
    } catch (cause: any) { setError(cause?.response?.data?.error || cause?.message || 'The request could not be submitted.'); }
    finally { setSubmitting(false); }
  };

  if (authLoading || !isAuthenticated) return null;
  const field = (key: keyof typeof form, title: string, required = false, type = 'text') => (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700" key={key}>{title}{required && <span className="text-rose-600"> *</span>}
      <input required={required} type={type} step={type === 'number' ? '0.001' : undefined} min={type === 'number' ? '0.001' : undefined} maxLength={type === 'text' ? 2000 : undefined} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </label>
  );

  return <div className="min-h-screen bg-slate-50"><CustomerNavbar /><main className="mx-auto max-w-6xl space-y-8 px-4 py-7 sm:px-6 lg:px-8">
    <Link href="/customer/jobs" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700"><ArrowLeft size={16} />Back to requests</Link>
    <header><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-blue-700"><Factory /></span><div><p className="text-sm font-medium text-blue-700">Customer Portal</p><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Component manufacturing</h1></div></div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Submit a component specification for the company to review. Production starts only after the Owner approves the request.</p></header>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
    {reference && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Request received. Reference: <strong>{reference}</strong>. It is awaiting company review.</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-lg font-semibold text-slate-900">Request a component</h2><p className="mt-1 text-sm text-slate-500">Fields marked * are required. Do not include sensitive information in the instructions.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {field('componentName', 'Component name', true)}{field('partNumber', 'Part number')}{field('drawingNumber', 'Drawing number')}{field('drawingRevision', 'Drawing revision')}{field('materialSpecification', 'Material')}{field('dimensions', 'Dimensions')}{field('tolerance', 'Tolerance')}{field('finish', 'Surface finish')}{field('intendedApplication', 'Intended application')}{field('requestedQuantity', 'Quantity', true, 'number')}{field('unit', 'Unit', true)}{field('requestedCompletionDate', 'Requested completion date', false, 'date')}
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">Delivery preference<select value={form.deliveryPreference} onChange={(event) => setForm({ ...form, deliveryPreference: event.target.value })} className="h-10 rounded-lg border border-slate-200 bg-white px-3"><option value="to_confirm">To confirm</option><option value="delivery">Delivery</option><option value="pickup">Pickup</option></select></label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Technical description *<textarea required maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Additional instructions<textarea maxLength={3000} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} rows={3} className="rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs text-slate-500">Drawing and CAD uploads are not enabled in this form yet.</p><button disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />}Submit request</button></div>
      </form>
    </section>
    <section className="space-y-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Your manufacturing requests</h2><p className="text-sm text-slate-500">Progress comes from recorded review, production, invoice, and dispatch activity.</p></div><button onClick={() => void loadRequests()} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-sm"><RefreshCw size={14} />Refresh</button></div>
      {loading ? <div className="rounded-xl border bg-white p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading requests…</div> : requests.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500"><Plus className="mx-auto mb-2 h-5 w-5" />No manufacturing requests yet.</div> : <div className="grid gap-3 md:grid-cols-2">{requests.map((request) => <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-mono text-xs text-slate-500">{request.requestReference}</p><h3 className="mt-1 font-semibold text-slate-900">{request.componentName}</h3>{request.partNumber && <p className="text-xs text-slate-500">Part {request.partNumber}</p>}</div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{label(request.status)}</span></div><p className="mt-3 text-sm text-slate-600">{request.requestedQuantity} {request.unit} · Updated {new Date(request.updatedAt).toLocaleString()}</p>{request.ownerResponse && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Company update: {request.ownerResponse}</p>}{request.productionOrder && <p className="mt-3 text-sm text-slate-700">Production {request.productionOrder.orderNumber} · {label(request.productionOrder.status || '')} · Accepted {request.productionOrder.acceptedQuantity || 0} · Dispatched {request.productionOrder.dispatchedQuantity || 0}</p>}{request.invoice ? <Link className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline" href={`/customer/invoices/${request.invoice.id}`}>Invoice {request.invoice.invoiceNumber} · {request.invoice.status}</Link> : <p className="mt-3 text-xs text-slate-500">Invoice will appear here after it is issued.</p>}<button type="button" onClick={() => void toggleTimeline(request.id)} className="mt-3 text-sm font-semibold text-blue-700 hover:underline">{expandedRequestId === request.id ? 'Hide activity' : 'View activity'}</button>{expandedRequestId === request.id && <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">{(eventsByRequest[request.id] || []).length ? eventsByRequest[request.id].map((event, index) => <li key={`${event.event_type}-${event.created_at}-${index}`} className="relative text-sm"><span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" /><p className="font-medium text-slate-800">{label(event.event_type)}</p>{event.message && <p className="text-slate-600">{event.message}</p>}<time className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</time></li>) : <li className="text-sm text-slate-500">Loading activity or no activity recorded yet.</li>}</ol>}</article>)}</div>}
    </section>
  </main></div>;
}
