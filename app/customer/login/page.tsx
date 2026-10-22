'use client';
import { getApiOrigin } from "@/lib/api-environment.mjs";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { CustomerAuthShell } from '@/components/customer/auth/CustomerAuthShell';

const API_URL = getApiOrigin();

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
  const { login, customer, isLoading: authLoading, isAuthenticated } = useCustomerAuth();
  const customerId = customer?.id;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    const registered = searchParams.get('registered');
    if (oauthError) setError(OAUTH_ERROR_MESSAGES[oauthError] || 'Sign-in failed. Please try again.');
    else if (registered === '1') setSuccessMessage('Account created. You can now sign in.');
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && customerId) router.push('/customer/dashboard');
  }, [authLoading, isAuthenticated, customerId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed. Check your details and try again.');
      setIsSubmitting(false);
    }
  };

  const formDisabled = authLoading || isSubmitting;

  return (
    <CustomerAuthShell
      title="Welcome back"
      description="Sign in to follow service requests, conversations, and documents for your company."
      eyebrow="Your service workspace"
      backHref="/customer/landing"
      backLabel="Back to home"
    >
      <div className="customer-auth-form-heading">
        <span className="customer-auth-form-kicker">CUSTOMER SIGN IN</span>
        <h2>Sign in to Prozync</h2>
        <p>Use the email and password linked to your customer account.</p>
      </div>

      {authLoading && <div className="customer-auth-hint"><Loader2 className="h-4 w-4 animate-spin" />Checking your session…</div>}
      {successMessage && <motion.div role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="customer-auth-message success">{successMessage}</motion.div>}
      {error && <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="customer-auth-message error">{error}</motion.div>}

      <form onSubmit={handleSubmit} className="customer-auth-form">
        <div className="customer-auth-field">
          <label htmlFor="email">Email address</label>
          <div className="customer-auth-input-wrap"><Mail aria-hidden="true" /><input className="customer-auth-input" type="email" id="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required disabled={formDisabled} /></div>
        </div>

        <div className="customer-auth-field">
          <div className="customer-auth-label-row"><label htmlFor="password">Password</label><button type="button" className="customer-auth-text-button" onClick={() => setShowForgotPasswordModal(true)}>Forgot password?</button></div>
          <div className="customer-auth-input-wrap"><Lock aria-hidden="true" /><input className="customer-auth-input has-trailing" type={showPassword ? 'text' : 'password'} id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={formDisabled} /><button type="button" className="customer-auth-input-action" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} disabled={formDisabled}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
        </div>

        <button type="submit" disabled={formDisabled} className="customer-auth-primary">
          {formDisabled ? <><Loader2 className="h-4 w-4 animate-spin" />{isSubmitting ? 'Signing in…' : 'Please wait…'}</> : <>Sign in to your account <span aria-hidden="true">→</span></>}
        </button>
      </form>

      <div className="customer-auth-divider"><span>or continue with</span></div>
      <a href={`${API_URL}/api/auth/google?type=customer`} className="customer-auth-google">
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.1 5.1 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09a6.96 6.96 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/></svg>
        Continue with Google
      </a>
      <p className="customer-auth-switch">New to the customer portal? <button type="button" onClick={() => router.push('/customer/signup')}>Create an account</button></p>

      <ForgotPasswordModal isOpen={showForgotPasswordModal} onClose={() => setShowForgotPasswordModal(false)} portalType="customer" defaultEmail={email} roleHint="customer" />
    </CustomerAuthShell>
  );
}

export default function CustomerLoginPage() {
  return <Suspense fallback={<div className="customer-auth-loading"><Loader2 className="h-8 w-8 animate-spin" /></div>}><LoginContent /></Suspense>;
}
