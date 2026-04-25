'use client';

/**
 * hooks/useJobTracking.ts
 *
 * Polls GET /api/customer/jobs/:id/tracking every 15 seconds
 * when the job has been accepted by an employee.
 *
 * Stops polling when:
 * - active prop becomes false
 * - job is completed (status === 'completed')
 * - SSE is connected and receiving updates (sseConnected = true)
 * - component unmounts
 *
 * Resumes polling only if SSE disconnects (sseConnected becomes false).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import customerApi from '@/lib/customerApi';
import type { TrackingData } from '@/lib/customerTypes';

interface UseJobTrackingOptions {
  jobId: string;
  /** Only poll when employee has accepted */
  active: boolean;
  /** When true, polling is suspended (SSE is handling updates) */
  sseConnected?: boolean;
  intervalMs?: number;
}

export function useJobTracking({
  jobId,
  active,
  sseConnected = false,
  intervalMs = 15_000,
}: UseJobTrackingOptions) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!jobId || !active) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await customerApi.get<TrackingData>(`/api/customer/jobs/${jobId}/tracking`);
      setTracking(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch location');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, active]);

  useEffect(() => {
    // Stop polling if not active, or if SSE is connected (SSE handles real-time updates)
    const shouldPoll = active && !sseConnected;

    if (!shouldPoll) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately when polling starts (or SSE disconnects)
    fetchTracking();

    // Then poll every intervalMs
    intervalRef.current = setInterval(fetchTracking, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, sseConnected, fetchTracking, intervalMs]);

  return { tracking, isLoading, error, setTracking };
}
