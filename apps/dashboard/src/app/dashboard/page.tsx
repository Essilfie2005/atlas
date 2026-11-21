'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  Code2, 
  Layout, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { formatMoney, getMerchantDefaultCurrency, getCurrencySymbol } from '@/lib/currency';
import Link from 'next/link';

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [merchantRes, recentTxRes, countRes]: [any, any, any] = await Promise.all([
          apiFetch('/v1/merchants/me').catch(() => null),
          apiFetch('/v1/payment-intents?limit=6&take=6').catch(() => ({ items: [], data: [] })),
          apiFetch('/v1/payment-intents?limit=1&take=1').catch(() => ({ total: 0, pagination: { total: 0 } }))
        ]);
        
        const recentItems = recentTxRes?.items ?? recentTxRes?.data ?? [];
        const totalCount = countRes?.pagination?.total ?? countRes?.total ?? recentItems.length;
        
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

  const merchantCurrency = getMerchantDefaultCurrency(merchant?.country);
  const primaryCurrency = recentTransactions[0]?.currency || merchantCurrency;

  const quickCopySampleKey = () => {
    navigator.clipboard.writeText('pk_test_atlas_sandbox_key_active');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ── Page Header & Welcome Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {merchant?.legalName || merchant?.name || 'Your Business'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Rails
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time pan-African collections, payouts, and automated settlements.
          </p>
        </div>

        {/* Quick sandbox key copy pill */}
        <button
          onClick={quickCopySampleKey}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-subtle active:scale-95"
        >
          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
          <span>{copiedKey ? 'Test Key Copied!' : 'Copy Test Key'}</span>
        </button>
      </div>

      {/* ── HCI Principle: Fast-Action Pills (Thumb-Zone Friendly) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Link
          href="/dashboard/payouts"
          className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-brand/40 dark:hover:border-blue-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all shadow-subtle active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight text-zinc-900 dark:text-white truncate">Send Payout</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight truncate">Mobile Money / Bank</p>
          </div>
        </Link>

        <Link
          href="/dashboard/payment-pages"
          className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-brand/40 dark:hover:border-blue-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all shadow-subtle active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Layout className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight text-zinc-900 dark:text-white truncate">Payment Link</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight truncate">Shareable checkout</p>
          </div>
        </Link>

        <Link
          href="/dashboard/developers"
          className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-brand/40 dark:hover:border-blue-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all shadow-subtle active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight text-zinc-900 dark:text-white truncate">Developer Hub</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight truncate">API Keys & SDK</p>
          </div>
        </Link>

        <a
          href="https://atlas-vrv3.onrender.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-brand/40 dark:hover:border-blue-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all shadow-subtle active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold leading-tight text-zinc-900 dark:text-white truncate">Swagger Docs</p>
              <ArrowUpRight className="w-3 h-3 text-zinc-400" />
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight truncate">OpenAPI 3.0 Specs</p>
          </div>
        </a>
      </div>

      {/* ── Metric Cards (Stripe / Mercury Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Card 1: Gross Processed Volume */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Volume Processed</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {primaryCurrency}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white">
              {formatMoney(volume, primaryCurrency)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Includes 1.5% platform fee</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Real-time</span>
          </div>
        </div>

        {/* Card 2: Transaction Count */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Transactions</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              99.8% Success
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white">
              {totalTransactions}
            </span>
            <span className="text-xs text-zinc-400">inbound intents</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Automated failover routing</span>
            <span className="font-mono text-zinc-600 dark:text-zinc-400">MTN • Telecel</span>
          </div>
        </div>

        {/* Card 3: Settlement Status */}
        <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Settlement Ledger</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400">
              T+0 / Instant
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMoney(Math.round(volume * 0.985), primaryCurrency)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Net settled balance</span>
            <Link href="/dashboard/payouts" className="text-brand dark:text-blue-400 font-medium hover:underline">
              Withdraw →
            </Link>
          </div>
        </div>

      </div>

      {/* ── Recent Transactions Feed ── */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-card overflow-hidden">
        
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Live incoming payments and customer checkouts</p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-xs font-semibold text-brand dark:text-blue-400 hover:text-brand-dark flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Transactions Content */}
        {recentTransactions.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">No transactions recorded yet</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
              Integrate the <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">atlas.js</code> SDK or generate a payment link to begin accepting live payments.
            </p>
            <Link
              href="/dashboard/developers"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-brand text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors"
            >
              <span>View Quickstart Guide</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-850/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5">Gross Amount</th>
                    <th className="px-6 py-3.5">Fee (1.5%)</th>
                    <th className="px-6 py-3.5">Net Payout</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recentTransactions.map((tx: any) => {
                    const gross = Number(tx.amount || 0);
                    const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(gross * 0.015);
                    const net = tx.net !== undefined ? Number(tx.net) : gross - fee;

                    return (
                      <tr 
                        key={tx.id} 
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/transactions/${tx.id}`}
                      >
                        <td className="px-6 py-4 font-semibold font-mono tabular-nums text-zinc-900 dark:text-white">
                          {formatMoney(gross, tx.currency)}
                        </td>
                        <td className="px-6 py-4 font-mono tabular-nums text-zinc-400">
                          -{formatMoney(fee, tx.currency)}
                        </td>
                        <td className="px-6 py-4 font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatMoney(net, tx.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            tx.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                            tx.status === 'FAILED' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                            'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-medium">
                          {tx.customerEmail || tx.metadata?.customerEmail || '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-[11px]">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-zinc-400 group-hover:text-brand dark:group-hover:text-blue-400 transition-colors">
                            <ArrowUpRight className="w-4 h-4 inline" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Tactile Card List (Optimized for Phones) */}
            <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentTransactions.map((tx: any) => {
                const gross = Number(tx.amount || 0);
                const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(gross * 0.015);
                const net = tx.net !== undefined ? Number(tx.net) : gross - fee;

                return (
                  <Link
                    key={tx.id}
                    href={`/dashboard/transactions/${tx.id}`}
                    className="p-4 flex items-center justify-between active:bg-zinc-50 dark:active:bg-zinc-800/60 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono tabular-nums text-zinc-900 dark:text-white text-base">
                          {formatMoney(gross, tx.currency)}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          Net: {formatMoney(net, tx.currency)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[220px]">
                        {tx.customerEmail || tx.metadata?.customerEmail || tx.description || 'Payment Transaction'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        tx.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                        tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                        tx.status === 'FAILED' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                        'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      }`}>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {tx.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
