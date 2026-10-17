'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, MailCheck } from 'lucide-react';
import { OtpInput } from '@/components/customer/auth/OtpInput';
import { CustomerAuthShell } from '@/components/customer/auth/CustomerAuthShell';
import customerApi from '@/lib/customerApi';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const flow = searchParams.get('flow') || 'signup';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendError, setResendError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    setResendError('');
    try {
      await customerApi.post('/api/customer/auth/send-otp', { email });
      return true;
    } catch (err: any) {
      setResendError(err?.response?.data?.message || 'We could not resend the code. Please try again.');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the complete 6-digit code.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await customerApi.post('/api/customer/auth/verify-otp', { email, otp });
      if (flow === 'signup') {
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
      setError(err?.response?.data?.message || 'The code could not be verified. Check it and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthShell
      title="Verify your email"
      description="Enter the verification code sent to the email address you used to register."
      eyebrow="One more step"
      backHref="/customer/signup"
      backLabel="Back to registration"
    >
      <div className="customer-auth-verify-icon"><MailCheck size={24} /></div>
      <div className="customer-auth-form-heading customer-auth-verify-heading">
        <span className="customer-auth-form-kicker">EMAIL VERIFICATION</span>
        <h2>Check your inbox</h2>
        <p>Enter the 6-digit code sent to <strong>{email || 'your email address'}</strong>.</p>
      </div>

      {error && <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="customer-auth-message error">{error}</motion.div>}
      {resendError && <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="customer-auth-message error">{resendError}</motion.div>}

      <form onSubmit={handleSubmit} className="customer-auth-form customer-auth-otp-form">
        <OtpInput value={otp} onChange={(value) => { setOtp(value); setError(''); }} onResend={handleResend} disabled={isLoading} />
        <button type="submit" disabled={isLoading || otp.length !== 6} className="customer-auth-primary">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : <>Verify and create account <span aria-hidden="true">→</span></>}
        </button>
      </form>
      <p className="customer-auth-switch">Wrong email? <button type="button" onClick={() => router.push('/customer/signup')}>Go back to registration</button></p>
    </CustomerAuthShell>
  );
}

export default function VerifyOtpPage() {
  return <Suspense fallback={<div className="customer-auth-loading"><Loader2 className="h-8 w-8 animate-spin" /></div>}><VerifyOtpContent /></Suspense>;
}
