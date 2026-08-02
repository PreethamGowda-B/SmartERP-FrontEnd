'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PlusCircle, User, LogOut, Menu, X, Bell, List, History, Repeat } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useCustomerNotifications } from '@/contexts/CustomerNotificationContext';
import { NotificationCenterDrawer } from '@/components/notification-center-drawer';
import { ThemeToggle } from '@/components/theme-toggle';

const MAIN_NAV_ITEMS = [
  { href: '/customer/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/customer/jobs',       label: 'Requests',    icon: List },
  { href: '/customer/create-job', label: 'New Request', icon: PlusCircle },
  { href: '/customer/history',    label: 'History',     icon: History },
  { href: '/customer/recurring',  label: 'Recurring',   icon: Repeat },
];

const MOBILE_NAV_ITEMS = [
  ...MAIN_NAV_ITEMS,
  { href: '/customer/notifications', label: 'Notifications', icon: Bell },
  { href: '/customer/profile',       label: 'Profile',       icon: User },
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
    <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo */}
          <Link href="/customer/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm">
              <span>P</span>
            </div>
            <div className="flex items-center">
              <span className="text-foreground font-extrabold text-base tracking-tight whitespace-nowrap">Prozync</span>
              <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap hidden sm:inline-block">
                Customer
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
            {MAIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/customer/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-primary/15 text-primary font-bold shadow-2xs border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Utilities (Notifications Bell, Theme, Profile Pill, Sign Out) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Enterprise Notification Center Popover */}
            <NotificationCenterDrawer />

            <ThemeToggle compact />

            {/* User Profile Pill */}
            {customer && (
              <Link
                href="/customer/profile"
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all shrink-0 ${
                  pathname === '/customer/profile'
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-muted/40 border-border/60 hover:bg-muted/80 text-foreground'
                }`}
                title="View Profile"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-[11px] shrink-0">
                  <span>{initials}</span>
                </div>
                <span className="text-xs font-semibold max-w-[110px] truncate hidden md:inline-block whitespace-nowrap">
                  {customer.name || customer.email}
                </span>
              </Link>
            )}

            {/* Sign Out Button */}
            <button
              onClick={() => logout()}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-medium whitespace-nowrap shrink-0"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign out</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
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
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                    <span>{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{customer.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{customer.email}</p>
                  </div>
                </div>
              )}
              
              {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-primary/15 text-primary font-bold border-l-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{label}</span>
                    {label === 'Notifications' && unreadCount > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
