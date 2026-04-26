'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlusCircle, Briefcase, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobCard } from '@/components/customer/jobs/JobCard';
import { DashboardSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { Job, JobListResponse } from '@/lib/customerTypes';

interface StatusCounts { open: number; active: number; completed: number; cancelled: number }

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' } }),
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { customer, isLoading: authLoading, isAuthenticated } = useCustomerAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({ open: 0, active: 0, completed: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await customerApi.get<JobListResponse>('/api/customer/jobs?limit=20');
        const allJobs = res.data.jobs;
        setJobs(allJobs.slice(0, 5));
        const c: StatusCounts = { open: 0, active: 0, completed: 0, cancelled: 0 };
        allJobs.forEach((j) => {
          if (j.status === 'open' || j.status === 'pending') c.open++;
          else if (j.status === 'active' || j.status === 'in_progress') c.active++;
          else if (j.status === 'completed') c.completed++;
          else if (j.status === 'cancelled') c.cancelled++;
        });
        setCounts(c);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold">P</span>
          </div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const STATS = [
    { label: 'Open Requests', value: counts.open, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'In Progress', value: counts.active, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Completed', value: counts.completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  ];

  const firstName = customer?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Good day, {firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here is an overview of your service requests
          </p>
        </motion.div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Stats */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              {STATS.map(({ label, value, icon: Icon, color, bg, border }) => (
                <div key={label} className={`bg-white rounded-xl border ${border} p-5 hover:shadow-sm transition-shadow`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </motion.div>

            {/* Recent jobs */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
                  <p className="text-sm text-gray-500">Your 5 most recent service requests</p>
                </div>
                <button
                  onClick={() => router.push('/customer/create-job')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  New Request
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">No requests yet</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                    Submit your first service request and we will get someone on it right away.
                  </p>
                  <button
                    onClick={() => router.push('/customer/create-job')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Submit first request
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      variants={fadeUp} initial="hidden" animate="visible" custom={3 + i * 0.5}
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}

                  {counts.open + counts.active + counts.completed + counts.cancelled > 5 && (
                    <button
                      onClick={() => router.push('/customer/jobs')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-600 hover:text-gray-900 transition-all"
                    >
                      View all requests
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
