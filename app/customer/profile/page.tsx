'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { CustomerProfile } from '@/lib/customerTypes';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { customer, isLoading: authLoading, isAuthenticated, refreshProfile } = useCustomerAuth();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/customer/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const res = await customerApi.get<CustomerProfile>('/api/customer/profile');
        setProfile(res.data);
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
      } catch {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const res = await customerApi.put<CustomerProfile>('/api/customer/profile', { name, phone });
      setProfile(res.data);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      // Restore previous values on failure
      setName(profile?.name || '');
      setPhone(profile?.phone || '');
      setError(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950">
      <CustomerNavbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">Your profile</h1>
          <p className="text-white/40 text-sm mb-8">Manage your account details</p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            {/* Success toast */}
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                Profile updated successfully
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Read-only info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <Mail className="h-4 w-4 text-white/30 shrink-0" />
                <div>
                  <p className="text-xs text-white/30 mb-0.5">Email (read-only)</p>
                  <p className="text-sm text-white/60">{profile?.email}</p>
                </div>
              </div>

              {profile?.created_at && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                  <Calendar className="h-4 w-4 text-white/30 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30 mb-0.5">Member since</p>
                    <p className="text-sm text-white/60">
                      {format(new Date(profile.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Editable form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder=" "
                  disabled={isSaving}
                  className="peer w-full rounded-xl border border-white/20 bg-white/5 px-4 pt-5 pb-2 pl-10 text-sm text-white placeholder-transparent outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50"
                />
                <label htmlFor="name" className="absolute left-10 top-1 text-xs text-indigo-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-xs peer-focus:text-indigo-300">
                  Full name
                </label>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              </div>

              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder=" "
                  disabled={isSaving}
                  className="peer w-full rounded-xl border border-white/20 bg-white/5 px-4 pt-5 pb-2 pl-10 text-sm text-white placeholder-transparent outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50"
                />
                <label htmlFor="phone" className="absolute left-10 top-1 text-xs text-indigo-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-xs peer-focus:text-indigo-300">
                  Phone number
                </label>
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
