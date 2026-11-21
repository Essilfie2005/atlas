'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  ArrowLeftRight, 
  Send, 
  Code2, 
  Menu, 
  X, 
  Users, 
  UserCheck, 
  Layout, 
  Repeat, 
  Share2, 
  Briefcase, 
  FileText, 
  Settings, 
  Zap, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface MobileNavProps {
  merchantName?: string;
}

export function MobileNav({ merchantName = 'Your Business' }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primaryTabs = [
    { label: 'Home', href: '/dashboard', icon: Home, exact: true },
    { label: 'Activity', href: '/dashboard/transactions', icon: ArrowLeftRight, exact: false },
    { label: 'Payouts', href: '/dashboard/payouts', icon: Send, exact: false },
    { label: 'Developers', href: '/dashboard/developers', icon: Code2, exact: false },
  ];

  const secondaryNavSections = [
    {
      title: 'Payments & Revenue',
      items: [
        { label: 'Beneficiaries', href: '/dashboard/beneficiaries', icon: UserCheck, desc: 'Saved payout accounts' },
        { label: 'Payment Pages', href: '/dashboard/payment-pages', icon: Layout, desc: 'Hosted checkout links' },
        { label: 'Customers', href: '/dashboard/customers', icon: Users, desc: 'Merchant customer directory' },
        { label: 'Recurring Billing', href: '/dashboard/recurring', icon: Repeat, desc: 'Subscriptions & plans' },
        { label: 'Split Payments', href: '/dashboard/split-payments', icon: Share2, desc: 'Multi-party disbursement' },
      ],
    },
    {
      title: 'Reporting & Compliance',
      items: [
        { label: 'Settlements', href: '/dashboard/settlements', icon: Briefcase, desc: 'Net merchant balances' },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, desc: 'Security & system history' },
        { label: 'Go Live Checklist', href: '/dashboard/go-live', icon: Zap, desc: 'Compliance & verification' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { label: 'Settings', href: '/dashboard/settings', icon: Settings, desc: 'Profile & preferences' },
        { label: 'Team', href: '/dashboard/team', icon: Users, desc: 'Role-based access' },
      ],
    },
  ];

  const handleSignOut = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  return (
    <>
      {/* ── Fixed Bottom Tab Bar (Mobile & Tablet Only) ── */}
      <nav 
        aria-label="Mobile Bottom Navigation" 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/90 dark:border-zinc-800/90 px-3 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact 
              ? pathname === tab.href 
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
                  isActive
                    ? 'text-brand font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-normal'
                }`}
              >
                <div className={`p-1 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400' 
                    : ''
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </Link>
            );
          })}

          {/* "More" Menu Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90 ${
              drawerOpen
                ? 'text-brand font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-normal'
            }`}
            aria-label="Open full menu"
          >
            <div className={`p-1 rounded-xl transition-colors ${
              drawerOpen 
                ? 'bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400' 
                : ''
            }`}>
              <Menu className="w-5 h-5" strokeWidth={drawerOpen ? 2.25 : 1.75} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* ── Slide-up Bottom Sheet Drawer for "More" ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Dimmed backdrop */}
          <div 
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl border-t border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Grab handle indicator */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Workspace Menu</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{merchantName}</p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Navigation Sections */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 pb-8">
              {secondaryNavSections.map((section) => (
                <div key={section.title}>
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 px-2 mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition-all active:scale-[0.98] ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-brand dark:text-blue-400'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isActive 
                                ? 'bg-brand text-white' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                                {item.label}
                              </p>
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Sign Out Action */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-3 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of ATLAS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
