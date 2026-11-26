'use client';

import { PortalErrorFallback } from '@/components/portal-error-fallback';

export default function OwnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorFallback error={error} reset={reset} portalLabel="Owner portal" />;
}
