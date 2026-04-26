'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { CustomerNavbar } from '@/components/customer/layout/CustomerNavbar';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import customerApi from '@/lib/customerApi';
import type { CustomerProfile } from '@/lib/customerTypes';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, refreshProfile } = useCustomerAuth();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/customer/login');
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

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
      setName(profile?.name || '');
      setPhone(profile?.phone || '');
      setError(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Your profile</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your account information</p>
          </div>

          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-xl">{initials}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{profile?.name || 'No name set'}</h2>
                <p className="text-sm text-gray-500">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Verified
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{profile?.auth_provider} account</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-5">Account details</h3>

            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200"
              >
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-800 font-medium">Profile updated successfully</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200"
              >
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            {/* Read-only fields */}
            <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email address (read-only)</p>
                  <p className="text-sm font-medium text-gray-700">{profile?.email}</p>
                </div>
              </div>
              {profile?.created_at && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Member since</p>
                    <p className="text-sm font-medium text-gray-700">
                      {format(new Date(profile.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Editable fields */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    disabled={isSaving}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                    disabled={isSaving}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mt-2"
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  'Save changes'
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
