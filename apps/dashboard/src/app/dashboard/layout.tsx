'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { ToastProvider } from '@/components/toast';
import { ModeProvider, ModeBadge } from '@/components/mode-toggle';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeProvider, ThemeToggle } from '@/components/theme-provider';
import { CommandCenter } from '@/components/command-center';
import Link from 'next/link';

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Overview',
  transactions: 'Transactions',
  customers: 'Customers',
  refunds: 'Refunds',
  disputes: 'Disputes',
  payouts: 'Payouts',
  beneficiaries: 'Beneficiaries',
  'payment-pages': 'Payment Pages',
  recurring: 'Recurring Plans',
  'split-payments': 'Split Payments',
  settlements: 'Settlements',
  'audit-logs': 'Audit Logs',
  developers: 'Developer Hub',
  settings: 'Settings',
  team: 'Team Members',
  'go-live': 'Go Live Verification',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = sessionStorage.getItem('atlas_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setMerchantName(sessionStorage.getItem('atlas_merchant_name') ?? 'Your Business');
  }, [router]);

  // Auto-close sidebar drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? 'dashboard';
  const pageTitle = breadcrumbMap[currentSegment] ?? currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);
  const isOverview = currentSegment === 'dashboard';

  return (
    <ModeProvider>
      <ThemeProvider>
        <ToastProvider>
          <div className="flex h-[100dvh] bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
            <CommandCenter />

            {/* Desktop Sidebar (Fixed left, width 240px) */}
            <div className="hidden lg:block fixed top-0 left-0 h-[100dvh] z-30">
              <Sidebar />
            </div>

            {/* Main Content Workspace */}
            <div className="flex-1 lg:ml-[240px] flex flex-col h-[100dvh] overflow-hidden">
              
              {/* Header Bar */}
              <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 sticky top-0 z-20 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Brand mark on mobile */}
                  <div className="lg:hidden w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>

                  {/* Breadcrumb / Page Title */}
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <Link 
                      href="/dashboard" 
                      className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors hidden sm:inline font-medium"
                    >
                      ATLAS
                    </Link>
                    {!isOverview && (
                      <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">/</span>
                    )}
                    <h1 className="font-semibold text-zinc-900 dark:text-white truncate text-base sm:text-base">
                      {isOverview ? 'Overview' : pageTitle}
                    </h1>
                  </div>
                </div>

                {/* Right utility items */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {/* Search hotkey hint (Desktop) */}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-command-center'))}
                    className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <span>Search</span>
                    <kbd className="px-1 py-0.5 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">⌘K</kbd>
                  </button>

                  {/* Mode Badge (Test vs Live) */}
                  <ModeBadge />

                  {/* Notifications */}
                  <NotificationBell />

                  {/* Theme Switcher */}
                  <ThemeToggle />

                  {/* Merchant Avatar */}
                  <div 
                    title={merchantName}
                    className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-semibold shadow-sm flex-shrink-0"
                  >
                    {merchantName.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
              </header>

              {/* Scrollable Page Canvas */}
              <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-8 overscroll-contain pb-28 lg:pb-10">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>

              {/* Dedicated Mobile Navigation Dock (Visible on mobile/tablet only) */}
              <MobileNav merchantName={merchantName} />

            </div>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </ModeProvider>
  );
}
