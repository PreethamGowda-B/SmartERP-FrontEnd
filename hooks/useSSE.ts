'use client';

/**
 * hooks/useSSE.ts
 *
 * Manages a Server-Sent Events connection to /api/customer/jobs/:id/events
 * for real-time job lifecycle updates.
 *
 * Section 3 — SSE Event Deduplication:
 *   Each event from the server includes a unique `event_id` field.
 *   The hook tracks the last 50 seen event_ids in a Set and silently
 *   drops any duplicate before calling onEvent. This prevents double
 *   UI updates if the client reconnects and the server re-sends recent events.
 *
 * Other features:
 * - Cookie-based auth (primary); no token in URL needed when cookie is present
 * - Exponential backoff reconnect (1s → 2s → 4s → max 30s)
 * - Exposes isConnected so callers can suspend polling while SSE is active
 * - Automatic cleanup on unmount
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { SSEEvent } from '@/lib/customerTypes';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarterp-backendend.onrender.com';
const DEDUP_WINDOW = 50; // keep last N event_ids

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
  const seenEventIds = useRef<Set<string>>(new Set());
  const seenEventOrder = useRef<string[]>([]); // for eviction
  const [isConnected, setIsConnected] = useState(false);

  // Keep onEvent ref current without re-subscribing
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  /** Section 3: Returns true if this event_id is new (not a duplicate) */
  const isNewEvent = useCallback((eventId: string | undefined): boolean => {
    if (!eventId) return true; // no event_id → always process (legacy events)
    if (seenEventIds.current.has(eventId)) return false; // duplicate — drop

    // Track it
    seenEventIds.current.add(eventId);
    seenEventOrder.current.push(eventId);

    // Evict oldest if window exceeded
    if (seenEventOrder.current.length > DEDUP_WINDOW) {
      const oldest = seenEventOrder.current.shift();
      if (oldest) seenEventIds.current.delete(oldest);
    }
    return true;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !jobId) return;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `${BASE_URL}/api/customer/jobs/${jobId}/events`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        // Section 3: Deduplicate by event_id before processing
        if (!isNewEvent(data.event_id)) return;

        onEventRef.current(data);

        if (data.type === 'connected') {
          setIsConnected(true);
          retryCountRef.current = 0;
        }

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

      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30_000);
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };
  }, [jobId, enabled, isNewEvent]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      setIsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
    };
  }, [connect, enabled]);

  return { isConnected };
}
