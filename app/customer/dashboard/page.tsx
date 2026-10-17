'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight, Bell, BriefcaseBusiness, CalendarClock, CheckCircle2, Clock3,
  Cpu, FileText, History, Loader2, MessageCircle, Plus, RefreshCw,
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { Job, JobListResponse } from '@/lib/customerTypes';

const quickLinks = [
  { href: '/customer/jobs', label: 'Service requests', detail: 'Review and filter your requests', icon: BriefcaseBusiness, tone: 'blue' },
  { href: '/customer/machines', label: 'CNC machines', detail: 'View or register your machines', icon: Cpu, tone: 'violet' },
  { href: '/customer/documents', label: 'Documents', detail: 'Open shared files and invoices', icon: FileText, tone: 'green' },
  { href: '/customer/notifications', label: 'Notifications', detail: 'See recent service updates', icon: Bell, tone: 'amber' },
  { href: '/customer/history', label: 'Service history', detail: 'Browse previous work', icon: History, tone: 'slate' },
  { href: '/customer/recurring', label: 'Recurring requests', detail: 'Manage repeating service requests', icon: CalendarClock, tone: 'rose' },
];

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { customer, isLoading: authLoading, isAuthenticated } = useCustomerAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestSequence = useRef(0);

  const fetchDashboardData = useCallback(async (refresh = false) => {
    if (!isAuthenticated) return;
    const requestId = ++requestSequence.current;
    setError('');
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await customerApi.get<{ success: boolean; data: JobListResponse; error?: string | null }>('/api/customer/jobs?limit=50');
      const data = res.data?.data;
      if (!res.data?.success || !Array.isArray(data?.jobs)) throw new Error(res.data?.error || 'The service returned an incomplete request list.');
      if (requestId !== requestSequence.current) return;
      setJobs(data.jobs);
      setTotal(Number(data.total) || 0);
    } catch (err: any) {
      if (requestId === requestSequence.current) setError(err?.response?.data?.error || err?.message || 'Could not load your service requests.');
    } finally {
      if (requestId === requestSequence.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchDashboardData();
  }, [isAuthenticated, fetchDashboardData]);

  if (authLoading) return <div className="min-h-[70vh] grid place-items-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  if (!isAuthenticated) return null;

  const firstName = customer?.name?.trim().split(/\s+/)[0] || 'there';
  const pending = jobs.filter((job) => job.approval_status === 'pending_approval').length;
  const active = jobs.filter((job) => ['open', 'pending', 'active', 'in_progress'].includes(job.status) && Number(job.progress || 0) < 100).length;
  const inProgress = jobs.filter((job) => ['active', 'in_progress'].includes(job.status) && Number(job.progress || 0) < 100).length;
  const completed = jobs.filter((job) => job.status === 'completed' || Number(job.progress || 0) >= 100).length;
  const activeJobs = jobs.filter((job) => !['completed', 'closed', 'cancelled'].includes(job.status) && Number(job.progress || 0) < 100).slice(0, 5);
  const recentCompleted = jobs.filter((job) => job.status === 'completed' || Number(job.progress || 0) >= 100).slice(0, 3);
  const stats = [
    { label: 'Active requests', value: active, hint: 'Open or underway', icon: BriefcaseBusiness, tone: 'blue' },
    { label: 'Awaiting review', value: pending, hint: 'Pending company approval', icon: Clock3, tone: 'violet' },
    { label: 'In progress', value: inProgress, hint: 'Work marked underway', icon: RefreshCw, tone: 'green' },
    { label: 'Completed', value: completed, hint: 'In the latest requests', icon: CheckCircle2, tone: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CustomerNavbar />
      <main className="mx-auto w-full max-w-[1320px] px-4 pb-12 pt-7 sm:px-6 lg:px-8 lg:pt-9">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="customer-dashboard-hero mb-6 overflow-hidden rounded-[24px] border border-[#dfe7f5] bg-[linear-gradient(112deg,#fff_0%,#f5f8ff_53%,#edf2ff_100%)] px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8 sm:py-7">
          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Customer workspace</div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Welcome back, {firstName}</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Your service requests, job updates, and customer documents are in one place.</p>
              <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">{customer?.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" onClick={() => fetchDashboardData(true)} disabled={isRefreshing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
              </button>
              <Link href="/customer/create-job" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(48,86,214,.2)] transition hover:-translate-y-0.5 hover:bg-blue-700"><Plus className="h-4 w-4" />New service request</Link>
            </div>
          </div>
          <div className="customer-dashboard-orbit" aria-hidden="true"><span /><i /><b /></div>
        </motion.section>

        {error && jobs.length > 0 && <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"><span>{error} Previously loaded requests remain visible.</span><button type="button" onClick={() => fetchDashboardData(true)} className="shrink-0 font-semibold underline underline-offset-2">Try again</button></div>}

        {error && jobs.length === 0 ? <div role="alert" className="rounded-2xl border border-amber-200 bg-white p-7 text-center dark:border-amber-900/50 dark:bg-slate-900"><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Your requests couldn’t be loaded</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p><button type="button" onClick={() => fetchDashboardData(true)} className="mt-4 inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">Try again</button></div> : isLoading && jobs.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />)}</div>
        ) : (
          <>
            <section aria-label="Request summary" className="mb-9">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Request overview</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status counts are based on the latest {jobs.length} requests shown here.</p></div><Link href="/customer/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">All requests <ArrowRight size={14} /></Link></div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map(({ label, value, hint, icon: Icon, tone }, index) => <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_18px_rgba(28,46,83,.035)] dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl customer-metric-${tone}`}><Icon size={17} /></span></div><div className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</div><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{hint}</p></motion.div>)}
              </div>
            </section>

            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(290px,.8fr)]">
              <section>
                <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent service requests</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your latest requests and their current status.</p></div><Link href="/customer/jobs" className="hidden items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 sm:inline-flex dark:text-blue-300">View all <ArrowRight size={14} /></Link></div>

                {activeJobs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><BriefcaseBusiness size={21} /></span><h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">No active request in this list</h3><p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">Create a service request or open all requests to review your service history.</p><Link href="/customer/create-job" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={15} />Create request</Link></div> : <div className="space-y-3">{activeJobs.map((job, index) => {
                  const progress = Math.min(100, Math.max(0, Number(job.progress) || 0));
                  return <motion.article key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .045 }} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(28,46,83,.035)] transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-5">
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">Request · {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p><h3 className="mt-1.5 break-words text-sm font-bold text-slate-900 dark:text-white">{job.title}</h3></div><JobStatusBadge status={job.status} approvalStatus={job.approval_status} /></div>
                    {job.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{job.description}</p>}
                    {progress > 0 && <div className="mt-4"><div className="mb-1.5 flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400"><span>Work progress</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-[width] duration-500" style={{ width: `${progress}%` }} /></div></div>}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800"><span className="text-[10px] text-slate-500 dark:text-slate-400">{job.scheduled_at ? `Scheduled ${new Date(job.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : job.employee_status === 'accepted' ? 'A technician has accepted this request' : 'Updates appear here as the request progresses'}</span><Link href={`/customer/job/${job.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200"><MessageCircle size={14} />View request</Link></div>
                  </motion.article>;
                })}</div>}

                {recentCompleted.length > 0 && <div className="mt-8"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Recently completed</h3><Link href="/customer/history" className="text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300">Service history</Link></div><div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">{recentCompleted.map((job) => <Link key={job.id} href={`/customer/job/${job.id}`} className="flex min-w-0 items-center gap-3 p-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{job.title}</span><span className="mt-1 block text-[10px] text-slate-500">{job.completed_at ? new Date(job.completed_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Completed'}</span></span><ArrowRight size={15} className="shrink-0 text-slate-400" /></Link>)}</div></div>}
              </section>

              <aside className="space-y-7">
                <section><div className="mb-4"><h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Quick access</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Go directly to a customer workspace.</p></div><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">{quickLinks.map(({ href, label, detail, icon: Icon, tone }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl customer-quick-${tone}`}><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-800 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">{label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{detail}</span></span><ArrowRight size={14} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" /></Link>)}</div></section>
                <section className="rounded-2xl border border-blue-100 bg-[linear-gradient(140deg,#eef3ff,#f8faff)] p-4 dark:border-slate-800 dark:bg-slate-900"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300"><MessageCircle size={17} /></span><h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Need to add a request?</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">Share the issue and relevant machine details with your service company.</p><Link href="/customer/create-job" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 dark:text-blue-300">Create service request <ArrowRight size={14} /></Link></section>
              </aside>
            </div>
          </>
        )}
        <p className="mt-8 text-center text-[10px] text-slate-400">Showing {jobs.length} of {total} requests in your latest request list.</p>
      </main>
    </div>
  );
}
