'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import {
  PlusCircle, Briefcase, CheckCircle, Clock, TrendingUp, ArrowRight,
  AlertCircle, Bell, History, Repeat, List, Activity, User, MapPin,
  Zap, Eye,
} from 'lucide-react';
import Link from 'next/link';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import { DashboardSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { Job, JobListResponse } from '@/lib/customerTypes';
import { ErrorView } from "@/components/ui/error-view"
import { SkeletonList } from "@/components/ui/skeleton-card"
import { cn } from "@/lib/utils"

interface StatusCounts {
  pending_approval: number;
  active: number;
  in_progress: number;
  completed: number;
  sla_breaches: number;
  total: number;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low:    { label: 'Low',    className: 'text-gray-500 bg-gray-100' },
  medium: { label: 'Medium', className: 'text-blue-600 bg-blue-50' },
  high:   { label: 'High',   className: 'text-orange-600 bg-orange-50' },
  urgent: { label: 'Urgent', className: 'text-red-600 bg-red-50' },
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { customer, isLoading: authLoading, isAuthenticated } = useCustomerAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    pending_approval: 0, active: 0, in_progress: 0, completed: 0, sla_breaches: 0, total: 0,
  });
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerApi.get<{ success: boolean; data: JobListResponse; error: string | null }>(
        '/api/customer/jobs?limit=50'
      );
      const allJobs: Job[] = Array.isArray(res.data.data?.jobs) ? res.data.data.jobs : [];
      setJobs(allJobs);

      const c: StatusCounts = {
        pending_approval: 0, active: 0, in_progress: 0, completed: 0, sla_breaches: 0,
        total: allJobs.length,
      };
      allJobs.forEach((j) => {
        if (j.approval_status === 'pending_approval') c.pending_approval++;
        if (j.status === 'open' || j.status === 'pending') c.active++;
        if (j.status === 'active' || j.status === 'in_progress') c.in_progress++;
        if (j.status === 'completed') c.completed++;
        if (j.sla_accept_breached || j.sla_completion_breached) c.sla_breaches++;
      });
      setCounts(c);
    } catch (err: any) {
      setError({
        title: "Could not load dashboard",
        message: err.message || "There was a problem connecting to the service. Please try again."
      });
      console.error('Failed to load jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  const firstName = customer?.name?.split(' ')[0] || 'there';

  const STATS = [
    {
      label: 'Pending Approval',
      value: counts.pending_approval,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'Active Jobs',
      value: counts.active,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'In Progress',
      value: counts.in_progress,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      label: 'Completed',
      value: counts.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'SLA Breaches',
      value: counts.sla_breaches,
      icon: Zap,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: counts.sla_breaches > 0 ? 'border-red-300' : 'border-red-100',
    },
  ];

  const PORTAL_SECTIONS = [
    {
      href: '/customer/jobs',
      label: 'All Requests',
      description: 'View and filter all your service requests',
      icon: List,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      href: '/customer/notifications',
      label: 'Notifications',
      description: 'Real-time updates on your jobs',
      icon: Bell,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      href: '/customer/history',
      label: 'Service History',
      description: 'Past completed and cancelled jobs',
      icon: History,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      href: '/customer/recurring',
      label: 'Recurring Jobs',
      description: 'Automate repeating service requests',
      icon: Repeat,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  // Active jobs: not completed, not cancelled
  const activeJobs = jobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'cancelled'
  );

  // Recent completed: last 3
  const recentCompleted = jobs
    .filter((j) => j.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good day, {firstName} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Here is an overview of your service requests</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/customer/notifications"
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <button
              onClick={() => router.push('/customer/create-job')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              New Request
            </button>
          </div>
        </motion.div>

        {error && jobs.length === 0 ? (
          <div className="py-12">
            <ErrorView title={error.title} message={error.message} onRetry={fetchDashboardData} />
          </div>
        ) : isLoading ? (
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-border/50" />)}
            </div>
            <SkeletonList count={4} />
          </div>
        ) : (
          <>
            {/* ── Stats row ───────────────────────────────────────────────── */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
            >
              {Array.isArray(STATS) && STATS.map(({ label, value, icon: Icon, color, bg, border }) => (
                <button
                  key={label}
                  onClick={() => router.push('/customer/jobs')}
                  className={cn(
                    "bg-white rounded-xl border p-5 hover:shadow-md transition-all text-left hover:border-blue-300 group",
                    border
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                  </div>
                  <div className="text-3xl font-black tracking-tight text-gray-900 mb-1">{Number(value || 0)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</div>
                </button>
              ))}
            </motion.div>

            {/* ── Portal Features ──────────────────────────────────────────── */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="mb-8"
            >
              <h2 className="text-base font-semibold text-gray-900 mb-3">Portal Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PORTAL_SECTIONS.map(({ href, label, description, icon: Icon, iconBg, iconColor }) => (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ── Active Jobs ──────────────────────────────────────────────── */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Active Jobs</h2>
                  <p className="text-sm text-gray-500">Jobs currently in progress or awaiting action</p>
                </div>
                <button
                  onClick={() => router.push('/customer/jobs')}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {Array.isArray(activeJobs) && activeJobs.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-7 w-7 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">No active jobs</h3>
                  <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                    Submit a service request and we will get someone on it right away.
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
                  {Array.isArray(activeJobs) && activeJobs.map((job, i) => {
                    const priority = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium;
                    const hasSLABreach = job.sla_accept_breached || job.sla_completion_breached;
                    return (
                      <motion.div
                        key={job.id}
                        variants={fadeUp} initial="hidden" animate="visible" custom={4 + i * 0.3}
                        className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
                              {hasSLABreach && (
                                <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" title="SLA breach" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md", priority.className)}>
                                {priority.label}
                              </span>
                              <JobStatusBadge status={job.status} approvalStatus={job.approval_status} />
                            </div>
                          </div>
                        </div>

                        {job.assigned_employee_name && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            <span>Assigned to <span className="font-medium text-gray-700">{job.assigned_employee_name}</span></span>
                          </div>
                        )}

                        {Number(job.progress || 0) > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span className="font-medium text-blue-600">{Number(job.progress || 0)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Number(job.progress || 0)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/customer/job/${job.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </Link>
                          {job.employee_status === 'accepted' && (
                            <Link
                              href={`/customer/job/${job.id}#tracking`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs font-medium text-blue-700 transition-all"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              Track Live
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* ── Recent Completed ─────────────────────────────────────────── */}
            {recentCompleted.length > 0 && (
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={5}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recently Completed</h2>
                  <button
                    onClick={() => router.push('/customer/history')}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    View history <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {recentCompleted.map((job, i) => {
                    const priority = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium;
                    return (
                      <motion.div
                        key={job.id}
                        variants={fadeUp} initial="hidden" animate="visible" custom={6 + i * 0.2}
                      >
                        <Link
                          href={`/customer/job/${job.id}`}
                          className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-4 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                              {job.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${priority.className}`}>
                                {priority.label}
                              </span>
                              {job.completed_at && (
                                <span className="text-xs text-gray-400">
                                  Completed {new Date(job.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <Activity className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
