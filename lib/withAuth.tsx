import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from './apiClient';
import DotsLoader from '@/components/dots-loader';

export function useAuthGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const me = await apiClient('/api/users/me');
        if (mounted) setUser(me);
      } catch (err) {
        router.replace('/login');
      } finally { if (mounted) setLoading(false); }
    }
    check();
    return () => { mounted = false; };
  }, [router]);

  return { user, loading };
}

export default function withAuth(Component: any) {
  return function Wrapped(props: any) {
    const { user, loading } = useAuthGuard();
    if (loading) return <div className="w-full h-48"><DotsLoader /></div>;
    return <Component {...props} user={user} />;
  };
}
