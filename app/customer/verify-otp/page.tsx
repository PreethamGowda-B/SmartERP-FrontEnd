'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { OtpInput } from '@/components/customer/auth/OtpInput';
import customerApi from '@/lib/customerApi';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const flow = searchParams.get('flow') || 'signup';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/customer/signup')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Prozync</span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                <Mail className="h-7 w-7 text-blue-600" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-gray-600 text-sm">
                We sent a 6-digit verification code to
              </p>
              <p className="text-blue-600 font-medium text-sm mt-1">{email}</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <OtpInput
                value={otp}
                onChange={setOtp}
                onResend={handleResend}
                error=""
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify code'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Wrong email?{' '}
              <button
                onClick={() => router.push('/customer/signup')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Go back
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
