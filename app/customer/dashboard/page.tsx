'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlusCircle, Briefcase, CheckCircle, Clock, XCircle } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobCard } from '@/components/customer/jobs/JobCard';
import { DashboardSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { Job, JobListResponse } from '@/lib/customerTypes';

interface StatusCounts {
  open: number;
  active: number;
  completed: number;
  cancelled: number;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { customer, isLoading: authLoading, isAuthenticated } = useCustomerAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({ open: 0, active: 0, completed: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated (only after auth state is fully loaded)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/customer/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Don't render anything while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <p className="text-white/40 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (redirect will happen via useEffect)
  if (!isAuthenticated) {
    return null;
  }

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

  const STATS = [
    { label: 'Open', value: counts.open, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active', value: counts.active, icon: Briefcase, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Completed', value: counts.completed, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950">
      <CustomerNavbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white">
            Welcome back{customer?.name ? `, ${customer.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-white/40 text-sm mt-1">Here&apos;s an overview of your service requests</p>
        </motion.div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              {STATS.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>

            {/* Recent jobs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Recent Jobs</h2>
                <button
                  onClick={() => router.push('/customer/create-job')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  New Job
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                  <Briefcase className="h-10 w-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No jobs yet</p>
                  <button
                    onClick={() => router.push('/customer/create-job')}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
                  >
                    Submit your first job
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
