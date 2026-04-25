'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, Loader2, Chrome } from 'lucide-react';
import { CompanyCodeField } from '@/components/customer/auth/CompanyCodeField';
import customerApi from '@/lib/customerApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarterp-backendend.onrender.com';

export default function CustomerSignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company_code: '',
  });
  const [companyValid, setCompanyValid] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyValid) {
      setError('Please enter a valid company code');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Send OTP
      await customerApi.post('/api/customer/auth/send-otp', { email: form.email });

      // Store form data in sessionStorage for the verify-otp page
      sessionStorage.setItem('customer_signup_form', JSON.stringify(form));

      router.push(`/customer/verify-otp?email=${encodeURIComponent(form.email)}&flow=signup`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    { id: 'name', label: 'Full name', type: 'text', icon: User, value: form.name },
    { id: 'email', label: 'Email address', type: 'email', icon: Mail, value: form.email },
    { id: 'password', label: 'Password (min 8 chars)', type: 'password', icon: Lock, value: form.password },
    { id: 'phone', label: 'Phone number', type: 'tel', icon: Phone, value: form.phone },
  ];

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
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-white/50 text-sm mt-1">Join your company on Prozync</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ id, label, type, icon: Icon, value }) => (
              <div key={id} className="relative">
                <input
                  type={type}
                  id={id}
                  value={value}
                  onChange={update(id)}
                  placeholder=" "
                  required
                  minLength={id === 'password' ? 8 : undefined}
                  disabled={isLoading}
                  className="peer w-full rounded-xl border border-white/20 bg-white/5 px-4 pt-5 pb-2 pl-10 text-sm text-white placeholder-transparent outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50"
                />
                <label htmlFor={id} className="absolute left-10 top-1 text-xs text-indigo-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-xs peer-focus:text-indigo-300">
                  {label}
                </label>
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              </div>
            ))}

            <CompanyCodeField
              value={form.company_code}
              onChange={(v) => setForm((f) => ({ ...f, company_code: v }))}
              onValidated={(r) => setCompanyValid(r.valid)}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !companyValid}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Sending code...' : 'Continue with email'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-white/30">
              <span className="bg-transparent px-2">or</span>
            </div>
          </div>

          <a
            href={`${API_URL}/api/customer/auth/google`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all"
          >
            <Chrome className="h-4 w-4" />
            Sign up with Google
          </a>

          <p className="text-center text-sm text-white/40 mt-5">
            Already have an account?{' '}
            <a href="/customer/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
