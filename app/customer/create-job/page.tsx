'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, ArrowLeft, AlertCircle, Calendar } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { JobPriority } from '@/lib/customerTypes';

const PRIORITIES: { value: JobPriority; label: string; description: string; activeClass: string; dotColor: string }[] = [
  { value: 'low',    label: 'Low',    description: 'Not urgent',      activeClass: 'border-gray-400 bg-gray-50',    dotColor: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', description: 'Normal priority', activeClass: 'border-blue-400 bg-blue-50',    dotColor: 'bg-blue-500' },
  { value: 'high',   label: 'High',   description: 'Needs attention', activeClass: 'border-orange-400 bg-orange-50', dotColor: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue',  activeClass: 'border-red-400 bg-red-50',      dotColor: 'bg-red-500' },
];

export default function CreateJobPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('medium');
  const [scheduledAt, setScheduledAt] = useState('');
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError('');
    setError('');

    if (!title.trim()) {
      setTitleError('Please enter a title for your request');
      return;
    }

    setIsLoading(true);
    try {
      await customerApi.post('/api/customer/jobs', {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        scheduled_at: scheduledAt || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push('/customer/dashboard'), 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to submit request. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request submitted!</h2>
            <p className="text-gray-500">Your team has been notified. Redirecting to dashboard...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const minDateTime = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />Back to dashboard
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Submit a service request</h1>
            <p className="text-gray-500 text-sm mt-1">Describe what you need and we will assign a technician.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200"
              >
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Two-column layout on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Left: Title + Description */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Request title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => { setTitle(e.target.value); setTitleError(''); }}
                      placeholder="e.g. Fix leaking pipe in bathroom"
                      disabled={isLoading}
                      className={`w-full px-4 py-2.5 text-sm text-gray-900 bg-white border rounded-lg outline-none transition-all
                        focus:ring-2 focus:border-transparent disabled:opacity-50
                        ${titleError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    {titleError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{titleError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Provide any additional details that will help the technician..."
                      rows={5}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
                    />
                  </div>
                </div>

                {/* Right: Priority + Scheduling */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Priority level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRIORITIES.map(({ value, label, description: desc, activeClass, dotColor }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPriority(value)}
                          disabled={isLoading}
                          className={`p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50 ${
                            priority === value
                              ? activeClass
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`w-2 h-2 rounded-full ${priority === value ? dotColor : 'bg-gray-300'}`} />
                            <span className="text-sm font-semibold">{label}</span>
                          </div>
                          <div className="text-xs opacity-70">{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        Schedule for later <span className="text-gray-400 font-normal">(optional)</span>
                      </span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        min={minDateTime}
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    {scheduledAt && (
                      <p className="mt-1.5 text-xs text-purple-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled for{' '}
                        {new Date(scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="sm:w-auto w-full py-2.5 px-6 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="sm:w-auto w-full py-2.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
