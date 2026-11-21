'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ArrowLeftRight,
  Users,
  RefreshCw,
  AlertCircle,
  Send,
  Layout,
  Repeat,
  Share2,
  Briefcase,
  FileText,
  Code2,
  Settings,
  UserCheck,
  Zap,
  LogOut,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

const navGroups = [
  {
    items: [
      { label: 'Overview', href: '/dashboard', icon: Home, exact: true },
    ],
  },
  {
    label: 'TRANSACTIONS & FLOWS',
    items: [
      { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight, exact: false },
      { label: 'Customers', href: '/dashboard/customers', icon: Users, exact: false },
      { label: 'Refunds', href: '/dashboard/refunds', icon: RefreshCw, exact: false },
      { label: 'Disputes', href: '/dashboard/disputes', icon: AlertCircle, exact: false },
    ],
  },
  {
    label: 'PAYMENTS & RAILS',
    items: [
      { label: 'Payouts', href: '/dashboard/payouts', icon: Send, exact: false },
      { label: 'Beneficiaries', href: '/dashboard/beneficiaries', icon: UserCheck, exact: false },
      { label: 'Payment Pages', href: '/dashboard/payment-pages', icon: Layout, exact: false },
      { label: 'Recurring Plans', href: '/dashboard/recurring', icon: Repeat, exact: false },
      { label: 'Split Payments', href: '/dashboard/split-payments', icon: Share2, exact: false },
    ],
  },
  {
    label: 'FINANCIAL INTELLIGENCE',
    items: [
      { label: 'Settlements', href: '/dashboard/settlements', icon: Briefcase, exact: false },
      { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, exact: false },
    ],
  },
  {
    label: 'DEVELOPER & SETTINGS',
    items: [
      { label: 'Developers', href: '/dashboard/developers', icon: Code2, exact: false },
      { label: 'Go Live', href: '/dashboard/go-live', icon: Zap, exact: false },
      { label: 'Team', href: '/dashboard/team', icon: Users, exact: false },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, exact: false },
    ],
  },
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
    <aside className="w-[240px] bg-zinc-950 text-zinc-400 flex flex-col h-full border-r border-zinc-800/80 select-none">
      
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-zinc-800/80 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-tight text-sm">ATLAS</span>
              <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 px-1 py-0.2 rounded font-medium">v1.1</span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate max-w-[130px] leading-tight mt-0.5">{merchantName}</p>
          </div>
        </Link>
      </div>

      {/* Navigation Group Items */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto no-scrollbar">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-zinc-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-zinc-800/90 text-white font-medium shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 font-normal'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-light' : 'text-zinc-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer System Status & Logout */}
      <div className="p-3 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-zinc-400 bg-zinc-900/50 rounded-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-zinc-300">Operational</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-500">99.99%</span>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-zinc-900/60 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
}
