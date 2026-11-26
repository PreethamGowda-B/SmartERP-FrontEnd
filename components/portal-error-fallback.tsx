'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PortalErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  portalLabel?: string;
}

/**
 * Shared route-level error boundary UI for SmartERP portals.
 */
export function PortalErrorFallback({
  error,
  reset,
  portalLabel = 'Portal',
}: PortalErrorFallbackProps) {
  useEffect(() => {
    console.error(`${portalLabel} route error:`, error);
  }, [error, portalLabel]);

  return (
    <div className="min-h-[65vh] grid place-items-center px-4 py-12">
      <section
        role="alert"
        className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-sm sm:p-10 dark:border-amber-900/50 dark:bg-slate-900"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle size={23} />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-amber-700 dark:text-amber-300">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          This page couldn’t finish loading
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          Try loading the page again. If this happened after a save, check the related list before repeating the action.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </section>
    </div>
  );
}
