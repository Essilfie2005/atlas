'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Activity, Users, RefreshCw, AlertCircle, Send, Layout, Repeat, Share2, Briefcase, FileText, Code, Settings, UserCheck, X, Zap } from 'lucide-react';

const navGroups = [
  {
    label: '',
    items: [
      { label: 'Home', href: '/dashboard', icon: <Home className="w-4 h-4" /> },
    ]
  },
  {
    label: 'CORE',
    items: [
      { label: 'Transactions', href: '/dashboard/transactions', icon: <Activity className="w-4 h-4" /> },
      { label: 'Customers',    href: '/dashboard/customers',    icon: <Users className="w-4 h-4" /> },
      { label: 'Refunds',      href: '/dashboard/refunds',      icon: <RefreshCw className="w-4 h-4" /> },
      { label: 'Disputes',     href: '/dashboard/disputes',     icon: <AlertCircle className="w-4 h-4" /> },
    ]
  },
  {
    label: 'PAYMENTS',
    items: [
      { label: 'Payouts',        href: '/dashboard/payouts',        icon: <Send className="w-4 h-4" /> },
      { label: 'Beneficiaries',  href: '/dashboard/beneficiaries',  icon: <UserCheck className="w-4 h-4" /> },
      { label: 'Payment Pages',  href: '/dashboard/payment-pages',  icon: <Layout className="w-4 h-4" /> },
      { label: 'Recurring',      href: '/dashboard/recurring',      icon: <Repeat className="w-4 h-4" /> },
      { label: 'Split Payments', href: '/dashboard/split-payments', icon: <Share2 className="w-4 h-4" /> },
    ]
  },
  {
    label: 'REPORTS',
    items: [
      { label: 'Settlements', href: '/dashboard/settlements', icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Audit Logs',  href: '/dashboard/audit-logs',  icon: <FileText className="w-4 h-4" /> },
    ]
  },
  {
    label: 'CONFIGURE',
    items: [
      { label: 'Team',       href: '/dashboard/team',       icon: <Users className="w-4 h-4" /> },
      { label: 'Go Live',    href: '/dashboard/go-live',    icon: <Zap className="w-4 h-4" /> },
      { label: 'Developers', href: '/dashboard/developers', icon: <Code className="w-4 h-4" /> },
      { label: 'Settings',   href: '/dashboard/settings',   icon: <Settings className="w-4 h-4" /> },
    ]
  }
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const merchantName = typeof window !== 'undefined'
    ? sessionStorage.getItem('atlas_merchant_name') ?? 'Your Business'
    : 'Your Business';

  const handleSignOut = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  return (
    <div className="w-[240px] bg-sidebar text-sidebar-muted flex flex-col h-screen overflow-y-auto">

      {/* Logo + mobile close */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight leading-none">ATLAS</span>
            <p className="text-[10px] text-white/40 leading-none mt-0.5 truncate max-w-[130px]">{merchantName}</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group, i) => (
          <div key={i}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item, j) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <li key={j}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-brand/20 text-white border border-brand/30'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span className={cn('shrink-0', isActive ? 'text-blue-400' : 'text-white/40')}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white transition-all"
        >
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth={1.75} /><path strokeLinecap="round" strokeWidth={1.75} d="M4 20c0-4 3.582-7 8-7s8 3 8 7" /></svg>
          Account
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
