'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PlusCircle, User, LogOut, Menu, X, Bell } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

const NAV_ITEMS = [
  { href: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customer/create-job', label: 'New Request', icon: PlusCircle },
  { href: '/customer/profile', label: 'Profile', icon: User },
];

export function CustomerNavbar() {
  const pathname = usePathname();
  const { customer, logout } = useCustomerAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = customer?.name
    ? customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/customer/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-gray-900 font-semibold text-base">Prozync</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Avatar + name */}
            {customer && (
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-xs">{initials}</span>
                </div>
                <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate">
                  {customer.name || customer.email}
                </span>
              </div>
            )}

            <button
              onClick={() => logout()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-gray-200 bg-white overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {customer && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">{initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </div>
                </div>
              )}
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    pathname === href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
