'use client';

import { PortalErrorFallback } from '@/components/portal-error-fallback';

export default function HrError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorFallback error={error} reset={reset} portalLabel="HR portal" />;
}
