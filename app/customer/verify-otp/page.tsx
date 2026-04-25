'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { OtpInput } from '@/components/customer/auth/OtpInput';
import customerApi from '@/lib/customerApi';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const flow = searchParams.get('flow') || 'signup'; // 'signup'

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    await customerApi.post('/api/customer/auth/send-otp', { email });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Verify OTP
      await customerApi.post('/api/customer/auth/verify-otp', { email, otp });

      if (flow === 'signup') {
        // Complete signup with stored form data
        const storedForm = sessionStorage.getItem('customer_signup_form');
        if (!storedForm) {
          router.push('/customer/signup');
          return;
        }

        const formData = JSON.parse(storedForm);
        await customerApi.post('/api/customer/auth/signup', formData);
        sessionStorage.removeItem('customer_signup_form');

        router.push('/customer/login?registered=1');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-white/50 text-sm mt-1">
            We sent a 6-digit code to{' '}
            <span className="text-indigo-400">{email}</span>
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <OtpInput
              value={otp}
              onChange={setOtp}
              onResend={handleResend}
              error={error}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Verifying...' : 'Verify code'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            <a href="/customer/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              ← Back to sign up
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-400 animate-spin" /></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
