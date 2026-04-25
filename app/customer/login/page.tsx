'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Chrome } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarterp-backendend.onrender.com';

// Map backend OAuth error codes to user-friendly messages
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_USED: 'This email is already used in the employee portal. Please use a different email.',
  account_exists: 'This email is already registered. Please sign in with your password.',
  oauth_failed: 'Google sign-in failed. Please try again.',
  oauth_not_configured: 'Google sign-in is not available right now.',
  server_error: 'Something went wrong. Please try again.',
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useCustomerAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Show error from OAuth redirect or success message after signup
  useEffect(() => {
    const oauthError = searchParams.get('error');
    const registered = searchParams.get('registered');
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] || 'Sign-in failed. Please try again.');
    } else if (registered === '1') {
      setSuccessMessage('Account created! Please sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/customer/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
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
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4"
          >
            <span className="text-white font-bold text-xl">P</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Prozync Client Portal</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to track your service requests</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Success message (e.g. after signup) */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Error */}
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
            {/* Email */}
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                disabled={isLoading}
                className="peer w-full rounded-xl border border-white/20 bg-white/5 px-4 pt-5 pb-2 pl-10 text-sm text-white placeholder-transparent outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50"
              />
              <label
                htmlFor="email"
                className="absolute left-10 top-1 text-xs text-indigo-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-xs peer-focus:text-indigo-300"
              >
                Email address
              </label>
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                disabled={isLoading}
                className="peer w-full rounded-xl border border-white/20 bg-white/5 px-4 pt-5 pb-2 pl-10 text-sm text-white placeholder-transparent outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:opacity-50"
              />
              <label
                htmlFor="password"
                className="absolute left-10 top-1 text-xs text-indigo-300 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-xs peer-focus:text-indigo-300"
              >
                Password
              </label>
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-white/30">
              <span className="bg-transparent px-2">or continue with</span>
            </div>
          </div>

          {/* Google */}
          <a
            href={`${API_URL}/api/customer/auth/google`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all"
          >
            <Chrome className="h-4 w-4" />
            Sign in with Google
          </a>

          {/* Sign up link */}
          <p className="text-center text-sm text-white/40 mt-5">
            Don&apos;t have an account?{' '}
            <a href="/customer/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign up
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
