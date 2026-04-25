'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, MapPin, Zap, ArrowRight } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export default function CustomerLandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCustomerAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/customer/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // Don't render landing if authenticated (redirect will happen)
  if (!isLoading && isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Monitor your service requests with live status updates and progress tracking.',
    },
    {
      icon: CheckCircle,
      title: 'Job Status Updates',
      description: 'Get instant notifications when your request is accepted, in progress, or completed.',
    },
    {
      icon: MapPin,
      title: 'Live Location',
      description: 'Track the assigned technician location in real-time on an interactive map.',
    },
    {
      icon: Zap,
      title: 'Fast Response',
      description: 'Submit requests instantly and get connected with available service providers.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Submit Request',
      description: 'Create a service request with details about your issue or need.',
    },
    {
      number: '02',
      title: 'Employee Accepts',
      description: 'A qualified technician reviews and accepts your request.',
    },
    {
      number: '03',
      title: 'Track Progress',
      description: 'Monitor real-time updates and location until completion.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Track your service requests in real-time
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Submit issues, monitor progress, and get live updates from your service provider.
              Stay informed every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/customer/signup')}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/customer/login')}
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all"
              >
                Login
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage service requests
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete platform designed to keep you connected with your service provider.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-blue-100 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-6 w-12 h-0.5 bg-gray-200" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Create your account and start tracking your service requests today.
            </p>
            <button
              onClick={() => router.push('/customer/signup')}
              className="px-8 py-3.5 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Prozync</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/customer/login')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/customer/signup')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Prozync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
