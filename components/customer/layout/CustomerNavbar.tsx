'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PlusCircle, User, LogOut, Menu, X, Bell, List, History, Repeat } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useCustomerNotifications } from '@/contexts/CustomerNotificationContext';

import { ThemeToggle } from '@/components/theme-toggle';

const NAV_ITEMS = [
  { href: '/customer/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/customer/jobs',          label: 'All Requests', icon: List },
  { href: '/customer/create-job',    label: 'New Request',  icon: PlusCircle },
  { href: '/customer/history',       label: 'History',      icon: History },
  { href: '/customer/recurring',     label: 'Recurring',    icon: Repeat },
  { href: '/customer/notifications', label: 'Notifications', icon: Bell },
  { href: '/customer/profile',       label: 'Profile',      icon: User },
];

export function CustomerNavbar() {
  const pathname = usePathname();
  const { customer, logout } = useCustomerAuth();
  const { getUnreadCount } = useCustomerNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = getUnreadCount();

  const initials = customer?.name
    ? customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/customer/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm">
              <span>P</span>
            </div>
            <div>
              <span className="text-foreground font-extrabold text-base tracking-tight">Prozync</span>
              <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Customer
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-primary/15 text-primary font-bold border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle compact />

            {/* Avatar + name */}
            {customer && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs">
                  <span>{initials}</span>
                </div>
                <span className="text-xs text-foreground font-semibold max-w-[120px] truncate">
                  {customer.name || customer.email}
                </span>
              </div>
            )}

            <button
              onClick={() => logout()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-medium"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
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
            className="lg:hidden border-t border-border/80 bg-card overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {customer && (
                <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-border/60">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs">
                    <span>{initials}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{customer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
              )}
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      pathname === href
                        ? 'bg-primary/15 text-primary font-bold border-l-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    {label === 'Notifications' && unreadCount > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
              ))}
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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
