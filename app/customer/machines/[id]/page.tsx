'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Clock3, Cpu, Loader2 } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';

const EMPTY_TIMELINE_FALLBACK = 'CNC Machine registered into SmartERP customer registry';

export default function CustomerMachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const machineId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [machine, setMachine] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !machineId) return;
    setLoading(true);
    setError('');
    try {
      const res = await customerApi.get<{ success: boolean; machine: any }>(`/api/customer/machines/${encodeURIComponent(machineId)}`);
      if (!res.data?.success || !res.data.machine) throw new Error('Machine details could not be loaded.');
      setMachine(res.data.machine);
      try {
        const timelineResponse = await customerApi.get<{ success: boolean; timeline: any[] }>(`/api/customer/machines/${encodeURIComponent(machineId)}/timeline`);
        const events = Array.isArray(timelineResponse.data?.timeline) ? timelineResponse.data.timeline : [];
        setTimeline(events.filter((event) => !(String(event.id) === '1' && event.title === 'Machine Registered' && event.description === EMPTY_TIMELINE_FALLBACK)));
      } catch {
        setTimeline([]);
        setError('Machine details loaded, but service history could not be retrieved.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Unable to load machine details.');
      setMachine(null);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, machineId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <Link href="/customer/machines" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-900"><ArrowLeft size={16} />My machines</Link>
        {error && <div role="alert" className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"><span>{error}</span><button type="button" onClick={() => void fetchData()} className="shrink-0 font-semibold underline underline-offset-2">Retry</button></div>}
        {loading ? <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div> : !machine ? <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center dark:border-slate-800 dark:bg-slate-900"><AlertCircle className="mx-auto h-9 w-9 text-slate-400" /><h1 className="mt-3 text-base font-bold text-slate-900 dark:text-white">Machine details unavailable</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Check the machine list or try loading this page again.</p><Link href="/customer/machines" className="mt-4 inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">Back to machines</Link></div> : <>
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[linear-gradient(120deg,#111a2d,#1a2c50)] p-5 text-white shadow-lg sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex min-w-0 items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-blue-200"><Cpu size={21} /></span><span className="min-w-0"><h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">{machine.machine_name}</h1><p className="mt-1 break-words text-xs leading-5 text-slate-300">Serial {machine.serial_number || 'not provided'} · {machine.make || 'Make unavailable'} {machine.model || ''}</p></span></div><span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold capitalize">{machine.status === 'operational' ? 'Registered' : machine.status ? String(machine.status).replaceAll('_', ' ') : 'Status unavailable'}</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-3"><div><p className="text-slate-400">Controller</p><p className="mt-1 font-semibold text-white">{machine.controller_type || 'Not provided'}</p></div><div><p className="text-slate-400">Spindle hours</p><p className="mt-1 font-semibold text-white">{machine.spindle_hours == null ? 'Not provided' : `${machine.spindle_hours} hours`}</p></div><div><p className="text-slate-400">Registered</p><p className="mt-1 font-semibold text-white">{machine.created_at ? new Date(machine.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Date unavailable'}</p></div></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_5px_25px_rgba(28,46,83,.035)] sm:p-7 dark:border-slate-800 dark:bg-slate-900"><div className="mb-6 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Clock3 size={18} /></span><span><h2 className="text-base font-bold text-slate-900 dark:text-white">Service history</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Customer-visible service timeline for this registered machine.</p></span></div>
            {timeline.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700"><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No service history entries</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Recorded service events will appear here when available.</p></div> : <ol className="relative ml-3 space-y-6 border-l border-slate-200 pl-6 dark:border-slate-700">{timeline.map((event, index) => <li key={event.id || index} className="relative"><span className="absolute -left-[30px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-blue-600 ring-4 ring-blue-50 dark:border-slate-900 dark:ring-blue-950"><span className="h-1 w-1 rounded-full bg-white" /></span><div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start"><h3 className="text-sm font-bold text-slate-900 dark:text-white">{event.title || 'Service update'}</h3>{(event.timestamp || event.created_at) && <time className="text-[10px] text-slate-500 dark:text-slate-400" dateTime={event.timestamp || event.created_at}>{new Date(event.timestamp || event.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>}</div>{event.description && <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{event.description}</p>}</li>)}</ol>}
          </section>
        </>}
      </main>
    </div>
  );
}
