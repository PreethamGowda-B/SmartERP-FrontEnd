'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { CompanyCodeField } from '@/components/customer/auth/CompanyCodeField';
import { CustomerAuthShell } from '@/components/customer/auth/CustomerAuthShell';
import customerApi from '@/lib/customerApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.prozync.in';

export default function CustomerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company_code: '' });
  const [companyValid, setCompanyValid] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyValid) {
      setError('Enter and verify the company code provided by your service company.');
      return;
    }
    setIsLoading(true);
    try {
      await customerApi.post('/api/customer/auth/send-otp', { email: form.email });
      sessionStorage.setItem('customer_signup_form', JSON.stringify(form));
      router.push(`/customer/verify-otp?email=${encodeURIComponent(form.email)}&flow=signup`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'We could not send a verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthShell
      title="Join your service company"
      description="Create a customer account with the company code provided by your service team."
      eyebrow="Get started"
      backHref="/customer/landing"
      backLabel="Back to home"
    >
      <div className="customer-auth-form-heading">
        <span className="customer-auth-form-kicker">CREATE CUSTOMER ACCOUNT</span>
        <h2>Set up your access</h2>
        <p>We’ll verify your email before creating the account.</p>
      </div>

      {error && <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="customer-auth-message error">{error}</motion.div>}

      <form onSubmit={handleSubmit} className="customer-auth-form">
        <div className="customer-auth-field"><label htmlFor="name">Full name</label><div className="customer-auth-input-wrap"><User aria-hidden="true" /><input className="customer-auth-input" type="text" id="name" autoComplete="name" value={form.name} onChange={update('name')} placeholder="Your name" required disabled={isLoading} /></div></div>
        <div className="customer-auth-field"><label htmlFor="signup-email">Email address</label><div className="customer-auth-input-wrap"><Mail aria-hidden="true" /><input className="customer-auth-input" type="email" id="signup-email" autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@company.com" required disabled={isLoading} /></div></div>
        <div className="customer-auth-field"><label htmlFor="signup-password">Password</label><div className="customer-auth-input-wrap"><Lock aria-hidden="true" /><input className="customer-auth-input" type="password" id="signup-password" autoComplete="new-password" value={form.password} onChange={update('password')} placeholder="At least 8 characters" required minLength={8} disabled={isLoading} /></div><span className="customer-auth-field-hint">Use at least 8 characters.</span></div>
        <div className="customer-auth-field"><label htmlFor="phone">Phone number</label><div className="customer-auth-input-wrap"><Phone aria-hidden="true" /><input className="customer-auth-input" type="tel" id="phone" autoComplete="tel" value={form.phone} onChange={update('phone')} placeholder="Your contact number" required disabled={isLoading} /></div></div>

        <div className="customer-auth-company-code"><CompanyCodeField value={form.company_code} onChange={(value) => setForm((current) => ({ ...current, company_code: value }))} onValidated={(result) => setCompanyValid(result.valid)} disabled={isLoading} /></div>

        <div className="customer-auth-note"><span className="customer-auth-note-icon">i</span><p>Registration requires a valid company code. Ask your service company if you don’t have one.</p></div>
        <button type="submit" disabled={isLoading || !companyValid} className="customer-auth-primary">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending verification code…</> : <>Continue with email <span aria-hidden="true">→</span></>}
        </button>
      </form>

      <div className="customer-auth-divider"><span>or continue with</span></div>
      <a href={`${API_URL}/api/auth/google?type=customer`} className="customer-auth-google"><GoogleMark />Sign up with Google</a>
      <p className="customer-auth-switch">Already have an account? <button type="button" onClick={() => router.push('/customer/login')}>Sign in</button></p>
    </CustomerAuthShell>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.1 5.1 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09a6.96 6.96 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/></svg>;
}
