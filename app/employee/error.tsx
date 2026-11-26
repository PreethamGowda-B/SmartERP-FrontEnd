'use client';

import { PortalErrorFallback } from '@/components/portal-error-fallback';

export default function EmployeeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorFallback error={error} reset={reset} portalLabel="Employee portal" />;
}
