'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { ArrowLeft, RefreshCw, Copy, CheckCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  SUCCEEDED: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Succeeded' },
  COMPLETED:  { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
  CREATED:   { pill: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-500',    label: 'Created' },
  PENDING:   { pill: 'bg-amber-50 text-amber-700 border-amber-200',        dot: 'bg-amber-500',   label: 'Pending' },
  FAILED:    { pill: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500',     label: 'Failed' },
  CANCELLED: { pill: 'bg-slate-100 text-slate-600 border-slate-200',       dot: 'bg-slate-400',   label: 'Cancelled' },
  REFUNDED:  { pill: 'bg-purple-50 text-purple-700 border-purple-200',     dot: 'bg-purple-500',  label: 'Refunded' },
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
    <button onClick={copy} className="ml-2 p-1 rounded text-slate-400 hover:text-slate-600 transition-colors">
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
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  if (!tx) return null;

  const status = STATUS_STYLES[tx.status] ?? STATUS_STYLES['PENDING'];
  const amount = typeof tx.amount === 'bigint' ? Number(tx.amount) : Number(tx.amount ?? 0);
  const formatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: tx.currency || 'GHS' }).format(amount / 100);
  const attempts = tx.attempts ?? tx.paymentAttempts ?? [];
  const currentStep = TIMELINE_STEPS.indexOf(tx.status);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <div>
        <Link href="/dashboard/transactions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Transactions
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{formatted}</h1>
            <p className="text-slate-400 text-sm mt-1 font-mono">{tx.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${status.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {tx.status === 'SUCCEEDED' && (
              <button onClick={handleRefund}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                Issue Refund
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Payment Details</h2>
            <dl className="space-y-3">
              {[
                ['Amount',      formatted],
                ['Currency',    tx.currency ?? 'GHS'],
                ['Description', tx.description || '—'],
                ['Customer',    tx.customerEmail || tx.customer?.email || '—'],
                ['Reference',   tx.providerReference || tx.idempotencyKey || '—'],
                ['Provider',    tx.provider ?? 'paystack'],
                ['Created',     tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'],
                ['Updated',     tx.updatedAt ? new Date(tx.updatedAt).toLocaleString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <dt className="text-slate-400 font-medium">{k}</dt>
                  <dd className="text-slate-900 font-medium text-right flex items-center">
                    {v}
                    {(k === 'Reference' || k === 'Amount') && v !== '—' && <CopyButton value={String(v)} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Metadata */}
          {tx.metadata && Object.keys(tx.metadata).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Metadata</h2>
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(tx.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Payment attempts */}
          {attempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Payment Attempts ({attempts.length})</h2>
              <div className="space-y-3">
                {attempts.map((a: any, i: number) => {
                  const s = STATUS_STYLES[a.status] ?? STATUS_STYLES['PENDING'];
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{a.provider || 'paystack'}</p>
                          <p className="text-xs text-slate-400 font-mono">{a.providerTransactionId || '—'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>{s.label}</span>
                        <p className="text-xs text-slate-400 mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right — status timeline */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">Status Timeline</h2>
            <div className="relative">
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-100" />
              <ol className="space-y-5 relative">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <li key={step} className="flex items-start gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        active ? 'bg-blue-600 shadow-md shadow-blue-200' : done ? 'bg-emerald-500' : 'bg-slate-100'
                      }`}>
                        {done && !active
                          ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                          : active
                            ? <span className="w-2 h-2 rounded-full bg-white" />
                            : <span className="w-2 h-2 rounded-full bg-slate-300" />
                        }
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-semibold ${active ? 'text-blue-700' : done ? 'text-slate-900' : 'text-slate-300'}`}>
                          {step.charAt(0) + step.slice(1).toLowerCase()}
                        </p>
                        {active && tx.updatedAt && (
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(tx.updatedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => navigator.clipboard.writeText(tx.id).then(() => success('Copied!', 'Transaction ID copied to clipboard'))}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-left">
                <Copy className="w-4 h-4 text-slate-400" /> Copy Transaction ID
              </button>
              <Link href={`/dashboard/refunds`}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-400" /> View Refunds
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
