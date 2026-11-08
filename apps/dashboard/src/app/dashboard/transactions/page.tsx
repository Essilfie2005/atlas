'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { Search, ArrowUpRight, Activity, Download } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  SUCCEEDED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  COMPLETED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CREATED:   'bg-blue-50 text-blue-700 border border-blue-200',
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
  FAILED:    'bg-red-50 text-red-700 border border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border border-slate-200',
  REFUNDED:  'bg-purple-50 text-purple-700 border border-purple-200',
};

function formatAmount(amount: number, currency = 'GHS') {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(amount / 100);
}

function downloadCSV(rows: any[]) {
  const headers = ['ID', 'Amount (GHS)', 'Currency', 'Status', 'Customer Email', 'Description', 'Created At'];
  const csvRows = [
    headers.join(','),
    ...rows.map(tx => [
      tx.id,
      (Number(tx.amount) / 100).toFixed(2),
      tx.currency ?? 'GHS',
      tx.status,
      tx.customerEmail ?? '',
      `"${(tx.description ?? '').replace(/"/g, '""')}"`,
      tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
    ].join(',')),
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
      success('Export ready', `${rows.length} transactions downloaded as CSV`);
    } catch (e: any) {
      toastError('Export failed', e?.message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [page, status]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchTransactions(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">{total.toLocaleString()} total payment intents</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email, ID or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <Activity className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No transactions found</h3>
            <p className="text-slate-400 text-sm">
              {search || status ? 'Try adjusting your filters.' : 'Transactions will appear here once payments start flowing.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Amount', 'Status', 'Customer', 'Description', 'Date', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatAmount(tx.amount, tx.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[tx.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {tx.status?.charAt(0) + (tx.status?.slice(1).toLowerCase() ?? '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{tx.customerEmail || <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{tx.description || <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-transparent transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50 disabled:hover:bg-transparent transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
