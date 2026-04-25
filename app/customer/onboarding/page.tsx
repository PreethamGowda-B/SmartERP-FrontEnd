'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Loader2, CheckCircle } from 'lucide-react';
import { CompanyCodeField } from '@/components/customer/auth/CompanyCodeField';
import customerApi, { fetchCsrfToken } from '@/lib/customerApi';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get('token') || '';

  const [step, setStep] = useState(1); // 1: company code, 2: phone
  const [companyCode, setCompanyCode] = useState('');
  const [companyValid, setCompanyValid] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleNext = () => {
    if (!companyValid) {
      setError('Please enter a valid company code');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await customerApi.post(
        '/api/customer/auth/onboarding',
        { company_code: companyCode, phone },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      // Refresh CSRF after login
      await fetchCsrfToken();
      setIsDone(true);

      setTimeout(() => router.push('/customer/dashboard'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">You&apos;re all set!</h2>
          <p className="text-white/50 mt-2">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Complete your setup</h1>
          <p className="text-white/50 text-sm mt-1">Just a couple more details</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'w-8 bg-indigo-500' : 'w-4 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-white font-semibold mb-1">Which company are you with?</h2>
                  <p className="text-white/40 text-sm mb-4">Enter the company code provided by your service provider.</p>
                </div>

                <CompanyCodeField
                  value={companyCode}
                  onChange={setCompanyCode}
                  onValidated={(r) => {
                    setCompanyValid(r.valid);
                    if (r.valid && r.companyName) setCompanyName(r.companyName);
                  }}
                />

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!companyValid}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-white font-semibold mb-1">
                    Joining <span className="text-indigo-400">{companyName}</span>
                  </h2>
                  <p className="text-white/40 text-sm mb-4">Add your phone number so the team can reach you.</p>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=" "
                    disabled={isLoading}
                    className="peer w-full rounded-xl border border-white/20 bg-white/5 px-4 pt-5 pb-2 pl-10 text-sm text-white placeholder-transparent outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50"
                  />
                  <label htmlFor="phone" className="absolute left-10 top-1 text-xs text-indigo-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-xs peer-focus:text-indigo-300">
                    Phone number (optional)
                  </label>
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm transition-all disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Setting up...' : 'Get started'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-400 animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
