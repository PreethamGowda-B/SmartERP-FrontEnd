import type { Metadata } from 'next';
import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext';
import { CustomerNotificationProvider } from '@/contexts/CustomerNotificationContext';
import './customer-portal.css';

export const metadata: Metadata = {
  title: 'Prozync Client Portal',
  description: 'Follow service requests, communicate with your service team, and access customer documents.',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerAuthProvider>
      <CustomerNotificationProvider>
        <div className="customer-portal min-h-screen">
          {children}
        </div>
      </CustomerNotificationProvider>
    </CustomerAuthProvider>
  );
}
