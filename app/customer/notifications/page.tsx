'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, CheckCircle, XCircle, Clock, Briefcase, RefreshCw } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { CustomerNotification } from '@/lib/customerTypes';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  job_approved:  { label: 'Request Approved',     icon: CheckCircle, className: 'text-green-600 bg-green-50' },
  job_rejected:  { label: 'Request Not Approved', icon: XCircle,     className: 'text-red-600 bg-red-50' },
  job_accepted:  { label: 'Technician Assigned',  icon: Briefcase,   className: 'text-blue-600 bg-blue-50' },
  job_completed: { label: 'Job Completed',         icon: CheckCircle, className: 'text-green-600 bg-green-50' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || { label: 'Update', icon: Bell, className: 'text-gray-600 bg-gray-100' };
}

export default function CustomerNotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchNotifications = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const res = await customerApi.get<{ success: boolean; data: CustomerNotification[] }>(
        '/api/customer/jobs/notifications?limit=50'
      );
      setNotifications(res.data.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/customer/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              <p className="text-xs text-gray-500 mt-0.5">Updates about your service requests</p>
            </div>
          </div>
          <button onClick={() => fetchNotifications(true)} disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-500">Updates about your service requests will appear here.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const config = getConfig(n.type);
              const Icon = config.icon;
              const jobId = n.details?.job_id;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => jobId && router.push(`/customer/job/${jobId}`)}
                  className={`bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 transition-all ${jobId ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.className}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{n.details?.title || config.label}</p>
                    {n.details?.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.details.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
