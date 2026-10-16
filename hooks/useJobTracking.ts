'use client';

/**
 * hooks/useJobTracking.ts
 *
 * Polls GET /api/customer/jobs/:id/tracking every 15 seconds
 * when the job has been accepted by an employee.
 *
 * Stops polling when active becomes false (for example, after completion).
 * Job lifecycle SSE does not include GPS coordinates, so location polling must
 * continue even while the lifecycle stream is connected.
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
  sseConnected: _sseConnected = false,
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
      const res = await customerApi.get<{ success?: boolean; data?: TrackingData } & TrackingData>(`/api/customer/jobs/${jobId}/tracking`);
      setTracking(res.data.data ?? res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch location');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, active]);

  useEffect(() => {
    const shouldPoll = active;

    if (!shouldPoll) {
      setTracking(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately when tracking starts, then continue regardless of SSE state.
    fetchTracking();

    // Then poll every intervalMs
    intervalRef.current = setInterval(fetchTracking, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, fetchTracking, intervalMs]);

  return { tracking, isLoading, error, setTracking };
}
