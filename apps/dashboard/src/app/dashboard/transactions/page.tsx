'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { 
  Search, 
  ArrowUpRight, 
  Activity, 
  Download, 
  ChevronRight, 
  Filter, 
  X,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  SUCCEEDED: { 
    label: 'Succeeded', 
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  COMPLETED: { 
    label: 'Completed', 
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500'
  },
  CREATED: { 
    label: 'Created', 
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500'
  },
  PENDING: { 
    label: 'Pending', 
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500 animate-pulse'
  },
  FAILED: { 
    label: 'Failed', 
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-400'
  },
  REFUNDED: { 
    label: 'Refunded', 
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500'
  },
};

function downloadCSV(rows: any[]) {
  const headers = ['ID', 'Gross Amount', 'Currency', 'Fee (1.5%)', 'Net Amount', 'Status', 'Customer Email', 'Description', 'Created At'];
  const csvRows = [
    headers.join(','),
    ...rows.map(tx => {
      const gross = Number(tx.amount || 0);
      const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(gross * 0.015);
      const net = tx.net !== undefined ? Number(tx.net) : gross - fee;
      return [
        tx.id,
        (gross / 100).toFixed(2),
        tx.currency ?? 'GHS',
        (fee / 100).toFixed(2),
        (net / 100).toFixed(2),
        tx.status,
        tx.customerEmail ?? '',
        `"${(tx.description ?? '').replace(/"/g, '""')}"`,
        tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
      ].join(',');
    }),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atlas-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const router = useRouter();
  const { error: toastError, success } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const filterChips = [
    { label: 'All', value: '' },
    { label: 'Succeeded', value: 'SUCCEEDED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Refunded', value: 'REFUNDED' },
  ];

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        take: String(PAGE_SIZE),
        skip: String((page - 1) * PAGE_SIZE),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });
      const res = await apiFetch<any>(`/v1/payment-intents?${query.toString()}`);
      const items = res?.items ?? res?.data ?? [];
      const totalCount = res?.pagination?.total ?? res?.total ?? items.length;
      setTransactions(items);
      setTotal(totalCount);
    } catch (e: any) {
      toastError('Failed to load transactions', e?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const query = new URLSearchParams({
        page: '1',
        limit: '100',
        take: '100',
        skip: '0',
        ...(status ? { status } : {}),
        ...(search ? { search } : {})
      });
      const res = await apiFetch<any>(`/v1/payment-intents?${query.toString()}`);
      const rows = res?.items ?? res?.data ?? [];
      if (rows.length === 0) { 
        toastError('No data to export', 'There are no transactions matching your current filters.'); 
        return; 
      }
      downloadCSV(rows);
      success('Export complete', `Downloaded ${rows.length} transactions as CSV.`);
    } catch (e: any) {
      toastError('Export failed', e?.message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      
      {/* ── Page Header & Export ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Transactions & Settlements
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time ledger breakdown with 1.5% platform fee calculation.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition shadow-subtle active:scale-95 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* ── HCI Filter Chips & Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Horizontal Tap-Friendly Filter Chips (No clunky select!) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {filterChips.map(chip => {
            const isSelected = status === chip.value;
            return (
              <button
                key={chip.label}
                onClick={() => {
                  setStatus(chip.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/90 dark:border-zinc-800/90 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search email, ID or ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPage(1); fetchTransactions(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* ── Transaction Content Area ── */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-400 animate-pulse">
            Loading ledger transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">No transactions found</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {search || status ? 'No matches for your search filters. Try clearing your search.' : 'Transactions will populate here automatically as customers check out.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-850/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5">Gross Amount</th>
                    <th className="px-6 py-3.5">Fee (1.5%)</th>
                    <th className="px-6 py-3.5">Net Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {transactions.map((tx: any) => {
                    const gross = Number(tx.amount || 0);
                    const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(gross * 0.015);
                    const net = tx.net !== undefined ? Number(tx.net) : gross - fee;
                    const st = STATUS_CONFIG[tx.status] || { label: tx.status, badge: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' };

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
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
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-medium">
                          {tx.customerEmail || <span className="text-zinc-400">—</span>}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-[11px] whitespace-nowrap">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
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

            {/* Mobile Card List (Thumb-Friendly, Highly Readable) */}
            <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((tx: any) => {
                const gross = Number(tx.amount || 0);
                const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(gross * 0.015);
                const net = tx.net !== undefined ? Number(tx.net) : gross - fee;
                const st = STATUS_CONFIG[tx.status] || { label: tx.status, badge: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' };

                return (
                  <div
                    key={tx.id}
                    onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                    className="p-4 active:bg-zinc-50 dark:active:bg-zinc-800/60 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-semibold font-mono tabular-nums text-zinc-900 dark:text-white">
                          {formatMoney(gross, tx.currency)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          (Fee: -{formatMoney(fee, tx.currency)})
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.badge}`}>
                        <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Net: {formatMoney(net, tx.currency)}
                      </span>
                      <span>
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100/80 dark:border-zinc-800/80 text-[11px] text-zinc-400">
                      <span className="truncate max-w-[240px]">
                        {tx.customerEmail || tx.description || 'Payment'}
                      </span>
                      <span className="text-brand dark:text-blue-400 font-medium flex items-center gap-0.5">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {total > PAGE_SIZE && (
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>Showing {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * PAGE_SIZE >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
