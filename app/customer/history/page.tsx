'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, History, CheckCircle, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobCard } from '@/components/customer/jobs/JobCard';
import { LoadingSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { Job, JobListResponse } from '@/lib/customerTypes';

interface Stats { total: number; completed: number; cancelled: number; avgProgress: number }

export default function ServiceHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, cancelled: 0, avgProgress: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchHistory = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await customerApi.get<{ success: boolean; data: JobListResponse }>(
        '/api/customer/jobs?limit=100'
      );
      const data = res.data.data ?? (res.data as any);
      const allJobs: Job[] = data.jobs ?? [];

      const completed = allJobs.filter(j => j.status === 'completed').length;
      const cancelled = allJobs.filter(j => j.status === 'cancelled').length;
      const avgProgress = allJobs.length > 0
        ? Math.round(allJobs.reduce((sum, j) => sum + (j.progress || 0), 0) / allJobs.length)
        : 0;
      setStats({ total: allJobs.length, completed, cancelled, avgProgress });
      setTotal(allJobs.length);

      let filtered = allJobs.filter(j =>
        statusFilter === 'all' ? true :
        statusFilter === 'completed' ? j.status === 'completed' :
        statusFilter === 'cancelled' ? j.status === 'cancelled' :
        j.status === statusFilter
      );

      if (dateFrom) filtered = filtered.filter(j => new Date(j.created_at) >= new Date(dateFrom));
      if (dateTo)   filtered = filtered.filter(j => new Date(j.created_at) <= new Date(dateTo + 'T23:59:59'));

      setJobs(filtered);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (isAuthenticated) fetchHistory();
  }, [isAuthenticated, fetchHistory]);

  if (authLoading || (!isAuthenticated && !authLoading)) return null;

  const summaryStats = [
    {
      label: 'Total Jobs',
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
      label: 'Avg Progress',
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
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
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary bar — 3 stats */}
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
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              onChange={e => setDateFrom(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          {(dateFrom || dateTo || statusFilter !== 'completed') && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter('completed'); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Job list */}
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
      </main>
    </div>
  );
}
