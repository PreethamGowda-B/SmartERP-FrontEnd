'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Activity, ArrowRight, BellRing, Check, ChevronRight,
  ClipboardList, Cog, FileText, Factory, LoaderCircle, MessageCircle,
  ShieldCheck, Wrench,
} from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: index * 0.07, ease: [0.2, 0.7, 0.2, 1] },
  }),
};

const capabilities = [
  {
    icon: ClipboardList,
    title: 'Send a service request',
    body: 'Describe the work you need and connect it to one of your registered machines when applicable.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Activity,
    title: 'Follow job progress',
    body: 'Review customer-visible status, milestones, and site updates as the work moves forward.',
    color: 'from-violet-500 to-fuchsia-600',
  },
  {
    icon: MessageCircle,
    title: 'Stay in the conversation',
    body: 'Message the assigned technician after the job is accepted and share supported files.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: FileText,
    title: 'Keep records together',
    body: 'Find customer-accessible documents, service history, and issued invoices in your portal.',
    color: 'from-emerald-500 to-teal-600',
  },
];

const workflow = [
  { number: '01', icon: Wrench, title: 'Create your request', text: 'Choose a general request or link it to a registered machine.' },
  { number: '02', icon: Factory, title: 'Your service team reviews it', text: 'Follow approval and technician assignment updates in the job timeline.' },
  { number: '03', icon: Activity, title: 'Follow the work', text: 'View progress, messages, and location updates when they are available.' },
];

export default function CustomerLandingPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isAuthenticated, isLoading } = useCustomerAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/customer/dashboard');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--customer-canvas)]" aria-label="Loading customer portal">
        <LoaderCircle className="h-7 w-7 animate-spin text-[var(--customer-primary)] motion-reduce:animate-none" />
      </main>
    );
  }

  if (isAuthenticated) return null;

  const motionProps = reduceMotion
    ? { initial: false as const, whileInView: undefined, viewport: undefined }
    : { initial: 'hidden' as const, whileInView: 'visible' as const, viewport: { once: true, amount: 0.2 } };

  return (
    <main className="overflow-x-clip bg-[var(--customer-canvas)] text-[var(--customer-ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--customer-border)]/80 bg-[var(--customer-surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/customer/landing" className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)] focus-visible:ring-offset-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/15">
              <Factory className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold tracking-tight">Prozync</span>
              <span className="block text-[11px] text-[var(--customer-muted)]">Customer service portal</span>
            </span>
          </Link>

          <nav className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Public navigation">
            <button
              type="button"
              onClick={() => router.push('/customer/login')}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--customer-muted)] transition-colors hover:bg-black/5 hover:text-[var(--customer-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)] dark:hover:bg-white/5"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => router.push('/customer/signup')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--customer-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/15 transition-all hover:-translate-y-0.5 hover:bg-[var(--customer-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)] focus-visible:ring-offset-2 motion-reduce:transform-none"
            >
              Register <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-[var(--customer-border)] bg-[var(--customer-surface)]">
        <div className="pointer-events-none absolute -right-32 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-blue-300/20 blur-[110px] dark:bg-indigo-500/10" />
        <div className="pointer-events-none absolute -bottom-64 left-[30%] -z-10 h-[420px] w-[420px] rounded-full bg-violet-300/20 blur-[100px] dark:bg-violet-500/10" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
          <motion.div {...motionProps} variants={rise} custom={0}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-300" />
              Your service workspace
            </div>
            <h1 className="max-w-2xl text-[clamp(2.45rem,5.4vw,4.35rem)] font-black leading-[1.04] tracking-[-0.055em]">
              Service work,
              <span className="block bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-300 dark:via-indigo-300 dark:to-violet-300">
                easier to follow.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--customer-muted)] sm:text-lg sm:leading-8">
              Send equipment and service requests, follow customer-visible job updates, and keep technician conversations and service records together.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push('/customer/signup')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--customer-primary)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-all hover:-translate-y-0.5 hover:bg-[var(--customer-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)] focus-visible:ring-offset-2 motion-reduce:transform-none"
              >
                Register with company code <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/customer/login')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--customer-border)] bg-[var(--customer-surface)] px-6 py-3 text-sm font-bold transition-colors hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)] dark:hover:bg-white/5"
              >
                Customer sign in <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--customer-muted)]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--customer-success)]" aria-hidden="true" />
              Registration uses your company code and email verification.
            </p>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--customer-border)] pt-6 text-xs font-medium text-[var(--customer-muted)] sm:text-sm">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[var(--customer-success)]" />Job updates in one place</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[var(--customer-success)]" />Equipment-aware requests</span>
            </div>
          </motion.div>

          <motion.div {...motionProps} variants={rise} custom={1} className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -inset-5 -z-10 rounded-[36px] bg-gradient-to-br from-blue-200/50 via-violet-200/35 to-cyan-100/50 blur-2xl dark:from-blue-500/10 dark:via-violet-500/10 dark:to-cyan-500/5" />
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-[var(--customer-surface)] shadow-[0_32px_90px_rgba(26,44,86,.17)] ring-1 ring-slate-900/[0.04] dark:border-white/10 dark:shadow-black/30">
              <div className="flex items-center justify-between border-b border-[var(--customer-border)] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-md shadow-blue-800/15">
                    <Cog className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">Service workspace</p>
                    <p className="mt-0.5 text-xs text-[var(--customer-muted)]">A simple view of the workflow</p>
                  </div>
                </div>
                <span className="rounded-full border border-[var(--customer-border)] bg-[var(--customer-surface-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--customer-muted)]">Preview</span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/90 via-white to-violet-50/80 p-5 dark:border-blue-300/10 dark:from-blue-400/10 dark:via-slate-900/20 dark:to-violet-400/10 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">One connected journey</p>
                      <p className="mt-2 text-xl font-extrabold tracking-tight">From request to records</p>
                    </div>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                      <Factory className="h-6 w-6" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-6 space-y-0">
                    {[
                      { icon: ClipboardList, title: 'Request submitted', description: 'Describe the service work needed', state: 'Request' },
                      { icon: Wrench, title: 'Service team updates', description: 'Review approval and assignment progress', state: 'Progress' },
                      { icon: FileText, title: 'Job records', description: 'Open available documents and invoices', state: 'Records' },
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.state} className="relative flex gap-4 pb-5 last:pb-0">
                          {index < 2 && <span className="absolute left-[17px] top-9 h-[calc(100%-18px)] w-px bg-gradient-to-b from-blue-300 to-indigo-100 dark:from-blue-400/40 dark:to-indigo-300/10" />}
                          <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm dark:border-blue-300/15 dark:bg-slate-900 dark:text-blue-300">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-bold">{item.title}</p>
                              <span className="text-[10px] font-semibold text-[var(--customer-muted)]">{item.state}</span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-[var(--customer-muted)]">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-surface)] px-4 py-3.5">
                  <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden="true" />
                  <p className="text-xs leading-5 text-[var(--customer-muted)]">Technician chat and location appear when the job is eligible and the relevant updates are available.</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-2.5 rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-surface)] px-4 py-3 shadow-xl shadow-slate-900/10 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" /></span>
              <span><span className="block text-xs font-bold">Customer-scoped access</span><span className="mt-0.5 block text-[10px] text-[var(--customer-muted)]">Your portal session controls your records</span></span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <motion.div {...motionProps} variants={rise} className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--customer-primary)]">Built around your service work</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Everything connected to the job.</h2>
          <p className="mt-4 text-base leading-7 text-[var(--customer-muted)]">Use the customer portal to raise requests and return to the updates and records your service team shares.</p>
        </motion.div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                {...motionProps}
                variants={rise}
                custom={index}
                className="group rounded-[22px] border border-[var(--customer-border)] bg-[var(--customer-surface)] p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[var(--customer-shadow)] motion-reduce:transform-none sm:p-6"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-md`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--customer-muted)]">{item.body}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[var(--customer-border)] bg-[var(--customer-surface)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:px-8">
          <motion.div {...motionProps} variants={rise}>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">A clear process</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Know what happens next.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--customer-muted)]">Your job page brings together the status, customer-visible updates, and follow-up actions available for that request.</p>
            <button onClick={() => router.push('/customer/signup')} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-[var(--customer-primary)] hover:text-[var(--customer-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)]">
              Create a customer account <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-3">
            {workflow.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article key={item.number} {...motionProps} variants={rise} custom={index} className="relative rounded-[22px] border border-[var(--customer-border)] bg-[var(--customer-surface-soft)] p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--customer-primary)] shadow-sm dark:bg-slate-800"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="text-xs font-black tracking-widest text-[var(--customer-muted)]/70">{item.number}</span>
                  </div>
                  <h3 className="mt-5 text-sm font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--customer-muted)]">{item.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#10244b] via-[#1c3c76] to-[#3547a2] px-6 py-10 text-white shadow-2xl shadow-blue-950/15 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-14 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Customer access</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Keep your service work in view.</h2>
              <p className="mt-3 text-sm leading-6 text-blue-100/85">Use the company code provided by your service organization to register, or sign in to return to your requests.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => router.push('/customer/signup')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-900 shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900 motion-reduce:transform-none">
                Register with company code <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => router.push('/customer/login')} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--customer-border)] bg-[var(--customer-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-[var(--customer-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold text-[var(--customer-ink)]"><Factory className="h-4 w-4 text-[var(--customer-primary)]" />Prozync Customer Portal</div>
          <p>Customer access is provided through your service company.</p>
          <div className="flex gap-4">
            <button onClick={() => router.push('/customer/login')} className="font-semibold hover:text-[var(--customer-primary)]">Sign in</button>
            <button onClick={() => router.push('/customer/signup')} className="font-semibold hover:text-[var(--customer-primary)]">Register</button>
          </div>
        </div>
      </footer>
    </main>
  );
}
