'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, Plus, Repeat, Trash2, Play, Calendar,
  AlertCircle, CheckCircle,
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { JobPriority } from '@/lib/customerTypes';
import { formatDistanceToNow, format } from 'date-fns';

interface RecurringJob {
  id: string;
  title: string;
  description: string | null;
  priority: JobPriority;
  pattern: 'daily' | 'weekly' | 'monthly';
  next_run_at: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  last_run_at: string | null;
}

const PATTERN_CONFIG: Record<string, { label: string; className: string }> = {
  daily:   { label: 'Daily',   className: 'bg-purple-50 text-purple-700' },
  weekly:  { label: 'Weekly',  className: 'bg-purple-50 text-purple-700' },
  monthly: { label: 'Monthly', className: 'bg-purple-50 text-purple-700' },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low:    { label: 'Low',    className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', className: 'bg-blue-50 text-blue-700' },
  high:   { label: 'High',   className: 'bg-orange-50 text-orange-700' },
  urgent: { label: 'Urgent', className: 'bg-red-50 text-red-700' },
};

export default function RecurringJobsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [jobs, setJobs] = useState<RecurringJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('medium');
  const [pattern, setPattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.get<{ success: boolean; data: RecurringJob[] }>('/api/customer/recurring');
      setJobs(res.data.data ?? []);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchJobs();
  }, [isAuthenticated, fetchJobs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) { setFormError('Title is required'); return; }
    if (!startDate) { setFormError('Start date is required'); return; }

    setFormLoading(true);
    try {
      const res = await customerApi.post<{ success: boolean; data: RecurringJob }>('/api/customer/recurring', {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        pattern,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
      });
      if (res.data.success) {
        setJobs(prev => [res.data.data, ...prev]);
        setShowForm(false);
        setTitle(''); setDescription(''); setStartDate(''); setEndDate('');
        showToast('success', 'Recurring job created successfully');
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Failed to create recurring job');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id + '_cancel');
    try {
      await customerApi.delete(`/api/customer/recurring/${id}`);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, is_active: false } : j));
      showToast('success', 'Recurring job cancelled');
    } catch {
      showToast('error', 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunNow = async (id: string) => {
    setActionLoading(id + '_run');
    try {
      await customerApi.post(`/api/customer/recurring/${id}/run`, {});
      showToast('success', 'Job instance created and submitted');
      fetchJobs();
    } catch {
      showToast('error', 'Failed to trigger job');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) return null;

  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle className="h-4 w-4" />
              : <AlertCircle className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
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
                <Repeat className="h-5 w-5 text-purple-600" />
                Recurring Jobs
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Automate repeating service requests</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Recurring Job
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-xl border border-purple-200 shadow-sm p-6 mb-5"
            >
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Create Recurring Job</h2>
              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />{formError}
                </div>
              )}
              <form onSubmit={handleCreate} className="space-y-4">
                {/* Title + Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Monthly AC maintenance"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                </div>

                {/* Pattern + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Repeat</label>
                    <select
                      value={pattern}
                      onChange={e => setPattern(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as JobPriority)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Start + End dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      min={minDate}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date (optional)</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      min={startDate || minDate}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(''); }}
                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-12 text-center"
          >
            <Repeat className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">No recurring jobs yet</p>
            <p className="text-sm text-gray-500 mt-1">Set up automatic repeating service requests</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all"
            >
              Create First Recurring Job
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job, i) => {
              const priorityCfg = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium;
              const patternCfg = PATTERN_CONFIG[job.pattern] || PATTERN_CONFIG.weekly;
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-xl border p-5 transition-all ${
                    job.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title + active indicator */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${job.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{job.title}</h3>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${priorityCfg.className}`}>
                          {priorityCfg.label}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${patternCfg.className}`}>
                          {patternCfg.label}
                        </span>
                        {!job.is_active && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Cancelled</span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{job.description}</p>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          Next: {format(new Date(job.next_run_at), 'MMM d, yyyy')}
                        </span>
                        {job.last_run_at && (
                          <span className="text-gray-400">
                            Last ran {formatDistanceToNow(new Date(job.last_run_at), { addSuffix: true })}
                          </span>
                        )}
                        {job.end_date && (
                          <span className="text-gray-400">
                            Ends {format(new Date(job.end_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {job.is_active && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRunNow(job.id)}
                          disabled={actionLoading === job.id + '_run'}
                          title="Run now"
                          className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50"
                        >
                          {actionLoading === job.id + '_run'
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <Play className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleCancel(job.id)}
                          disabled={actionLoading === job.id + '_cancel'}
                          title="Cancel recurring job"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          {actionLoading === job.id + '_cancel'
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
