'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Plus, ArrowUpRight, CheckCircle2, Clock, AlertCircle, Building2, Phone } from 'lucide-react';
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payouts & Withdrawals</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Send outbound transfers directly to Mobile Money wallets and bank accounts across Africa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/beneficiaries"
            className="px-4 py-2 border border-slate-200 bg-white text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            Manage Beneficiaries
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Payout</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No payouts initiated yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your Ghana Mobile Money or bank account in Beneficiaries, then initiate your first withdrawal here.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/beneficiaries"
                className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                <span>Add First Beneficiary</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/70 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Beneficiary</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Account / Rail</th>
                  <th className="px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((payout: any) => {
                  const bene = beneficiaries.find((b) => b.id === payout.beneficiaryId);
                  const isSettled = payout.status === 'SETTLED' || payout.status === 'SUCCESS';
                  const isPending = payout.status === 'PENDING' || payout.status === 'CREATED';

                  return (
                    <tr key={payout.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatMoney(Number(payout.amount) / 100, payout.currency)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {bene?.name || payout.beneficiaryId}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isSettled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isSettled ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isPending ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          <span>{payout.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {bene?.accountNumber || payout.destinationAccount || 'Mobile Money'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(payout.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Initiate Payout Transfer</h2>
              <p className="text-xs text-slate-500 mt-0.5">Withdraw funds directly to an African bank or Mobile Money wallet.</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreatePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary *</label>
                {beneficiaries.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
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
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    placeholder="10.00"
                    min="0.10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Weekly merchant payout"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formBeneficiaryId || !formAmount}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shadow-sm shadow-blue-500/20"
                >
                  {submitting ? 'Initiating…' : 'Execute Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
