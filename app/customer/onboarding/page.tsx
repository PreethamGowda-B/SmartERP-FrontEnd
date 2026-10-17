'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Phone } from 'lucide-react';
import { CompanyCodeField } from '@/components/customer/auth/CompanyCodeField';
import { CustomerAuthShell } from '@/components/customer/auth/CustomerAuthShell';
import customerApi, { fetchCsrfToken } from '@/lib/customerApi';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get('token') || '';
  const [step, setStep] = useState(1);
  const [companyCode, setCompanyCode] = useState('');
  const [companyValid, setCompanyValid] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleNext = () => {
    if (!companyValid) {
      setError('Enter and verify the company code provided by your service company.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!tempToken) {
      setError('Your sign-in session has expired. Sign in again to complete setup.');
      return;
    }
    setIsLoading(true);
    try {
      await customerApi.post('/api/customer/auth/onboarding', { company_code: companyCode, phone }, { headers: { Authorization: `Bearer ${tempToken}` } });
      await fetchCsrfToken();
      setIsDone(true);
      window.setTimeout(() => router.push('/customer/dashboard'), 1400);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Setup could not be completed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return <CustomerAuthShell title="Your customer space is ready" description="Your account has been connected to the selected service company." eyebrow="Setup complete" backHref="/customer/landing" backLabel="Portal home"><div className="customer-auth-complete"><span><CheckCircle2 size={25} /></span><h2>Account connected</h2><p>Taking you to your customer dashboard…</p><Loader2 className="mx-auto mt-4 h-4 w-4 animate-spin text-blue-600" /></div></CustomerAuthShell>;
  }

  return (
    <CustomerAuthShell title="Finish connecting your account" description="Link your sign-in to the service company that invited you to use the customer portal." eyebrow="Account setup" backHref="/customer/landing" backLabel="Portal home">
      <div className="customer-auth-form-heading">
        <span className="customer-auth-form-kicker">STEP {step} OF 2</span>
        <h2>{step === 1 ? 'Connect your company' : 'Add contact details'}</h2>
        <p>{step === 1 ? 'Enter the company code shared by your service company.' : <>Your account will be connected to <strong>{companyName}</strong>.</>}</p>
      </div>
      <div className="customer-auth-steps" aria-label={`Step ${step} of 2`}><span className={step >= 1 ? 'active' : ''} /><span className={step >= 2 ? 'active' : ''} /></div>
      {error && <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="customer-auth-message error">{error}</motion.div>}

      <AnimatePresence mode="wait">
        {step === 1 ? <motion.div key="company-step" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-5"><div className="customer-auth-company-code"><CompanyCodeField value={companyCode} onChange={setCompanyCode} onValidated={(result) => { setCompanyValid(result.valid); if (result.valid && result.companyName) setCompanyName(result.companyName); }} /></div><button type="button" onClick={handleNext} disabled={!companyValid} className="customer-auth-primary w-full">Continue <span aria-hidden="true">→</span></button></motion.div> : <motion.form key="contact-step" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} onSubmit={handleSubmit} className="customer-auth-form"><div className="customer-auth-field"><label htmlFor="onboarding-phone">Phone number <span className="font-normal text-slate-400">(optional)</span></label><div className="customer-auth-input-wrap"><Phone aria-hidden="true" /><input id="onboarding-phone" type="tel" inputMode="tel" autoComplete="tel" className="customer-auth-input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Your contact number" disabled={isLoading} /></div></div><div className="flex gap-2"><button type="button" onClick={() => setStep(1)} disabled={isLoading} className="customer-auth-secondary flex-1">Back</button><button type="submit" disabled={isLoading} className="customer-auth-primary flex-1">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting…</> : <>Finish setup <span aria-hidden="true">→</span></>}</button></div></motion.form>}
      </AnimatePresence>
    </CustomerAuthShell>
  );
}

export default function OnboardingPage() {
  return <Suspense fallback={<div className="customer-auth-loading"><Loader2 className="h-8 w-8 animate-spin" /></div>}><OnboardingContent /></Suspense>;
}
