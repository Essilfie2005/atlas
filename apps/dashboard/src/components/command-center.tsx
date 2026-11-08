'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const pages = [
  { name: 'Home', path: '/dashboard' },
  { name: 'Transactions', path: '/dashboard/transactions' },
  { name: 'Customers', path: '/dashboard/customers' },
  { name: 'Refunds', path: '/dashboard/refunds' },
  { name: 'Disputes', path: '/dashboard/disputes' },
  { name: 'Payouts', path: '/dashboard/payouts' },
  { name: 'Payment Pages', path: '/dashboard/payment-pages' },
  { name: 'Recurring', path: '/dashboard/recurring' },
  { name: 'Split Payments', path: '/dashboard/split-payments' },
  { name: 'Settlements', path: '/dashboard/settlements' },
  { name: 'Audit Logs', path: '/dashboard/audit-logs' },
  { name: 'Developers', path: '/dashboard/developers' },
  { name: 'Settings', path: '/dashboard/settings' },
];

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open) return null;

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            placeholder="Search pages or type a command..."
            className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredPages.length > 0 ? (
            <div className="mb-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pages
              </div>
              {filteredPages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => {
                    router.push(page.path);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center text-sm font-medium text-slate-700"
                >
                  {page.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No results found for "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
