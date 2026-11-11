'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Activity, DollarSign, ArrowUpRight } from 'lucide-react';
import { formatMoney, getMerchantDefaultCurrency, getCurrencySymbol } from '@/lib/currency';
import Link from 'next/link';

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [merchantRes, recentTxRes, countRes]: [any, any, any] = await Promise.all([
          apiFetch('/v1/merchants/me').catch(() => null),
          apiFetch('/v1/payment-intents?limit=5&take=5').catch(() => ({ items: [], data: [] })),
          apiFetch('/v1/payment-intents?limit=1&take=1').catch(() => ({ total: 0, pagination: { total: 0 } }))
        ]);
        
        const recentItems = recentTxRes?.items ?? recentTxRes?.data ?? [];
        const totalCount = countRes?.pagination?.total ?? countRes?.total ?? 0;
        
        setMerchant(merchantRes);
        setRecentTransactions(recentItems);
        setTotalTransactions(totalCount);
        
        const totalVol = recentItems.reduce((acc: number, tx: any) => acc + (Number(tx.amount) || 0), 0);
        setVolume(totalVol);
      } catch (error) {
        console.error('Error loading dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2].map(i => (
             <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const merchantCurrency = getMerchantDefaultCurrency(merchant?.country);
  const primaryCurrency = recentTransactions[0]?.currency || merchantCurrency;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back{merchant?.legalName || merchant?.name ? `, ${merchant.legalName || merchant.name}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Here is an overview of your payment volume and activity.</p>
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">Total Volume (Recent)</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              {getCurrencySymbol(primaryCurrency)}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatMoney(volume, primaryCurrency)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">Total Transactions</h3>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalTransactions}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
          <Link
            href="/dashboard/transactions"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400 text-sm">
              No transactions yet. Start accepting payments via the ATLAS API or Checkout Modal.
            </div>
          ) : (
            <>
              {/* Desktop Table View (hidden on phones) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          {formatMoney(tx.amount, tx.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            tx.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            tx.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {tx.customerEmail || tx.metadata?.customerEmail || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (optimized for phones) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((tx: any) => (
                  <Link
                    key={tx.id}
                    href={`/dashboard/transactions/${tx.id}`}
                    className="p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="font-bold text-slate-900 dark:text-white text-base">
                        {formatMoney(tx.amount, tx.currency)}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">
                        {tx.customerEmail || tx.metadata?.customerEmail || tx.description || 'Payment'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        tx.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        tx.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {tx.status}
                      </span>
                      <span className="text-[11px] text-slate-400">Tap for details →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
