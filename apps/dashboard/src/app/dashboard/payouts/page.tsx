'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Phone,
  ChevronRight,
  Send,
  X
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import Link from 'next/link';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formBeneficiaryId, setFormBeneficiaryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('GHS');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payoutsRes, beneficiariesRes] = await Promise.all([
        apiFetch('/v1/payouts').catch(() => ({ items: [] })),
        apiFetch('/v1/beneficiaries').catch(() => []),
      ]);
      setPayouts((payoutsRes as any)?.items || []);
      setBeneficiaries(Array.isArray(beneficiariesRes) ? beneficiariesRes : (beneficiariesRes as any)?.items || []);
    } catch (error) {
      console.error('Error fetching payouts data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid payout amount');
      setSubmitting(false);
      return;
    }

    try {
      await apiFetch('/v1/payouts', {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: formBeneficiaryId,
          amount: parsedAmount, // Major units
          currency: formCurrency.toUpperCase(),
          provider: 'paystack',
          idempotencyKey: `payout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          description: formDescription || 'ATLAS Payout',
        }),
      });

      setIsModalOpen(false);
      setFormAmount('');
      setFormDescription('');
      fetchData();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to initiate payout transfer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Payouts & Withdrawals
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Instant disbursements to Ghana Mobile Money wallets (MTN/Telecel) and bank accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/beneficiaries"
            className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition shadow-subtle active:scale-95"
          >
            Manage Beneficiaries
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Payout</span>
          </button>
        </div>
      </div>

      {/* ── Fee Notice Banner ── */}
      <div className="p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between text-xs">
        <span className="text-zinc-700 dark:text-zinc-300">
          💡 <strong>Transparent Fee:</strong> A flat <strong>GHS 1.00</strong> fee applies to automated outbound mobile and bank payouts.
        </span>
        <span className="text-[11px] font-mono font-medium text-brand dark:text-blue-400 hidden sm:inline">
          Sub-second settlement
        </span>
      </div>

      {/* ── Payouts Table / Card List ── */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-400 animate-pulse">
            Loading payout records...
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">No payouts initiated yet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Add your Ghana Mobile Money or bank account in Beneficiaries, then initiate your first withdrawal here.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/beneficiaries"
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-800 transition"
              >
                <span>Add First Beneficiary</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-850/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5">Net Amount</th>
                    <th className="px-6 py-3.5">Beneficiary</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Account / Rail</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {payouts.map((payout: any) => {
                    const bene = beneficiaries.find((b) => b.id === payout.beneficiaryId);
                    const isSettled = payout.status === 'SETTLED' || payout.status === 'SUCCESS';
                    const isPending = payout.status === 'PENDING' || payout.status === 'CREATED';

                    return (
                      <tr key={payout.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                        <td className="px-6 py-4 font-semibold font-mono tabular-nums text-zinc-900 dark:text-white">
                          {formatMoney(Number(payout.amount) / 100, payout.currency)}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                          {bene?.name || payout.beneficiaryId}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                              isSettled
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{payout.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500 font-mono">
                          {bene?.accountNumber || payout.destinationAccount || 'Mobile Money'}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">
                          {new Date(payout.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Payouts Card List */}
            <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {payouts.map((payout: any) => {
                const bene = beneficiaries.find((b) => b.id === payout.beneficiaryId);
                const isSettled = payout.status === 'SETTLED' || payout.status === 'SUCCESS';
                const isPending = payout.status === 'PENDING' || payout.status === 'CREATED';

                return (
                  <div key={payout.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold font-mono tabular-nums text-zinc-900 dark:text-white text-base">
                        {formatMoney(Number(payout.amount) / 100, payout.currency)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isSettled
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span>{payout.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {bene?.name || 'Beneficiary'}
                      </span>
                      <span className="font-mono text-[11px]">
                        {bene?.accountNumber || 'Mobile Money'}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400">
                      {new Date(payout.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Mobile-Optimized Bottom Sheet / Desktop Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container (Bottom Sheet on Mobile, Centered Card on Desktop) */}
          <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
                  Initiate Payout Transfer
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Send funds to Ghana Mobile Money or bank account.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreatePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Beneficiary Destination *
                </label>
                {beneficiaries.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-400">
                    No beneficiaries configured. Please{' '}
                    <Link href="/dashboard/beneficiaries" className="underline font-bold">
                      add a beneficiary first
                    </Link>
                    .
                  </div>
                ) : (
                  <select
                    required
                    value={formBeneficiaryId}
                    onChange={(e) => setFormBeneficiaryId(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  >
                    <option value="">Select a beneficiary</option>
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.accountNumber} - {b.bankCode || b.mobileNetwork || b.accountType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30 font-mono tabular-nums"
                    placeholder="10.00"
                    min="0.10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Currency *
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  >
                    <option value="GHS">GHS (GH₵)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Transfer Note
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Weekly vendor disbursement"
                  className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-500 flex justify-between">
                <span>Fee deducted on transfer:</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">GHS 1.00</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formBeneficiaryId || !formAmount}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  {submitting ? 'Executing…' : 'Execute Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
