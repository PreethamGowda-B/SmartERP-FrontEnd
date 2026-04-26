'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import { JobTimeline } from '@/components/customer/jobs/JobTimeline';
import { LoadingSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useSSE } from '@/hooks/useSSE';
import { useJobTracking } from '@/hooks/useJobTracking';
import customerApi from '@/lib/customerApi';
import type { Job, SSEEvent, TrackingData } from '@/lib/customerTypes';

const TrackingMap = dynamic(() => import('@/components/customer/jobs/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low:    { label: 'Low Priority',    className: 'text-gray-600 bg-gray-100' },
  medium: { label: 'Medium Priority', className: 'text-blue-700 bg-blue-50' },
  high:   { label: 'High Priority',   className: 'text-orange-700 bg-orange-50' },
  urgent: { label: 'Urgent',          className: 'text-red-700 bg-red-50' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } }),
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingActive, setTrackingActive] = useState(false);

  // All hooks before any conditional returns
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchJob = useCallback(async () => {
    try {
      const res = await customerApi.get<Job>(`/api/customer/jobs/${jobId}`);
      setJob(res.data);
      if (res.data.employee_status === 'accepted' && res.data.status !== 'completed') {
        setTrackingActive(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Job not found');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (isAuthenticated) fetchJob();
  }, [isAuthenticated, fetchJob]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'job_approved') {
      setJob((prev) => prev ? {
        ...prev,
        approval_status: 'approved',
        approved_at: event.approvedAt || new Date().toISOString(),
      } : prev);
    }
    if (event.type === 'job_accepted') {
      setJob((prev) => prev ? {
        ...prev,
        employee_status: 'accepted',
        status: 'active',
        accepted_at: event.acceptedAt || new Date().toISOString(),
        assigned_employee_name: event.employeeName || prev.assigned_employee_name,
      } : prev);
      setTrackingActive(true);
    }
    if (event.type === 'employee_arrived') {
      setJob((prev) => prev ? {
        ...prev,
        employee_status: 'arrived',
        arrived_at: event.arrivedAt || new Date().toISOString(),
      } : prev);
    }
    if (event.type === 'job_progress') {
      setJob((prev) => prev ? {
        ...prev,
        progress: event.progress ?? prev.progress,
        status: event.status || prev.status,
      } : prev);
    }
    if (event.type === 'job_completed') {
      setJob((prev) => prev ? {
        ...prev,
        status: 'completed',
        progress: 100,
        completed_at: event.completedAt || new Date().toISOString(),
      } : prev);
      setTrackingActive(false);
    }
  }, []);

  const { isConnected: sseConnected } = useSSE({
    jobId,
    onEvent: handleSSEEvent,
    enabled: isAuthenticated && !!job,
  });

  const { tracking } = useJobTracking({
    jobId,
    active: trackingActive,
    sseConnected,
    intervalMs: 15_000,
  });

  // Conditional renders after all hooks
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <LoadingSkeleton className="h-6 w-32" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-48" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Request not found</h2>
            <p className="text-sm text-gray-500 mb-6">{error || 'This request does not exist or you do not have access.'}</p>
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const priority = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.medium;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.push('/customer/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        {/* Job header card */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{job.title}</h1>
            <JobStatusBadge status={job.status} approvalStatus={job.approval_status} />
          </div>

          {/* Pending approval notice */}
          {job.approval_status === 'pending_approval' && (
            <div className="mb-4 flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Awaiting approval</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your request is being reviewed by the service team. You will be notified once it is approved.
                </p>
              </div>
            </div>
          )}

          {job.approval_status === 'rejected' && (
            <div className="mb-4 flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Request not approved</p>
                <p className="text-xs text-red-700 mt-0.5">
                  This request was not approved. Please contact your service provider for more information.
                </p>
              </div>
            </div>
          )}

          {job.description && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">{job.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${priority.className}`}>
              {priority.label}
            </span>
            {job.assigned_employee_name && (
              <span className="text-sm text-gray-500">
                Assigned to <span className="font-medium text-gray-800">{job.assigned_employee_name}</span>
              </span>
            )}
            {sseConnected && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live updates
              </span>
            )}
          </div>

          {/* Progress bar */}
          {job.progress > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Progress</span>
                <span className="font-semibold text-blue-600">{job.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Live tracking map */}
        {trackingActive && (
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Live Technician Location</h2>
                <p className="text-xs text-gray-500">Updates every 15 seconds</p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            {tracking ? (
              <TrackingMap tracking={tracking} />
            ) : (
              <div className="h-48 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Waiting for location data...</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Activity Timeline</h2>
          </div>
          <JobTimeline job={job} />
        </motion.div>
      </main>
    </div>
  );
}
