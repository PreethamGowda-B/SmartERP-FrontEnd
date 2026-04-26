'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { JobPriority } from '@/lib/customerTypes';

const PRIORITIES: { value: JobPriority; label: string; description: string; className: string; activeClass: string }[] = [
  { value: 'low',    label: 'Low',    description: 'Not urgent',     className: 'border-gray-200 text-gray-600',   activeClass: 'border-gray-400 bg-gray-50 text-gray-900' },
  { value: 'medium', label: 'Medium', description: 'Normal priority', className: 'border-gray-200 text-gray-600',  activeClass: 'border-blue-400 bg-blue-50 text-blue-900' },
  { value: 'high',   label: 'High',   description: 'Needs attention', className: 'border-gray-200 text-gray-600',  activeClass: 'border-orange-400 bg-orange-50 text-orange-900' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue',  className: 'border-gray-200 text-gray-600',  activeClass: 'border-red-400 bg-red-50 text-red-900' },
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
      });
      setSuccess(true);
      setTimeout(() => router.push('/customer/dashboard'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit request. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Back */}
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
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
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
                  placeholder="e.g. Fix leaking pipe in bathroom"
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 text-sm text-gray-900 bg-white border rounded-lg outline-none transition-all
                    focus:ring-2 focus:border-transparent disabled:opacity-50
                    ${titleError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                {titleError && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {titleError}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional details that will help the technician..."
                  rows={4}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Priority level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITIES.map(({ value, label, description: desc, className, activeClass }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPriority(value)}
                      disabled={isLoading}
                      className={`p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50
                        ${priority === value ? activeClass : `${className} hover:border-gray-300`}`}
                    >
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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
