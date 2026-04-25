import type { Metadata } from 'next';
import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext';

export const metadata: Metadata = {
  title: 'Prozync Client Portal',
  description: 'Track your service jobs and stay updated in real time.',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthProvider>
      {children}
    </CustomerAuthProvider>
  );
}
