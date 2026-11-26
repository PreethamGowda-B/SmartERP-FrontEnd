'use client';

import { PortalErrorFallback } from '@/components/portal-error-fallback';

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorFallback error={error} reset={reset} portalLabel="SuperAdmin portal" />;
}
