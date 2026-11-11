'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { Search, ArrowUpRight, Activity, Download, ChevronRight } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

const STATUS_STYLES: Record<string, string> = {
  SUCCEEDED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  COMPLETED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CREATED:   'bg-blue-50 text-blue-700 border border-blue-200',
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
  FAILED:    'bg-red-50 text-red-700 border border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border border-slate-200',
  REFUNDED:  'bg-purple-50 text-purple-700 border border-purple-200',
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
  const PAGE_SIZE = 10;

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
      if (rows.length === 0) { toastError('No data to export', 'There are no transactions matching your current filters.'); return; }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{total.toLocaleString()} total payment intents</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search email, ID or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All Statuses</option>
          <option value="SUCCEEDED">Succeeded</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="CREATED">Created</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No transactions found</h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm">
              {search || status ? 'Try adjusting your search filters.' : 'Transactions will appear here once payments are initiated.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Gross Amount', 'Fee (1.5%)', 'Net', 'Status', 'Customer', 'Date', ''].map(h => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx: any) => {
                    const gross = Number(tx.amount || 0);
                    const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(gross * 0.015);
                    const net = tx.net !== undefined ? Number(tx.net) : gross - fee;
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatMoney(gross, tx.currency)}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          -{formatMoney(fee, tx.currency)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">
                          {formatMoney(net, tx.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[tx.status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {tx.status?.charAt(0) + (tx.status?.slice(1).toLowerCase() ?? '')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{tx.customerEmail || <span className="text-slate-300">—</span>}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Visible only on Mobile) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {transactions.map((tx: any) => {
                const gross = Number(tx.amount || 0);
                const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(gross * 0.015);
                const net = tx.net !== undefined ? Number(tx.net) : gross - fee;
                return (
                  <div
                    key={tx.id}
                    onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                    className="p-4 active:bg-blue-50/50 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatMoney(gross, tx.currency)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[tx.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {tx.status?.charAt(0) + (tx.status?.slice(1).toLowerCase() ?? '')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                      <span className="text-slate-500">
                        Fee: <span className="font-mono text-slate-600">-{formatMoney(fee, tx.currency)}</span>
                      </span>
                      <span className="font-semibold text-emerald-600">
                        Net: {formatMoney(net, tx.currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                      <span className="truncate max-w-[200px] font-medium text-slate-600">
                        {tx.customerEmail || tx.description || 'Payment'}
                      </span>
                      <span>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-sm"
          >
            ← Previous
          </button>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
