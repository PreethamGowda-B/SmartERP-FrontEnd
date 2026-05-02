'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, CheckCircle, XCircle, Clock, Briefcase, RefreshCw } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { CustomerNotification } from '@/lib/customerTypes';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; iconClass: string; bgClass: string }> = {
  job_approved:  { label: 'Request Approved',     icon: CheckCircle, iconClass: 'text-green-600',  bgClass: 'bg-green-50' },
  job_rejected:  { label: 'Request Not Approved', icon: XCircle,     iconClass: 'text-red-600',    bgClass: 'bg-red-50' },
  job_accepted:  { label: 'Technician Assigned',  icon: Briefcase,   iconClass: 'text-blue-600',   bgClass: 'bg-blue-50' },
  job_completed: { label: 'Job Completed',         icon: CheckCircle, iconClass: 'text-green-600',  bgClass: 'bg-green-50' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] || { label: 'Update', icon: Bell, iconClass: 'text-gray-600', bgClass: 'bg-gray-100' };
}

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return 'Earlier';
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
        '/api/customer/notifications?limit=50'
      );
      const primary = res.data.data ?? [];

      if (primary.length > 0) {
        setNotifications(primary);
      } else {
        try {
          const fallback = await customerApi.get<{ success: boolean; data: any[] }>(
            '/api/customer/notifications?limit=50'
          );
          const items = (fallback.data.data ?? []).map((n: any) => ({
            id: n.id,
            type: n.type || n.action || 'update',
            details: {
              title: n.title || n.message,
              message: n.message || n.body,
              job_id: n.data?.job_id || n.job_id,
            },
            created_at: n.created_at,
          }));
          setNotifications(items);
        } catch {
          setNotifications([]);
        }
      }
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchNotifications(true), 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Group notifications by date
  const groups: Record<string, CustomerNotification[]> = {};
  notifications.forEach((n) => {
    const group = getDateGroup(n.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  });
  const groupOrder = ['Today', 'Yesterday', 'Earlier'];

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Updates about your service requests · auto-refreshes every 30s
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchNotifications(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-500">Updates about your service requests will appear here.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {groupOrder.map((group) => {
              const items = groups[group];
              if (!items || items.length === 0) return null;
              return (
                <div key={group}>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    {group}
                  </h2>
                  <div className="space-y-2">
                    {items.map((n, i) => {
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
                          className={`bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 transition-all ${
                            jobId ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bgClass}`}>
                            <Icon className={`h-5 w-5 ${config.iconClass}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {n.details?.title || config.label}
                            </p>
                            {n.details?.message && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.details.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {jobId && (
                            <div className="shrink-0 self-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
