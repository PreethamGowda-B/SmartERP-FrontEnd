'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, ChevronDown, Cpu, Factory, FileText, History, LayoutDashboard,
  List, LogOut, Menu, PlusCircle, Repeat, Sparkles, User, X,
} from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useCustomerNotifications } from '@/contexts/CustomerNotificationContext';
import { CustomerNotificationDrawer } from '@/components/customer/layout/CustomerNotificationDrawer';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_ITEMS = [
  { href: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { href: '/customer/machines', label: 'My Machines', icon: Cpu, group: 'main' },
  { href: '/customer/jobs', label: 'Requests', icon: List, group: 'main' },
  { href: '/customer/create-job', label: 'New Request', icon: PlusCircle, group: 'main' },
  { href: '/customer/documents', label: 'Documents', icon: FileText, group: 'main' },
  { href: '/customer/onboarding-wizard', label: 'Fleet Setup', icon: Sparkles, group: 'more' },
  { href: '/customer/history', label: 'History', icon: History, group: 'more' },
  { href: '/customer/recurring', label: 'Recurring', icon: Repeat, group: 'more' },
] as const;

const MOBILE_ITEMS = [
  ...NAV_ITEMS,
  { href: '/customer/notifications', label: 'Notifications', icon: Bell, group: 'more' },
  { href: '/customer/profile', label: 'Profile', icon: User, group: 'more' },
] as const;

export function CustomerNavbar() {
  const pathname = usePathname();
  const { customer, logout } = useCustomerAuth();
  const { getUnreadCount } = useCustomerNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const unreadCount = getUnreadCount();
  const initials = customer?.name
    ? customer.name.split(' ').map((part: string) => part[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const isActive = (href: string) => pathname === href || (href !== '/customer/dashboard' && pathname.startsWith(href));
  const linkClass = (href: string) => `flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
    isActive(href)
      ? 'border border-[var(--customer-primary)]/20 bg-[var(--customer-primary)]/10 text-[var(--customer-primary)]'
      : 'text-[var(--customer-muted)] hover:bg-black/5 hover:text-[var(--customer-ink)] dark:hover:bg-white/5'
  }`;

  return (
    <nav aria-label="Customer portal navigation" className="sticky top-0 z-50 border-b border-[var(--customer-border)]/90 bg-[var(--customer-surface)]/90 shadow-[0_4px_24px_rgba(20,34,69,.04)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-2">
          <Link href="/customer/dashboard" className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)] focus-visible:ring-offset-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-900/15">
              <Factory className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-extrabold tracking-tight text-[var(--customer-ink)]">Prozync</span>
              <span className="hidden rounded-full border border-[var(--customer-primary)]/20 bg-[var(--customer-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--customer-primary)] sm:inline-block">Customer</span>
            </span>
          </Link>

          <div className="hidden shrink-0 items-center gap-0.5 lg:flex">
            {NAV_ITEMS.filter((item) => item.group === 'main').map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)} aria-current={isActive(href) ? 'page' : undefined}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{label}
              </Link>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                aria-label="More customer portal pages"
                className={`flex min-h-10 items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--customer-primary)] ${NAV_ITEMS.some((item) => item.group === 'more' && isActive(item.href)) ? 'bg-[var(--customer-primary)]/10 text-[var(--customer-primary)]' : 'text-[var(--customer-muted)] hover:bg-black/5 hover:text-[var(--customer-ink)] dark:hover:bg-white/5'}`}
              >More <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
              <AnimatePresence>
                {moreOpen && (
                  <>
                    <button type="button" aria-label="Close more pages menu" onClick={() => setMoreOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                    <motion.div initial={{ opacity: 0, y: -5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5 }} className="absolute right-0 z-50 mt-2 flex w-52 flex-col gap-1 rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-surface)] p-1.5 shadow-xl">
                      {NAV_ITEMS.filter((item) => item.group === 'more').map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} onClick={() => setMoreOpen(false)} className={`flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${isActive(href) ? 'bg-[var(--customer-primary)]/10 text-[var(--customer-primary)]' : 'text-[var(--customer-muted)] hover:bg-black/5 hover:text-[var(--customer-ink)] dark:hover:bg-white/5'}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />{label}
                        </Link>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <CustomerNotificationDrawer />
            <ThemeToggle compact />
            {customer && (
              <Link href="/customer/profile" title="View profile" aria-label="View profile" className={`flex h-10 items-center gap-2 rounded-xl border px-2 transition-colors ${isActive('/customer/profile') ? 'border-[var(--customer-primary)]/25 bg-[var(--customer-primary)]/10' : 'border-[var(--customer-border)] bg-[var(--customer-surface-soft)] hover:bg-black/5 dark:hover:bg-white/5'}`}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-[10px] font-extrabold text-blue-800 dark:from-blue-400/15 dark:to-indigo-400/15 dark:text-blue-200">{initials}</span>
                <span className="hidden max-w-[125px] truncate text-xs font-semibold text-[var(--customer-ink)] md:inline">{customer.name || customer.email}</span>
              </Link>
            )}
            <button type="button" onClick={() => void logout()} className="hidden min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-[var(--customer-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600 sm:flex" aria-label="Sign out">
              <LogOut className="h-4 w-4" aria-hidden="true" /><span className="hidden xl:inline">Sign out</span>
            </button>
            <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="customer-mobile-navigation" aria-label={mobileOpen ? 'Close customer navigation' : 'Open customer navigation'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--customer-muted)] transition-colors hover:bg-black/5 hover:text-[var(--customer-ink)] dark:hover:bg-white/5 lg:hidden">
              {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div id="customer-mobile-navigation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-[var(--customer-border)] bg-[var(--customer-surface)] lg:hidden">
            <div className="mx-auto max-h-[calc(100dvh-68px)] max-w-7xl space-y-1 overflow-y-auto px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              {customer && (
                <div className="mb-2 flex items-center gap-3 border-b border-[var(--customer-border)] px-2 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-xs font-extrabold text-blue-800 dark:from-blue-400/15 dark:to-indigo-400/15 dark:text-blue-200">{initials}</span>
                  <span className="min-w-0"><span className="block truncate text-xs font-bold text-[var(--customer-ink)]">{customer.name}</span><span className="mt-0.5 block truncate text-[10px] text-[var(--customer-muted)]">{customer.email}</span></span>
                </div>
              )}
              {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} aria-current={isActive(href) ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive(href) ? 'bg-[var(--customer-primary)]/10 text-[var(--customer-primary)]' : 'text-[var(--customer-muted)] hover:bg-black/5 hover:text-[var(--customer-ink)] dark:hover:bg-white/5'}`}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{label}</span>
                  {label === 'Notifications' && unreadCount > 0 && <span className="ml-auto rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </Link>
              ))}
              <button type="button" onClick={() => { setMobileOpen(false); void logout(); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--customer-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600 sm:hidden">
                <LogOut className="h-4 w-4" aria-hidden="true" />Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
