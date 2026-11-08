'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Plus } from 'lucide-react';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formBeneficiaryId, setFormBeneficiaryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payoutsRes, beneficiariesRes] = await Promise.all([
        apiFetch('/v1/payouts').catch(() => ({ items: [] })),
        apiFetch('/v1/beneficiaries').catch(() => [])
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
    try {
      await apiFetch('/v1/payouts', {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryId: formBeneficiaryId,
          amount: Math.round(parseFloat(formAmount) * 100),
          currency: formCurrency,
          description: formDescription
        })
      });
      setIsModalOpen(false);
      setFormAmount('');
      setFormDescription('');
      fetchData();
    } catch (error) {
      console.error('Failed to create payout', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Payouts</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Payout
        </button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {loading ? (
          <div className="p-10 text-center">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No payouts yet. Add a beneficiary and send your first payout.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Beneficiary</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout: any) => (
                  <tr key={payout.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">
                      {(payout.amount / 100).toFixed(2)} {payout.currency}
                    </td>
                    <td className="px-6 py-4">
                      {beneficiaries.find(b => b.id === payout.beneficiaryId)?.name || payout.beneficiaryId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{payout.destinationAccount || 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(payout.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create New Payout</h2>
            <form onSubmit={handleCreatePayout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Beneficiary</label>
                <select
                  required
                  value={formBeneficiaryId}
                  onChange={e => setFormBeneficiaryId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select a beneficiary</option>
                  {beneficiaries.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="0.00"
                  min="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <input
                  type="text"
                  required
                  value={formCurrency}
                  onChange={e => setFormCurrency(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
