'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, History, CheckCircle, RefreshCw, BarChart2, XCircle } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobCard } from '@/components/customer/jobs/JobCard';
import { LoadingSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { Job, JobListResponse } from '@/lib/customerTypes';

interface Stats { total: number; completed: number; cancelled: number }

export default function ServiceHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, cancelled: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const hasJobsRef = useRef(false);
  hasJobsRef.current = jobs.length > 0;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  const LIMIT = 20;

  const fetchHistory = useCallback(async (p = 1, refresh = false) => {
    const requestId = ++requestSequence.current;
    if (refresh || hasJobsRef.current) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const res = await customerApi.get<{ success: boolean; data: JobListResponse }>(
        `/api/customer/jobs?page=${p}&limit=${LIMIT}`
      );
      if (!res.data?.success) throw new Error((res.data as any)?.error || 'The server returned an invalid jobs response.');
      const data = res.data.data ?? (res.data as any);
      if (!Array.isArray(data?.jobs)) throw new Error('The server returned an incomplete jobs response.');
      if (requestId !== requestSequence.current) return;
      const allJobs: Job[] = data.jobs;

      const completed = allJobs.filter(j => j.status === 'completed').length;
      const cancelled = allJobs.filter(j => j.status === 'cancelled').length;
      setStats({ total: allJobs.length, completed, cancelled });
      setTotal(Number(data.total) || 0);
      setPage(p);

      let filtered = allJobs.filter(j =>
        statusFilter === 'all' ? true :
        statusFilter === 'completed' ? j.status === 'completed' :
        statusFilter === 'cancelled' ? j.status === 'cancelled' :
        j.status === statusFilter
      );

      if (dateFrom) filtered = filtered.filter(j => new Date(j.created_at) >= new Date(dateFrom));
      if (dateTo)   filtered = filtered.filter(j => new Date(j.created_at) <= new Date(dateTo + 'T23:59:59'));

      setJobs(filtered);
    } catch (err: any) {
      if (requestId === requestSequence.current) {
        setError(err?.message || 'Could not refresh service history. Existing results are still shown.');
      }
    } finally {
      if (requestId === requestSequence.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (isAuthenticated) fetchHistory(page);
  }, [isAuthenticated, fetchHistory, page]);

  if (authLoading || (!isAuthenticated && !authLoading)) return null;

  const summaryStats = [
    {
      label: 'Requests on page',
      value: stats.total,
      icon: BarChart2,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: XCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                Service History
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{total} total requests</p>
            </div>
          </div>
          <button
            onClick={() => fetchHistory(page, true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary for the loaded page */}
        <p className="mb-2 text-[10px] text-gray-500">Counts below show the current page only.</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {summaryStats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{label}</span>
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <select
            value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="active">In Progress</option>
            <option value="open">Open</option>
          </select>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
          {(dateFrom || dateTo || statusFilter !== 'completed') && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter('completed'); setPage(1); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Job list */}
        {error && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">Showing the last loaded history. Refresh failed: {error}</p>}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <LoadingSkeleton key={i} className="h-20" />)}
          </div>
        ) : jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-12 text-center"
          >
            <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">No history found</p>
            <p className="text-sm text-gray-500 mt-1">
              {statusFilter !== 'all' ? 'Try changing the status filter' : 'Completed jobs will appear here'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </div>
        )}

        {Math.ceil(total / LIMIT) > 1 && <div className="mt-6 flex items-center justify-center gap-3"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40">Previous</button><span className="text-xs text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span><button type="button" onClick={() => setPage((current) => Math.min(Math.ceil(total / LIMIT), current + 1))} disabled={page >= Math.ceil(total / LIMIT) || isLoading} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-40">Next</button></div>}
      </main>
    </div>
  );
}
