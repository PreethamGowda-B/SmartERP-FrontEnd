'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { JobPriority } from '@/lib/customerTypes';

const PRIORITIES: { value: JobPriority; label: string; color: string }[] = [
  { value: 'low',    label: 'Low',    color: 'text-slate-400' },
  { value: 'medium', label: 'Medium', color: 'text-blue-400' },
  { value: 'high',   label: 'High',   color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
];

export default function CreateJobPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<JobPriority>('medium');
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/customer/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError('');
    setError('');

    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    setIsLoading(true);

    try {
      await customerApi.post('/api/customer/jobs', {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });

      setSuccess(true);
      setTimeout(() => router.push('/customer/dashboard'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950">
        <CustomerNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Job submitted!</h2>
            <p className="text-white/50 mt-2">The team has been notified.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950">
      <CustomerNavbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">Submit a new job</h1>
          <p className="text-white/40 text-sm mb-8">Describe what you need and we&apos;ll get someone on it.</p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide">
                  Job title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
                  placeholder="e.g. Fix leaking pipe in bathroom"
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-2 disabled:opacity-50
                    ${titleError ? 'border-red-500 focus:ring-red-500/30' : 'border-white/20 focus:ring-indigo-500/30 focus:border-indigo-500'}`}
                />
                {titleError && (
                  <p className="mt-1 text-xs text-red-400">{titleError}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wide">
                  Description <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional details..."
                  rows={4}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs text-white/50 mb-2 font-medium uppercase tracking-wide">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPriority(value)}
                      disabled={isLoading}
                      className={`py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50
                        ${priority === value
                          ? 'border-indigo-500 bg-indigo-600/20 text-white'
                          : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
                        }`}
                    >
                      <span className={priority === value ? 'text-white' : color}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Submitting...' : 'Submit job'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
