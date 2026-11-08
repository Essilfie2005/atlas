'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
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
  recurring: 'Recurring',
  'split-payments': 'Split Payments',
  settlements: 'Settlements',
  'audit-logs': 'Audit Logs',
  developers: 'Developers',
  settings: 'Settings',
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
    if (!token) { router.push('/login'); return; }
    setMerchantName(sessionStorage.getItem('atlas_merchant_name') ?? '');
  }, [router]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (!mounted) return null;

  const segments = pathname.split('/').filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? 'dashboard';
  const pageTitle = breadcrumbMap[currentSegment] ?? currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);
  const isOverview = currentSegment === 'dashboard';

  return (
    <ModeProvider>
    <ThemeProvider>
    <ToastProvider>
      <div className="flex h-screen bg-[#F0F6FF] dark:bg-slate-950 overflow-hidden">
        <CommandCenter />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — hidden on mobile unless open */}
        <div className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main area */}
        <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen overflow-hidden">

          {/* Top header bar */}
          <header className="h-14 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border dark:border-slate-800 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm">
                <Link href="/dashboard" className="text-muted hover:text-[#0B1F3A] transition-colors hidden sm:block">ATLAS</Link>
                {!isOverview && (
                  <>
                    <svg className="w-4 h-4 text-muted/50 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-[#0B1F3A]">{pageTitle}</span>
                  </>
                )}
                {isOverview && <span className="font-medium text-[#0B1F3A] sm:hidden">Overview</span>}
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mode toggle badge */}
              <div className="hidden sm:block">
                <ModeBadge />
              </div>

              {/* Notification bell */}
              <NotificationBell />

              {/* Dark mode toggle */}
              <ThemeToggle />

              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-blue-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {merchantName.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 dark:bg-slate-950">
            <div className="max-w-[1200px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
    </ThemeProvider>
    </ModeProvider>
  );
}
