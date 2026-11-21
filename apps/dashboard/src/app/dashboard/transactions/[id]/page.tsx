'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { ArrowLeft, RefreshCw, Copy, CheckCircle, ChevronLeft } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

const DEFAULT_STATUS_STYLE = { pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500', label: 'Pending' };

const STATUS_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  SUCCEEDED: { pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', label: 'Succeeded' },
  COMPLETED: { pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', label: 'Completed' },
  CREATED: { pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500', label: 'Created' },
  PENDING: DEFAULT_STATUS_STYLE,
  FAILED: { pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500', label: 'Failed' },
  CANCELLED: { pill: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700', dot: 'bg-zinc-400', label: 'Cancelled' },
  REFUNDED: { pill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500', label: 'Refunded' },
};

const TIMELINE_STEPS = ['CREATED', 'PENDING', 'SUCCEEDED'];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { error: toastError, success } = useToast();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const id = params?.id as string;

  useEffect(() => {
    if (!id) return;
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/v1/payment-intents/${id}`);
      setTx(data);
    } catch (e: any) {
      toastError('Transaction not found', e?.message);
      router.push('/dashboard/transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('Issue a full refund for this transaction?')) return;
    try {
      await apiFetch('/v1/refunds', {
        method: 'POST',
        body: JSON.stringify({ paymentId: id, amount: tx.amount, reason: 'REQUESTED_BY_CUSTOMER' }),
      });
      success('Refund initiated', 'The refund is being processed.');
      fetchTransaction();
    } catch (e: any) {
      toastError('Refund failed', e?.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <RefreshCw className="w-6 h-6 animate-spin text-brand dark:text-blue-400" />
    </div>
  );

  if (!tx) return null;

  const status = STATUS_STYLES[tx.status] ?? DEFAULT_STATUS_STYLE;
  const amount = typeof tx.amount === 'bigint' ? Number(tx.amount) : Number(tx.amount ?? 0);
  const fee = tx.fee !== undefined ? Number(tx.fee) : Math.round(amount * 0.015);
  const net = tx.net !== undefined ? Number(tx.net) : amount - fee;
  const formatted = formatMoney(amount, tx.currency);
  const formattedFee = formatMoney(fee, tx.currency);
  const formattedNet = formatMoney(net, tx.currency);
  const attempts = tx.attempts ?? tx.paymentAttempts ?? [];
  const currentStep = TIMELINE_STEPS.indexOf(tx.status);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link 
          href="/dashboard/transactions" 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Transactions
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {formatted}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-mono break-all">{tx.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {tx.status === 'SUCCEEDED' && (
              <button 
                onClick={handleRefund}
                className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
              >
                Issue Refund
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-card p-5 sm:p-6">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
              Financial Breakdown
            </h3>
            <dl className="space-y-3.5">
              {[
                ['Gross Amount', formatted],
                ['Processing Fee (1.5%)', formattedFee],
                ['Net Settled Amount', formattedNet],
                ['Currency', tx.currency ?? 'GHS'],
                ['Description', tx.description || '—'],
                ['Customer', tx.customerEmail || tx.customer?.email || '—'],
                ['Provider Reference', tx.providerReference || tx.idempotencyKey || '—'],
                ['Clearing Provider', tx.provider ?? 'paystack'],
                ['Created At', tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'],
                ['Updated At', tx.updatedAt ? new Date(tx.updatedAt).toLocaleString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400 font-medium">{k}</dt>
                  <dd className={`font-medium text-right flex items-center ${
                    k === 'Net Settled Amount' ? 'text-emerald-600 dark:text-emerald-400 font-mono font-semibold' : 'text-zinc-900 dark:text-zinc-100 font-mono tabular-nums'
                  }`}>
                    {v}
                    {(k === 'Provider Reference' || k === 'Gross Amount') && v !== '—' && <CopyButton value={String(v)} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Payment attempts */}
          {attempts.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-card p-5 sm:p-6">
              <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
                Carrier Routing Attempts ({attempts.length})
              </h3>
              <div className="space-y-2.5">
                {attempts.map((a: any, i: number) => {
                  const s = (a.status ? STATUS_STYLES[a.status] : null) ?? DEFAULT_STATUS_STYLE;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <div>
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{a.provider || 'MTN / Telecel'}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{a.providerTransactionId || '—'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>{s.label}</span>
                        <p className="text-[10px] text-zinc-400 mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right — status timeline & quick actions */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-card p-5 sm:p-6">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-5">
              Settlement Timeline
            </h3>
            <div className="relative">
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              <ol className="space-y-5 relative">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <li key={step} className="flex items-start gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        active ? 'bg-brand text-white shadow-md' : done ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}>
                        {done && !active
                          ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                          : active
                            ? <span className="w-2 h-2 rounded-full bg-white" />
                            : <span className="w-2 h-2 rounded-full bg-zinc-400" />
                        }
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-xs font-semibold ${active ? 'text-brand dark:text-blue-400' : done ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                          {step.charAt(0) + step.slice(1).toLowerCase()}
                        </p>
                        {active && tx.updatedAt && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(tx.updatedAt).toLocaleTimeString()}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-card p-5">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1.5">
              <button 
                onClick={() => navigator.clipboard.writeText(tx.id).then(() => success('Copied!', 'Transaction ID copied'))}
                className="w-full flex items-center gap-2 p-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-400" /> 
                <span>Copy Transaction ID</span>
              </button>
              <Link 
                href="/dashboard/refunds"
                className="w-full flex items-center gap-2 p-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400" /> 
                <span>View Refunds History</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
