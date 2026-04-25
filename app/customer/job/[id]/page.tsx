'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Activity } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { JobStatusBadge } from '@/components/customer/ui/JobStatusBadge';
import { JobTimeline } from '@/components/customer/jobs/JobTimeline';
import { LoadingSkeleton } from '@/components/customer/ui/LoadingSkeleton';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useSSE } from '@/hooks/useSSE';
import { useJobTracking } from '@/hooks/useJobTracking';
import customerApi from '@/lib/customerApi';
import type { Job, SSEEvent, TrackingData } from '@/lib/customerTypes';

// Dynamic import for Leaflet map (SSR disabled — Leaflet requires window)
const TrackingMap = dynamic(() => import('@/components/customer/jobs/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
      <div className="animate-pulse text-white/30 text-sm">Loading map...</div>
    </div>
  ),
});

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-slate-400', medium: 'text-blue-400', high: 'text-orange-400', urgent: 'text-red-400',
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/customer/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch job details
  const fetchJob = useCallback(async () => {
    try {
      const res = await customerApi.get<Job>(`/api/customer/jobs/${jobId}`);
      setJob(res.data);
      // Start tracking if employee has accepted
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

  // SSE handler — update job state in real time
  const handleSSEEvent = useCallback((event: SSEEvent) => {
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

  // Connect SSE stream
  const { isConnected: sseConnected } = useSSE({
    jobId,
    onEvent: handleSSEEvent,
    enabled: isAuthenticated && !!job,
  });

  // Poll employee location — suspended while SSE is active
  const { tracking } = useJobTracking({
    jobId,
    active: trackingActive,
    sseConnected,
    intervalMs: 15_000,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950">
        <CustomerNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-32" />
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950">
        <CustomerNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-red-400">{error || 'Job not found'}</p>
          <button onClick={() => router.push('/customer/dashboard')} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950">
      <CustomerNavbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push('/customer/dashboard')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        {/* Job header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-white">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>

          {job.description && (
            <p className="text-white/50 text-sm mb-4">{job.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            <span className={`font-medium capitalize ${PRIORITY_COLORS[job.priority] || 'text-slate-400'}`}>
              {job.priority} priority
            </span>
            {job.assigned_employee_name && (
              <span className="text-white/40">
                Assigned to <span className="text-white">{job.assigned_employee_name}</span>
              </span>
            )}
          </div>

          {/* Progress bar */}
          {job.progress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Live tracking map */}
        {trackingActive && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-indigo-400" />
              <h2 className="text-white font-semibold text-sm">Live Employee Location</h2>
              <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>
            {tracking ? (
              <TrackingMap tracking={tracking} />
            ) : (
              <div className="h-64 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                <p className="text-white/30 text-sm">Waiting for location data...</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-indigo-400" />
            <h2 className="text-white font-semibold text-sm">Timeline</h2>
          </div>
          <JobTimeline job={job} />
        </motion.div>
      </main>
    </div>
  );
}
