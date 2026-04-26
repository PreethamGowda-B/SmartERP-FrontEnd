'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle, Clock, MapPin, Zap, ArrowRight,
  Shield, Bell, BarChart3, ChevronRight,
} from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function CustomerLandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push('/customer/dashboard');
  }, [isLoading, isAuthenticated, router]);

  if (!isLoading && isAuthenticated) return null;

  const features = [
    { icon: Clock,    title: 'Real-time Tracking',   description: 'Monitor every service request with live status updates from submission to completion.' },
    { icon: MapPin,   title: 'Live Location',         description: 'See exactly where your assigned technician is on an interactive map.' },
    { icon: Bell,     title: 'Instant Notifications', description: 'Get notified the moment your request is accepted, updated, or completed.' },
    { icon: Shield,   title: 'Secure & Private',      description: 'Your data is protected with enterprise-grade security and role-based access.' },
  ];

  const steps = [
    { number: '01', title: 'Submit a Request',    description: 'Describe your issue, set priority, and submit in under a minute.' },
    { number: '02', title: 'Technician Accepts',  description: 'A qualified technician reviews and accepts your request.' },
    { number: '03', title: 'Track Live Progress', description: 'Follow real-time updates and location until the job is done.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Prozync</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/customer/login')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/customer/signup')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-b from-blue-50/60 to-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-size-[48px_48px] opacity-30" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Live service tracking
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Track your service
                <span className="text-blue-600"> requests</span>
                <br />in real-time
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-lg">
                Submit issues, monitor progress, and get live updates from your service provider — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/customer/signup')}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push('/customer/login')}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all"
                >
                  Sign in
                </button>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {[
                  { label: 'Requests tracked' },
                  { label: 'Response time' },
                  { label: 'Satisfaction' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {stat.label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: dashboard mockup */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                {/* Mockup topbar */}
                <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-md h-5 mx-4" />
                </div>

                {/* Mockup content */}
                <div className="p-5 bg-gray-50">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Open', value: '3', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Active', value: '1', color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Done', value: '12', color: 'text-green-600', bg: 'bg-green-50' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3">
                        <div className={`text-xs font-medium ${stat.color} mb-1`}>{stat.label}</div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Job list mockup */}
                  <div className="space-y-2">
                    {[
                      { title: 'Fix leaking pipe in bathroom', status: 'Active', statusColor: 'bg-amber-50 text-amber-700', progress: 65 },
                      { title: 'Electrical inspection needed', status: 'Open', statusColor: 'bg-blue-50 text-blue-700', progress: 0 },
                      { title: 'AC unit maintenance', status: 'Completed', statusColor: 'bg-green-50 text-green-700', progress: 100 },
                    ].map((job, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-800 truncate flex-1 mr-2">{job.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.statusColor}`}>{job.status}</span>
                        </div>
                        {job.progress > 0 && (
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${job.progress}%` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Job Completed</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to stay informed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete platform designed to keep you connected with your service provider at every step.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600">Get started in three simple steps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-blue-200" />

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.15}
                className="relative text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-blue-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <span className="text-2xl font-bold text-blue-600">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              Join your company on Prozync and start tracking your service requests today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/customer/signup')}
                className="px-8 py-3.5 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-lg"
              >
                Create Free Account
              </button>
              <button
                onClick={() => router.push('/customer/login')}
                className="px-8 py-3.5 text-base font-medium text-white border border-blue-400 hover:bg-blue-500 rounded-xl transition-all"
              >
                Sign in
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Prozync</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => router.push('/customer/login')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Login</button>
              <button onClick={() => router.push('/customer/signup')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign Up</button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Prozync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
