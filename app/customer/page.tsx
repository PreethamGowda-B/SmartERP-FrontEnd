'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /customer to /customer/landing
    router.replace('/customer/landing');
  }, [router]);

  return null;
}
