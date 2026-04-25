'use client';

/**
 * hooks/useSSE.ts
 *
 * Manages a Server-Sent Events connection to /api/customer/jobs/:id/events
 * for real-time job lifecycle updates.
 *
 * Features:
 * - Cookie-based auth (primary); no token in URL needed when cookie is present
 * - Exponential backoff reconnect (1s → 2s → 4s → max 30s)
 * - Exposes isConnected so callers can suspend polling while SSE is active
 * - Automatic cleanup on unmount
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { SSEEvent } from '@/lib/customerTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarterp-backendend.onrender.com';

interface UseSSEOptions {
  jobId: string;
  onEvent: (event: SSEEvent) => void;
  enabled?: boolean;
}

interface UseSSEResult {
  isConnected: boolean;
}

export function useSSE({ jobId, onEvent, enabled = true }: UseSSEOptions): UseSSEResult {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const onEventRef = useRef(onEvent);
  const [isConnected, setIsConnected] = useState(false);

  // Keep onEvent ref current without re-subscribing
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!enabled || !jobId) return;

    // Clean up any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // Primary: rely on HttpOnly cookie (withCredentials).
    // The backend also accepts ?token= as fallback, but we don't send it here
    // to avoid exposing the token in URLs/logs.
    const url = `${BASE_URL}/api/customer/jobs/${jobId}/events`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        onEventRef.current(data);

        // Mark as connected on first real message
        if (data.type === 'connected') {
          setIsConnected(true);
          retryCountRef.current = 0;
        }

        // If server asks us to reconnect (Redis fallback), do so after a short delay
        if (data.type === 'reconnect') {
          setIsConnected(false);
          es.close();
          esRef.current = null;
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      esRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30_000);
      retryCountRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };
  }, [jobId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      setIsConnected(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect, enabled]);

  return { isConnected };
}
